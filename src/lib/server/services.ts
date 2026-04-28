import { randomUUID } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  auditLog,
  account,
  movement,
  movementEvent,
  session as authSession,
  user,
  wbpRecord,
  type WbpRecordRow,
} from "@/db/schema";
import { hashPassword } from "better-auth/crypto";

import { type SessionActor } from "./auth-helpers";
import {
  type AppDestination,
  type AppMovementStatus,
  getAlertLevelFromMinutes,
} from "./constants";
import { ApiError } from "./http";

function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

const SYSTEM_ARCHIVE_USER_ID = "user_system_archive";
const SYSTEM_ARCHIVE_EMAIL = "arsip.sistem@silowbp.local";
const SYSTEM_ARCHIVE_NAME = "Arsip Sistem";

function originFromWbp(wbp: Pick<WbpRecordRow, "roomBlock" | "roomNumber">) {
  return `Blok ${wbp.roomBlock}-${wbp.roomNumber}`;
}

function minutesBetween(value: Date | string, now = new Date()) {
  const date = typeof value === "string" ? new Date(value) : value;
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60_000));
}

async function writeAuditLog(
  executor: Pick<typeof db, "insert">,
  actor: SessionActor,
  payload: {
    action: string;
    entityType: string;
    entityId?: string | null;
    description: string;
    metadata?: Record<string, unknown>;
  },
) {
  await executor.insert(auditLog).values({
    id: createId("audit"),
    actorUserId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: payload.action,
    entityType: payload.entityType,
    entityId: payload.entityId ?? null,
    description: payload.description,
    metadata: payload.metadata ?? null,
  });
}

async function ensureArchiveUser(executor: Pick<typeof db, "select" | "insert">) {
  const existing = await executor
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, SYSTEM_ARCHIVE_USER_ID))
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  const now = new Date();

  await executor.insert(user).values({
    id: SYSTEM_ARCHIVE_USER_ID,
    name: SYSTEM_ARCHIVE_NAME,
    email: SYSTEM_ARCHIVE_EMAIL,
    emailVerified: true,
    role: "Admin",
    assignment: "Administrasi",
    isActive: false,
    createdAt: now,
    updatedAt: now,
  });

  return SYSTEM_ARCHIVE_USER_ID;
}

async function getUserMap(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    return new Map<string, { id: string; name: string; role: string }>();
  }

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      role: user.role,
    })
    .from(user)
    .where(inArray(user.id, uniqueUserIds));

  return new Map(rows.map((item) => [item.id, item]));
}

async function getMovementBaseRows(filters?: {
  destination?: AppDestination;
  status?: AppMovementStatus;
  search?: string;
  activeOnly?: boolean;
}) {
  const clauses = [];

  if (filters?.destination) {
    clauses.push(eq(movement.destination, filters.destination));
  }

  if (filters?.status) {
    clauses.push(eq(movement.status, filters.status));
  }

  if (filters?.activeOnly) {
    clauses.push(ne(movement.status, "Kembali"));
  }

  if (filters?.search) {
    clauses.push(
      or(
        ilike(wbpRecord.fullName, `%${filters.search}%`),
        ilike(wbpRecord.registrationNumber, `%${filters.search}%`),
      )!,
    );
  }

  return db
    .select({
      id: movement.id,
      wbpId: movement.wbpId,
      origin: movement.origin,
      destination: movement.destination,
      status: movement.status,
      departureAt: movement.departureAt,
      arrivedAt: movement.arrivedAt,
      completedAt: movement.completedAt,
      returnedAt: movement.returnedAt,
      doorOfficerId: movement.doorOfficerId,
      roomOfficerId: movement.roomOfficerId,
      updatedAt: movement.updatedAt,
      wbpRegistrationNumber: wbpRecord.registrationNumber,
      wbpFullName: wbpRecord.fullName,
      roomBlock: wbpRecord.roomBlock,
      roomNumber: wbpRecord.roomNumber,
      photoUrl: wbpRecord.photoUrl,
    })
    .from(movement)
    .innerJoin(wbpRecord, eq(movement.wbpId, wbpRecord.id))
    .where(clauses.length > 0 ? and(...clauses) : undefined)
    .orderBy(desc(movement.updatedAt));
}

