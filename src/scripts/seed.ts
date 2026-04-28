import "dotenv/config";

import { count, eq } from "drizzle-orm";

import { db } from "../db";
import {
  account,
  auditLog,
  movement,
  movementEvent,
  user,
  wbpRecord,
} from "../db/schema";
import { auth } from "../lib/auth";
import {
  createSeedMovements,
  operators,
  seedWbps,
  type Destination,
  type MovementRecord,
  type OperatorUser,
  type WbpRecord,
} from "../lib/domain";

const defaultPassword = "Password123!";

function originFromWbp(wbp: Pick<WbpRecord, "roomBlock" | "roomNumber">) {
  return `Blok ${wbp.roomBlock}-${wbp.roomNumber}`;
}

function assignmentFromOperator(operator: OperatorUser) {
  return operator.assignment ?? "Administrasi";
}

async function ensureUserRecord(payload: {
  name: string;
  email: string;
  password: string;
  role: OperatorUser["role"] | "Superadmin";
  assignment: string;
}) {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, payload.email),
  });

  if (existing) {
    return existing;
  }

  const response = await auth.api.signUpEmail({
    headers: new Headers(),
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
      assignment: payload.assignment,
    },
  });

  const created = await db.query.user.findFirst({
    where: eq(user.id, response.user.id),
  });

  if (!created) {
    throw new Error(`Gagal membuat user ${payload.email}`);
  }

  return created;
}

async function seedUsers() {
  const seededUsers = new Map<string, Awaited<ReturnType<typeof ensureUserRecord>>>();

  const superadmin = await ensureUserRecord({
    name: "Superadmin Silo WBP",
    email: "superadmin@silowbp.local",
    password: defaultPassword,
    role: "Superadmin",
    assignment: "Administrasi",
  });

  seededUsers.set(superadmin.name, superadmin);

  for (const operator of operators) {
    const emailSlug = operator.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");

    const record = await ensureUserRecord({
      name: operator.name,
      email: `${emailSlug}@silowbp.local`,
      password: defaultPassword,
      role: operator.role,
      assignment: assignmentFromOperator(operator),
    });

    seededUsers.set(operator.name, record);
  }

  return seededUsers;
}

async function seedWbpRecords(actorId: string) {
  for (const item of seedWbps) {
    await db
      .insert(wbpRecord)
      .values({
        id: item.id,
        registrationNumber: item.registrationNumber,
        fullName: item.fullName,
        roomBlock: item.roomBlock,
        roomNumber: item.roomNumber,
        photoUrl: item.photoUrl,
        createdByUserId: actorId,
        updatedByUserId: actorId,
      })
      .onConflictDoUpdate({
        target: wbpRecord.registrationNumber,
        set: {
          fullName: item.fullName,
          roomBlock: item.roomBlock,
          roomNumber: item.roomNumber,
          photoUrl: item.photoUrl,
          updatedAt: new Date(),
          updatedByUserId: actorId,
        },
      });
  }
}

function roomOfficerNameForDestination(destination: Destination) {
  return (
    operators.find((item) => item.assignment === destination)?.name ??
    "Petugas Ruangan"
  );
}

async function seedMovements(userMap: Map<string, Awaited<ReturnType<typeof ensureUserRecord>>>) {
  const movementCount = await db.select({ total: count() }).from(movement);

  if ((movementCount[0]?.total ?? 0) > 0) {
    return;
  }

  const movements = createSeedMovements();

  for (const item of movements) {
    const doorOfficer = userMap.get(item.doorOfficer);
    const roomOfficerName = item.roomOfficer ?? roomOfficerNameForDestination(item.destination);
    const roomOfficer = userMap.get(roomOfficerName);

    if (!doorOfficer) {
      throw new Error(`Door officer ${item.doorOfficer} tidak ditemukan saat seed.`);
    }

    await db.insert(movement).values({
      id: item.id,
      wbpId: item.wbpId,
      origin: item.origin,
      destination: item.destination,
      status: item.status,
      departureAt: new Date(item.departureAt),
      arrivedAt: item.arrivedAt ? new Date(item.arrivedAt) : null,
      completedAt: item.completedAt ? new Date(item.completedAt) : null,
      returnedAt: item.returnedAt ? new Date(item.returnedAt) : null,
      doorOfficerId: doorOfficer.id,
      roomOfficerId: roomOfficer?.id ?? null,
      updatedByUserId: roomOfficer?.id ?? doorOfficer.id,
      updatedAt: new Date(item.updatedAt),
    });

    await seedMovementEvents(item, doorOfficer.id, roomOfficer?.id ?? null, doorOfficer.name);
  }
}

