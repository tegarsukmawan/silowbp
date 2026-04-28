import type { MovementRecord, WbpRecord } from "@/lib/domain";

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatTime(value?: string) {
  if (!value) {
    return "-";
  }
  return timeFormatter.format(new Date(value));
}

export function formatDate(value?: string) {
  if (!value) {
    return "-";
  }
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  return dateTimeFormatter.format(new Date(value));
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) {
    return `${remainder} menit`;
  }
  return `${hours} jam ${remainder} menit`;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getOriginLabel(wbp: WbpRecord) {
  return `Blok ${wbp.roomBlock}-${wbp.roomNumber}`;
}

export function getStatusLabel(movement: MovementRecord) {
  switch (movement.status) {
    case "Transit":
      return "Dalam perjalanan";
    case "Tiba":
      return "Sedang ditangani";
    case "Selesai":
      return "Menunggu kembali";
    case "Kembali":
      return "Sudah kembali";
    default:
      return movement.status;
  }
}