function serializeMovementRow(
  row: Awaited<ReturnType<typeof getMovementBaseRows>>[number],
  userMap: Map<string, { id: string; name: string; role: string }>,
) {
  const timerStart = row.arrivedAt ?? row.departureAt;
  const durationMinutes = minutesBetween(timerStart);

  return {
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    status: row.status,
    departureAt: row.departureAt,
    arrivedAt: row.arrivedAt,
    completedAt: row.completedAt,
    returnedAt: row.returnedAt,
    updatedAt: row.updatedAt,
    durationMinutes,
    alertLevel: getAlertLevelFromMinutes(durationMinutes),
    wbp: {
      id: row.wbpId,
      registrationNumber: row.wbpRegistrationNumber,
      fullName: row.wbpFullName,
      roomBlock: row.roomBlock,
      roomNumber: row.roomNumber,
      photoUrl: row.photoUrl,
    },
    doorOfficer: row.doorOfficerId
      ? userMap.get(row.doorOfficerId) ?? {
          id: row.doorOfficerId,
          name: "Petugas Pintu 3",
          role: "Petugas Pintu 3",
        }
      : null,
    roomOfficer: row.roomOfficerId
      ? userMap.get(row.roomOfficerId) ?? {
          id: row.roomOfficerId,
          name: "Petugas Ruangan",
          role: "Petugas Ruangan",
        }
      : null,
  };
}

async function ensureNoActiveMovement(wbpId: string) {
  const existing = await db
    .select({ id: movement.id })
    .from(movement)
    .where(and(eq(movement.wbpId, wbpId), ne(movement.status, "Kembali")))
    .limit(1);

  if (existing[0]) {
    throw new ApiError(
      409,
      "WBP masih memiliki pergerakan aktif yang belum selesai.",
    );
  }
}

export async function listUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignment: user.assignment,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .where(ne(user.id, SYSTEM_ARCHIVE_USER_ID))
    .orderBy(asc(user.role), asc(user.name));
}

export async function updateUserAccount(
  actor: SessionActor,
  userId: string,
  payload: {
    role: "Superadmin" | "Admin" | "Petugas Pintu 3" | "Petugas Ruangan";
    assignment?: "Pintu 3" | "Administrasi" | "Klinik" | "Registrasi" | "Kunjungan";
    isActive: boolean;
  },
) {
  const existing = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existing) {
    throw new ApiError(404, "Akun user tidak ditemukan.");
  }

  if (existing.id === actor.id && payload.role !== "Superadmin") {
    throw new ApiError(
      409,
      "Superadmin yang sedang aktif tidak dapat menurunkan role dirinya sendiri.",
    );
  }

  const [updated] = await db
    .update(user)
    .set({
      role: payload.role,
      assignment: payload.assignment ?? null,
      isActive: payload.isActive,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignment: user.assignment,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });

  await writeAuditLog(db, actor, {
    action: "user.update",
    entityType: "user",
    entityId: updated.id,
    description: `Memperbarui akun ${updated.name}.`,
    metadata: {
      role: updated.role,
      assignment: updated.assignment,
      isActive: updated.isActive,
    },
  });

  return updated;
}

export async function resetUserPassword(
  actor: SessionActor,
  userId: string,
  newPassword: string,
) {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existingUser) {
    throw new ApiError(404, "Akun user tidak ditemukan.");
  }

  const passwordHash = await hashPassword(newPassword);
  const now = new Date();

  const credentialAccount = await db
    .select({
      id: account.id,
    })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .limit(1);

  await db.transaction(async (tx) => {
    if (credentialAccount[0]) {
      await tx
        .update(account)
        .set({
          password: passwordHash,
          updatedAt: now,
        })
        .where(eq(account.id, credentialAccount[0].id));
    } else {
      await tx.insert(account).values({
        id: createId("acct"),
        accountId: userId,
        providerId: "credential",
        userId,
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });
    }

    await tx.delete(authSession).where(eq(authSession.userId, userId));

    await writeAuditLog(tx, actor, {
      action: "user.password.reset",
      entityType: "user",
      entityId: existingUser.id,
      description: `Mengganti password akun ${existingUser.name}.`,
      metadata: {
        userId: existingUser.id,
        email: existingUser.email,
      },
    });
  });

  return {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
  };
}