async function seedMovementEvents(
  item: MovementRecord,
  doorOfficerId: string,
  roomOfficerId: string | null,
  doorOfficerName: string,
) {
  const roomOfficerName = item.roomOfficer ?? roomOfficerNameForDestination(item.destination);

  await db.insert(movementEvent).values({
    id: `${item.id}-depart`,
    movementId: item.id,
    wbpId: item.wbpId,
    eventType: "Dispatch",
    eventLabel: `Dikirim ke ${item.destination}`,
    destination: item.destination,
    status: "Transit",
    operatorId: doorOfficerId,
    operatorName: doorOfficerName,
    timestamp: new Date(item.departureAt),
    metadata: {
      origin: item.origin,
    },
  });

  if (item.arrivedAt) {
    await db.insert(movementEvent).values({
      id: `${item.id}-arrive`,
      movementId: item.id,
      wbpId: item.wbpId,
      eventType: "Arrival",
      eventLabel: `Konfirmasi sampai di ${item.destination}`,
      destination: item.destination,
      status: "Tiba",
      operatorId: roomOfficerId,
      operatorName: roomOfficerName,
      timestamp: new Date(item.arrivedAt),
      metadata: null,
    });
  }

  if (item.completedAt) {
    await db.insert(movementEvent).values({
      id: `${item.id}-complete`,
      movementId: item.id,
      wbpId: item.wbpId,
      eventType: "Complete",
      eventLabel: `Selesai layanan ${item.destination}`,
      destination: item.destination,
      status: "Selesai",
      operatorId: roomOfficerId,
      operatorName: roomOfficerName,
      timestamp: new Date(item.completedAt),
      metadata: null,
    });
  }

  if (item.returnedAt) {
    await db.insert(movementEvent).values({
      id: `${item.id}-return`,
      movementId: item.id,
      wbpId: item.wbpId,
      eventType: "Return",
      eventLabel: "Dikonfirmasi kembali ke blok",
      destination: item.destination,
      status: "Kembali",
      operatorId: doorOfficerId,
      operatorName: doorOfficerName,
      timestamp: new Date(item.returnedAt),
      metadata: null,
    });
  }
}

async function seedAuditLogs(actorId: string) {
  const existing = await db.select({ total: count() }).from(auditLog);

  if ((existing[0]?.total ?? 0) > 0) {
    return;
  }

  await db.insert(auditLog).values([
    {
      id: "audit-bootstrap",
      actorUserId: actorId,
      actorName: "Superadmin Silo WBP",
      actorRole: "Superadmin",
      action: "system.bootstrap",
      entityType: "system",
      entityId: "bootstrap",
      description: "Seed awal sistem Silo WBP berhasil dijalankan.",
      metadata: {
        users: operators.length + 1,
        wbps: seedWbps.length,
      },
      createdAt: new Date(),
    },
  ]);
}

async function main() {
  const users = await seedUsers();
  const superadmin = users.get("Superadmin Silo WBP");

  if (!superadmin) {
    throw new Error("Superadmin seed tidak berhasil dibuat.");
  }

  await seedWbpRecords(superadmin.id);
  await seedMovements(users);
  await seedAuditLogs(superadmin.id);

  const totals = {
    users: (await db.select({ total: count() }).from(user))[0]?.total ?? 0,
    accounts: (await db.select({ total: count() }).from(account))[0]?.total ?? 0,
    wbps: (await db.select({ total: count() }).from(wbpRecord))[0]?.total ?? 0,
    movements: (await db.select({ total: count() }).from(movement))[0]?.total ?? 0,
    events: (await db.select({ total: count() }).from(movementEvent))[0]?.total ?? 0,
  };

  console.log("Seed selesai.", totals);
  console.log("Login awal:");
  console.log("email: superadmin@silowbp.local");
  console.log(`password: ${defaultPassword}`);
}

main()
  .catch((error) => {
    console.error("Seed gagal.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
