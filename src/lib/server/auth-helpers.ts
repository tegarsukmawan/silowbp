import { headers } from "next/headers";

import { auth } from "@/lib/auth";

import {
  type AppDestination,
  type AppRole,
  isPrivilegedRole,
} from "./constants";
import { ApiError } from "./http";

export interface SessionActor {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  assignment?: string | null;
  isActive: boolean;
}

export async function getSessionOrNull() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession() {
  const session = await getSessionOrNull();

  if (!session?.user) {
    throw new ApiError(401, "Silakan login terlebih dahulu.");
  }

  const actor: SessionActor = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user.role as AppRole | undefined) ?? "Admin",
    assignment: (session.user.assignment as string | null | undefined) ?? null,
    isActive: (session.user.isActive as boolean | undefined) ?? true,
  };

  if (!actor.isActive) {
    throw new ApiError(403, "Akun ini sedang dinonaktifkan.");
  }

  return { session, actor };
}

export function requireRole(actor: SessionActor, allowedRoles: AppRole[]) {
  if (!allowedRoles.includes(actor.role)) {
    throw new ApiError(403, "Anda tidak memiliki hak akses untuk aksi ini.");
  }
}

export function requireAdmin(actor: SessionActor) {
  requireRole(actor, ["Superadmin", "Admin"]);
}

export function requireDoorOfficer(actor: SessionActor) {
  if (isPrivilegedRole(actor.role)) {
    return;
  }

  if (actor.role !== "Petugas Pintu 3") {
    throw new ApiError(403, "Aksi ini hanya untuk petugas Pintu 3.");
  }
}

export function requireRoomOfficer(
  actor: SessionActor,
  destination: AppDestination,
) {
  if (isPrivilegedRole(actor.role)) {
    return;
  }

  if (actor.role !== "Petugas Ruangan") {
    throw new ApiError(403, "Aksi ini hanya untuk petugas ruangan.");
  }

  if (actor.assignment !== destination) {
    throw new ApiError(
      403,
      `Petugas hanya dapat memproses ruangan ${destination}.`,
    );
  }
}