export async function deleteUserAccount(actor: SessionActor, userId: string) {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existingUser) {
    throw new ApiError(404, "Akun user tidak ditemukan.");
  }

  if (existingUser.id === SYSTEM_ARCHIVE_USER_ID) {
    throw new ApiError(409, "Akun arsip sistem tidak dapat dihapus.");
  }

  if (existingUser.id === actor.id) {
    throw new ApiError(
      409,
      "Superadmin yang sedang aktif tidak dapat menghapus akunnya sendiri.",
    );
  }

  if (existingUser.role === "Superadmin") {
    const superadminCount = await db
      .select({
        total: sql<number>`count(*)`,
      })
      .from(user)
      .where(eq(user.role, "Superadmin"));

    if ((superadminCount[0]?.total ?? 0) <= 1) {
      throw new ApiError(
        409,
        "Superadmin terakhir tidak dapat dihapus dari sistem.",
      );
    }
  }

  await db.transaction(async (tx) => {
    const archiveUserId = await ensureArchiveUser(tx);

    await tx
      .update(movement)
      .set({
        doorOfficerId: archiveUserId,
      })
      .where(eq(movement.doorOfficerId, userId));

    await tx.delete(user).where(eq(user.id, userId));

    await writeAuditLog(tx, actor, {
      action: "user.delete",
      entityType: "user",
      entityId: existingUser.id,
      description: `Menghapus akun ${existingUser.name}.`,
      metadata: {
        email: existingUser.email,
        role: existingUser.role,
        assignment: existingUser.assignment,
      },
    });
  });

  return {
    id: existingUser.id,
    name: existingUser.name,
    email: existingUser.email,
  };
}

export async function listWbps(search?: string) {
  const clause = search
    ? or(
        ilike(wbpRecord.fullName, `%${search}%`),
        ilike(wbpRecord.registrationNumber, `%${search}%`),
      )
    : undefined;

  const rows = await db
    .select()
    .from(wbpRecord)
    .where(clause)
    .orderBy(asc(wbpRecord.fullName));

  const counts = await db
    .select({
      wbpId: movement.wbpId,
      activeCount: sql<number>`count(*)`,
    })
    .from(movement)
    .where(ne(movement.status, "Kembali"))
    .groupBy(movement.wbpId);

  const activeMap = new Map(counts.map((item) => [item.wbpId, item.activeCount]));

  return rows.map((item) => ({
    ...item,
    originLabel: originFromWbp(item),
    hasActiveMovement: (activeMap.get(item.id) ?? 0) > 0,
  }));
}

export async function getWbpByRegistrationNumber(registrationNumber: string) {
  const row = await db.query.wbpRecord.findFirst({
    where: eq(wbpRecord.registrationNumber, registrationNumber),
  });

  if (!row) {
    throw new ApiError(404, "Data WBP tidak ditemukan.");
  }

  return {
    ...row,
    originLabel: originFromWbp(row),
  };
}

export async function createWbp(
  actor: SessionActor,
  payload: {
    registrationNumber: string;
    fullName: string;
    roomBlock: string;
    roomNumber: string;
    photoUrl?: string;
  },
) {
  const id = createId("wbp");

  const [createdRow] = await db
    .insert(wbpRecord)
    .values({
      id,
      registrationNumber: payload.registrationNumber,
      fullName: payload.fullName,
      roomBlock: payload.roomBlock,
      roomNumber: payload.roomNumber,
      photoUrl: payload.photoUrl,
      createdByUserId: actor.id,
      updatedByUserId: actor.id,
    })
    .returning();

  await writeAuditLog(db, actor, {
    action: "wbp.create",
    entityType: "wbp",
    entityId: id,
    description: `Membuat data WBP ${payload.fullName}.`,
    metadata: {
      registrationNumber: payload.registrationNumber,
    },
  });

  return {
    ...createdRow,
    originLabel: originFromWbp(createdRow),
  };
}

