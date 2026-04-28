export type Role =
  | "Superadmin"
  | "Admin"
  | "Petugas Pintu 3"
  | "Petugas Ruangan";

export type Assignment = Destination | "Pintu 3" | "Administrasi";

export type Destination = "Klinik" | "Registrasi" | "Kunjungan";

export type MovementStatus = "Transit" | "Tiba" | "Selesai" | "Kembali";

export type AlertLevel = "normal" | "warning" | "overlimit";

export interface WbpRecord {
  id: string;
  registrationNumber: string;
  fullName: string;
  roomBlock: string;
  roomNumber: string;
  photoUrl?: string;
}

export interface OperatorUser {
  id: string;
  name: string;
  role: Role;
  assignment?: Assignment;
}

export interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignment?: Assignment | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UserManagementRoleOption =
  | "Superadmin"
  | "Admin"
  | "Petugas Pintu 3"
  | "Petugas Klinik"
  | "Petugas Registrasi"
  | "Petugas Kunjungan";

export type PublicRegistrationRoleOption = Exclude<
  UserManagementRoleOption,
  "Superadmin"
>;

export interface MovementRecord {
  id: string;
  wbpId: string;
  origin: string;
  destination: Destination;
  status: MovementStatus;
  departureAt: string;
  arrivedAt?: string;
  completedAt?: string;
  returnedAt?: string;
  doorOfficer: string;
  roomOfficer?: string;
  updatedAt: string;
}

export interface MovementLog {
  id: string;
  movementId: string;
  wbpId: string;
  event: string;
  destination: Destination;
  status: MovementStatus;
  timestamp: string;
  operator: string;
}

export interface DashboardColumn {
  destination: Destination;
  title: string;
  subtitle: string;
  accentClass: string;
  panelClass: string;
}

export interface ReportFilterState {
  query: string;
  destination: Destination | "Semua";
  status: MovementStatus | "Semua";
  range: "Hari ini" | "7 Hari" | "30 Hari";
}

export const dashboardColumns: DashboardColumn[] = [
  {
    destination: "Klinik",
    title: "Klinik",
    subtitle: "Pemeriksaan dan perawatan",
    accentClass: "from-sky-500/20 to-cyan-400/10 text-sky-100",
    panelClass: "border-sky-400/20 bg-sky-500/[0.08]",
  },
  {
    destination: "Registrasi",
    title: "Registrasi",
    subtitle: "Verifikasi dan administrasi",
    accentClass: "from-amber-500/20 to-yellow-400/10 text-amber-100",
    panelClass: "border-amber-400/20 bg-amber-500/[0.08]",
  },
  {
    destination: "Kunjungan",
    title: "Kunjungan",
    subtitle: "Akses pengunjung dan pendamping",
    accentClass: "from-emerald-500/20 to-lime-400/10 text-emerald-100",
    panelClass: "border-emerald-400/20 bg-emerald-500/[0.08]",
  },
];

export const operators: OperatorUser[] = [
  {
    id: "op-1",
    name: "Ahmad Fauzi",
    role: "Petugas Pintu 3",
    assignment: "Pintu 3",
  },
  {
    id: "op-2",
    name: "dr. Nia Rahmah",
    role: "Petugas Ruangan",
    assignment: "Klinik",
  },
  {
    id: "op-3",
    name: "Siska Lestari",
    role: "Petugas Ruangan",
    assignment: "Registrasi",
  },
  {
    id: "op-4",
    name: "Reza Maulana",
    role: "Petugas Ruangan",
    assignment: "Kunjungan",
  },
  {
    id: "op-5",
    name: "Tari Anggraini",
    role: "Admin",
    assignment: "Administrasi",
  },
];

export const seedWbps: WbpRecord[] = [
  {
    id: "wbp-1",
    registrationNumber: "WBP-2024-0012",
    fullName: "Rizal Aditya",
    roomBlock: "A",
    roomNumber: "07",
  },
  {
    id: "wbp-2",
    registrationNumber: "WBP-2024-0015",
    fullName: "Bambang Setiawan",
    roomBlock: "B",
    roomNumber: "03",
  },
  {
    id: "wbp-3",
    registrationNumber: "WBP-2024-0021",
    fullName: "Dimas Prakoso",
    roomBlock: "C",
    roomNumber: "11",
  },
  {
    id: "wbp-4",
    registrationNumber: "WBP-2024-0027",
    fullName: "Asep Nugraha",
    roomBlock: "A",
    roomNumber: "12",
  },
  {
    id: "wbp-5",
    registrationNumber: "WBP-2024-0032",
    fullName: "M. Farhan Hakim",
    roomBlock: "D",
    roomNumber: "05",
  },
  {
    id: "wbp-6",
    registrationNumber: "WBP-2024-0038",
    fullName: "Yusuf Kurniawan",
    roomBlock: "E",
    roomNumber: "09",
  },
  {
    id: "wbp-7",
    registrationNumber: "WBP-2024-0041",
    fullName: "Andri Saputra",
    roomBlock: "F",
    roomNumber: "02",
  },
  {
    id: "wbp-8",
    registrationNumber: "WBP-2024-0050",
    fullName: "Fikriansyah",
    roomBlock: "C",
    roomNumber: "14",
  },
];

function isoMinutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function createSeedMovements(): MovementRecord[] {
  return [
    {
      id: "move-1",
      wbpId: "wbp-1",
      origin: "Blok A-07",
      destination: "Klinik",
      status: "Tiba",
      departureAt: isoMinutesAgo(28),
      arrivedAt: isoMinutesAgo(23),
      doorOfficer: "Ahmad Fauzi",
      roomOfficer: "dr. Nia Rahmah",
      updatedAt: isoMinutesAgo(23),
    },
    {
      id: "move-2",
      wbpId: "wbp-2",
      origin: "Blok B-03",
      destination: "Registrasi",
      status: "Transit",
      departureAt: isoMinutesAgo(17),
      doorOfficer: "Ahmad Fauzi",
      updatedAt: isoMinutesAgo(17),
    },
    {
      id: "move-3",
      wbpId: "wbp-3",
      origin: "Blok C-11",
      destination: "Kunjungan",
      status: "Tiba",
      departureAt: isoMinutesAgo(76),
      arrivedAt: isoMinutesAgo(70),
      doorOfficer: "Ahmad Fauzi",
      roomOfficer: "Reza Maulana",
      updatedAt: isoMinutesAgo(70),
    },
    {
      id: "move-4",
      wbpId: "wbp-5",
      origin: "Blok D-05",
      destination: "Klinik",
      status: "Selesai",
      departureAt: isoMinutesAgo(54),
      arrivedAt: isoMinutesAgo(46),
      completedAt: isoMinutesAgo(8),
      doorOfficer: "Ahmad Fauzi",
      roomOfficer: "dr. Nia Rahmah",
      updatedAt: isoMinutesAgo(8),
    },
    {
      id: "move-5",
      wbpId: "wbp-6",
      origin: "Blok E-09",
      destination: "Registrasi",
      status: "Kembali",
      departureAt: isoMinutesAgo(165),
      arrivedAt: isoMinutesAgo(153),
      completedAt: isoMinutesAgo(125),
      returnedAt: isoMinutesAgo(112),
      doorOfficer: "Ahmad Fauzi",
      roomOfficer: "Siska Lestari",
      updatedAt: isoMinutesAgo(112),
    },
  ];
}

export function getDurationMinutes(movement: MovementRecord, now = new Date()) {
  const start = movement.arrivedAt ?? movement.departureAt;
  return Math.max(
    0,
    Math.floor((now.getTime() - new Date(start).getTime()) / 60_000),
  );
}

export function getAlertLevel(movement: MovementRecord, now = new Date()): AlertLevel {
  const minutes = getDurationMinutes(movement, now);
  if (minutes > 60) {
    return "overlimit";
  }
  if (minutes >= 45) {
    return "warning";
  }
  return "normal";
}

export function getDestinationOfficer(destination: Destination) {
  const operator = operators.find((item) => item.assignment === destination);
  return operator?.name ?? "Petugas Ruangan";
}

export function getRoleLabel(role: Role, assignment?: Assignment | null) {
  if (role === "Petugas Ruangan") {
    if (assignment === "Klinik") {
      return "Petugas Klinik";
    }
    if (assignment === "Registrasi") {
      return "Petugas Registrasi";
    }
    if (assignment === "Kunjungan") {
      return "Petugas Kunjungan";
    }
  }

  return role;
}

export function getAssignmentLabel(assignment?: Assignment | null) {
  if (!assignment) {
    return "-";
  }
  return assignment;
}

export function getRoleOptionFromUser(
  role: Role,
  assignment?: Assignment | null,
): UserManagementRoleOption {
  if (role === "Superadmin") {
    return "Superadmin";
  }

  if (role === "Petugas Ruangan") {
    if (assignment === "Registrasi") {
      return "Petugas Registrasi";
    }
    if (assignment === "Kunjungan") {
      return "Petugas Kunjungan";
    }
    return "Petugas Klinik";
  }

  return role;
}

export function resolveUserRoleOption(option: UserManagementRoleOption): {
  role: Role;
  assignment: Assignment;
} {
  if (option === "Superadmin") {
    return { role: "Superadmin", assignment: "Administrasi" };
  }

  if (option === "Admin") {
    return { role: "Admin", assignment: "Administrasi" };
  }

  if (option === "Petugas Pintu 3") {
    return { role: "Petugas Pintu 3", assignment: "Pintu 3" };
  }

  if (option === "Petugas Registrasi") {
    return { role: "Petugas Ruangan", assignment: "Registrasi" };
  }

  if (option === "Petugas Kunjungan") {
    return { role: "Petugas Ruangan", assignment: "Kunjungan" };
  }

  return { role: "Petugas Ruangan", assignment: "Klinik" };
}
