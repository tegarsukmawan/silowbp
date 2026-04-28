export const appRoleValues = [
  "Superadmin",
  "Admin",
  "Petugas Pintu 3",
  "Petugas Ruangan",
] as const;

export const assignmentValues = [
  "Pintu 3",
  "Administrasi",
  "Klinik",
  "Registrasi",
  "Kunjungan",
] as const;

export const destinationValues = ["Klinik", "Registrasi", "Kunjungan"] as const;

export const movementStatusValues = [
  "Transit",
  "Tiba",
  "Selesai",
  "Kembali",
] as const;

export type AppRole = (typeof appRoleValues)[number];
export type Assignment = (typeof assignmentValues)[number];
export type AppDestination = (typeof destinationValues)[number];
export type AppMovementStatus = (typeof movementStatusValues)[number];

export const privilegedRoles: AppRole[] = ["Superadmin", "Admin"];

export function isPrivilegedRole(role: AppRole) {
  return privilegedRoles.includes(role);
}

export function isRoomDestination(value: string): value is AppDestination {
  return destinationValues.includes(value as AppDestination);
}

export function isMovementOpen(status: AppMovementStatus) {
  return status !== "Kembali";
}

export function getAlertLevelFromMinutes(minutes: number) {
  if (minutes > 60) {
    return "overlimit";
  }
  if (minutes >= 45) {
    return "warning";
  }
  return "normal";
}