export async function updateWbp(
  actor: SessionActor,
  registrationNumber: string,
  payload: {
    registrationNumber: string;
    fullName: string;
    roomBlock: string;
    roomNumber: string;
    photoUrl?: string;
  },
) {
  const current = await db.query.wbpRecord.findFirst({
    where: eq(wbpRecord.registrationNumber, registrationNumber),
  });

  if (!current) {
    throw new ApiError(404, "Data WBP tidak ditemukan.");
  }

  const [updated] = await db
    .update(wbpRecord)
    .set({
      registrationNumber: payload.registrationNumber,
      fullName: payload.fullName,
      roomBlock: payload.roomBlock,
      roomNumber: payload.roomNumber,
      photoUrl: payload.photoUrl,
      updatedAt: new Date(),
      updatedByUserId: actor.id,
    })
    .where(eq(wbpRecord.id, current.id))
    .returning();

  await writeAuditLog(db, actor, {
    action: "wbp.update",
    entityType: "wbp",
    entityId: updated.id,
    description: `Memperbarui data WBP ${updated.fullName}.`,
    metadata: {
      previousRegistrationNumber: current.registrationNumber,
      registrationNumber: updated.registrationNumber,
    },
  });

  return {
    ...updated,
    originLabel: originFromWbp(updated),
  };
}

export async function deleteWbp(actor: SessionActor, registrationNumber: string) {
  const current = await db.query.wbpRecord.findFirst({
    where: eq(wbpRecord.registrationNumber, registrationNumber),
  });

  if (!current) {
    throw new ApiError(404, "Data WBP tidak ditemukan.");
  }

  await ensureNoActiveMovement(current.id);

  await db.delete(wbpRecord).where(eq(wbpRecord.id, current.id));

  await writeAuditLog(db, actor, {
    action: "wbp.delete",
    entityType: "wbp",
    entityId: current.id,
    description: `Menghapus data WBP ${current.fullName}.`,
    metadata: {
      registrationNumber: current.registrationNumber,
    },
  });
}

export async function listMovements(filters?: {
  destination?: AppDestination;
  status?: AppMovementStatus;
  search?: string;
  activeOnly?: boolean;
}) {
  const rows = await getMovementBaseRows(filters);
  const userMap = await getUserMap(
    rows.flatMap((item) => [item.doorOfficerId, item.roomOfficerId ?? ""]),
  );

  return rows.map((item) => serializeMovementRow(item, userMap));
}

export async function getMovementDetail(movementId: string) {
  const rows = await getMovementBaseRows();
  const row = rows.find((item) => item.id === movementId);

  if (!row) {
    throw new ApiError(404, "Data pergerakan tidak ditemukan.");
  }

  const userMap = await getUserMap([row.doorOfficerId, row.roomOfficerId ?? ""]);

  return serializeMovementRow(row, userMap);
}

export async function dispatchMovement(
  actor: SessionActor,
  payload: {
    wbpId: string;
    destination: AppDestination;
  },
) {
  const target = await db.query.wbpRecord.findFirst({
    where: eq(wbpRecord.id, payload.wbpId),
  });

  if (!target) {
    throw new ApiError(404, "Data WBP tidak ditemukan.");
  }

  await ensureNoActiveMovement(target.id);

  const timestamp = new Date();
  const movementId = createId("move");

  await db.transaction(async (tx) => {
    await tx.insert(movement).values({
      id: movementId,
      wbpId: target.id,
      origin: originFromWbp(target),
      destination: payload.destination,
      status: "Transit",
      departureAt: timestamp,
      doorOfficerId: actor.id,
      updatedByUserId: actor.id,
      updatedAt: timestamp,
    });

    await tx.insert(movementEvent).values({
      id: createId("event"),
      movementId,
      wbpId: target.id,
      eventType: "Dispatch",
      eventLabel: `Dikirim ke ${payload.destination}`,
      destination: payload.destination,
      status: "Transit",
      operatorId: actor.id,
      operatorName: actor.name,
      timestamp,
      metadata: {
        origin: originFromWbp(target),
      },
    });

    await writeAuditLog(tx, actor, {
      action: "movement.dispatch",
      entityType: "movement",
      entityId: movementId,
      description: `${target.fullName} dikirim ke ${payload.destination}.`,
      metadata: {
        wbpId: target.id,
        destination: payload.destination,
      },
    });
  });

  return getMovementDetail(movementId);
}

export async function advanceMovementStatus(
  actor: SessionActor,
  movementId: string,
  nextStatus: "Tiba" | "Selesai" | "Kembali",
) {
  const current = await db.query.movement.findFirst({
    where: eq(movement.id, movementId),
  });

  if (!current) {
    throw new ApiError(404, "Data pergerakan tidak ditemukan.");
  }

  const now = new Date();

  if (nextStatus === "Tiba" && current.status !== "Transit") {
    throw new ApiError(409, "Hanya pergerakan transit yang bisa dikonfirmasi tiba.");
  }

  if (nextStatus === "Selesai" && current.status !== "Tiba") {
    throw new ApiError(409, "Hanya pergerakan yang sudah tiba yang bisa diselesaikan.");
  }

  if (nextStatus === "Kembali" && current.status !== "Selesai") {
    throw new ApiError(409, "Hanya pergerakan selesai yang bisa dikonfirmasi kembali.");
  }

  await db.transaction(async (tx) => {
    await tx
      .update(movement)
      .set({
        status: nextStatus,
        arrivedAt: nextStatus === "Tiba" ? now : current.arrivedAt,
        completedAt: nextStatus === "Selesai" ? now : current.completedAt,
        returnedAt: nextStatus === "Kembali" ? now : current.returnedAt,
        roomOfficerId:
          nextStatus === "Tiba" || nextStatus === "Selesai"
            ? actor.id
            : current.roomOfficerId,
        updatedByUserId: actor.id,
        updatedAt: now,
      })
      .where(eq(movement.id, movementId));

    const labels = {
      Tiba: `Konfirmasi sampai di ${current.destination}`,
      Selesai: `Selesai layanan ${current.destination}`,
      Kembali: "Dikonfirmasi kembali ke blok",
    } as const;

    const eventTypes = {
      Tiba: "Arrival",
      Selesai: "Complete",
      Kembali: "Return",
    } as const;

    await tx.insert(movementEvent).values({
      id: createId("event"),
      movementId: current.id,
      wbpId: current.wbpId,
      eventType: eventTypes[nextStatus],
      eventLabel: labels[nextStatus],
      destination: current.destination,
      status: nextStatus,
      operatorId: actor.id,
      operatorName: actor.name,
      timestamp: now,
      metadata: null,
    });

    await writeAuditLog(tx, actor, {
      action: `movement.${nextStatus.toLowerCase()}`,
      entityType: "movement",
      entityId: current.id,
      description: `Status pergerakan diperbarui menjadi ${nextStatus}.`,
      metadata: {
        movementId: current.id,
        destination: current.destination,
      },
    });
  });

  return getMovementDetail(movementId);
}

export async function getMonitoringSnapshot() {
  const items = await listMovements({ activeOnly: true });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      active: items.length,
      byDestination: {
        Klinik: items.filter((item) => item.destination === "Klinik").length,
        Registrasi: items.filter((item) => item.destination === "Registrasi")
          .length,
        Kunjungan: items.filter((item) => item.destination === "Kunjungan")
          .length,
      },
      overlimit: items.filter((item) => item.alertLevel === "overlimit").length,
    },
    columns: {
      Klinik: items.filter((item) => item.destination === "Klinik"),
      Registrasi: items.filter((item) => item.destination === "Registrasi"),
      Kunjungan: items.filter((item) => item.destination === "Kunjungan"),
    },
  };
}

export async function listMovementLogs(filters?: {
  destination?: AppDestination;
  status?: AppMovementStatus;
  search?: string;
  limit?: number;
}) {
  const clauses = [];

  if (filters?.destination) {
    clauses.push(eq(movementEvent.destination, filters.destination));
  }

  if (filters?.status) {
    clauses.push(eq(movementEvent.status, filters.status));
  }

  if (filters?.search) {
    clauses.push(
      or(
        ilike(wbpRecord.fullName, `%${filters.search}%`),
        ilike(wbpRecord.registrationNumber, `%${filters.search}%`),
        ilike(movementEvent.eventLabel, `%${filters.search}%`),
      )!,
    );
  }

  return db
    .select({
      id: movementEvent.id,
      movementId: movementEvent.movementId,
      wbpId: movementEvent.wbpId,
      registrationNumber: wbpRecord.registrationNumber,
      fullName: wbpRecord.fullName,
      eventType: movementEvent.eventType,
      eventLabel: movementEvent.eventLabel,
      destination: movementEvent.destination,
      status: movementEvent.status,
      operatorId: movementEvent.operatorId,
      operatorName: movementEvent.operatorName,
      timestamp: movementEvent.timestamp,
      metadata: movementEvent.metadata,
    })
    .from(movementEvent)
    .innerJoin(wbpRecord, eq(movementEvent.wbpId, wbpRecord.id))
    .where(clauses.length > 0 ? and(...clauses) : undefined)
    .orderBy(desc(movementEvent.timestamp))
    .limit(filters?.limit ?? 100);
}

export async function getReportSummary(filters: {
  range: "today" | "7d" | "30d";
  destination?: AppDestination;
}) {
  const now = new Date();
  const start = new Date(now);

  if (filters.range === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (filters.range === "7d") {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }

  const clauses = [sql`${movement.departureAt} >= ${start}`];

  if (filters.destination) {
    clauses.push(eq(movement.destination, filters.destination));
  }

  const summaryRows = await db
    .select({
      destination: movement.destination,
      status: movement.status,
      total: sql<number>`count(*)`,
    })
    .from(movement)
    .where(and(...clauses))
    .groupBy(movement.destination, movement.status);

  const totals = {
    dispatched: 0,
    arrived: 0,
    completed: 0,
    returned: 0,
  };

  const byDestination = {
    Klinik: { total: 0, overlimit: 0 },
    Registrasi: { total: 0, overlimit: 0 },
    Kunjungan: { total: 0, overlimit: 0 },
  };

  for (const row of summaryRows) {
    byDestination[row.destination].total += row.total;

    if (row.status === "Transit") totals.dispatched += row.total;
    if (row.status === "Tiba") totals.arrived += row.total;
    if (row.status === "Selesai") totals.completed += row.total;
    if (row.status === "Kembali") totals.returned += row.total;
  }

  const overlimitRows = await getMovementBaseRows({
    destination: filters.destination,
    activeOnly: true,
  });

  for (const row of overlimitRows) {
    const minutes = minutesBetween(row.arrivedAt ?? row.departureAt);
    if (minutes > 60) {
      byDestination[row.destination].overlimit += 1;
    }
  }

  const latestLogs = await listMovementLogs({
    destination: filters.destination,
    limit: 20,
  });

  return {
    range: filters.range,
    generatedAt: now.toISOString(),
    from: start.toISOString(),
    to: now.toISOString(),
    totals,
    byDestination,
    latestLogs,
  };
}

export async function getMovementStatusRecord(movementId: string) {
  const record = await db.query.movement.findFirst({
    where: eq(movement.id, movementId),
  });

  if (!record) {
    throw new ApiError(404, "Data pergerakan tidak ditemukan.");
  }

  return record;
}
