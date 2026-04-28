"use client";

import { useMemo, useState } from "react";

import { useAppState } from "@/components/app-state";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  FilterIcon,
  SearchIcon,
  UserCircleIcon,
} from "@/components/silo-icons";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { dashboardColumns, getAlertLevel, getDurationMinutes, type Destination } from "@/lib/domain";
import { formatDuration, formatTime, getOriginLabel, getStatusLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type DestinationFilter = Destination | "Semua";

function getStatusTone(status: string, duration: number) {
  if (duration > 60) return "red" as const;
  if (status === "Transit") return "amber" as const;
  return "green" as const;
}

export default function MonitoringPage() {
  const { actor, movements, wbps, now } = useAppState();
  const [query, setQuery] = useState("");
  const [selectedDestination, setSelectedDestination] =
    useState<DestinationFilter>("Semua");

  const activeMovements = movements.filter((item) => item.status !== "Kembali");

  const visibleMovements = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return activeMovements.filter((movement) => {
      const person = wbps.find((item) => item.id === movement.wbpId);
      if (!person) {
        return false;
      }

      const matchesRole =
        actor?.role !== "Petugas Ruangan" || actor.assignment === movement.destination;
      const matchesDestination =
        selectedDestination === "Semua" || movement.destination === selectedDestination;
      const haystack =
        `${person.fullName} ${person.registrationNumber} ${getOriginLabel(person)}`.toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);

      return matchesRole && matchesDestination && matchesQuery;
    });
  }, [activeMovements, actor?.assignment, actor?.role, query, selectedDestination, wbps]);

  const summary = {
    active: activeMovements.length,
    pending: activeMovements.filter((item) => item.status === "Transit").length,
    warning: activeMovements.filter((item) => getAlertLevel(item, now) === "warning").length,
    overlimit: activeMovements.filter((item) => getAlertLevel(item, now) === "overlimit")
      .length,
  };

  const destinationOptions = actor?.role === "Petugas Ruangan"
    ? dashboardColumns.filter((item) => item.destination === actor.assignment)
    : dashboardColumns;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#dbe7ff]">
            Monitoring Real-time
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Pantau pergerakan WBP secara langsung, cek status tiap unit, dan lihat
            antrean yang membutuhkan tindak lanjut.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Aktif" value={summary.active} tone="blue" />
          <MetricCard label="Belum Dikonfirmasi" value={summary.pending} tone="amber" />
          <MetricCard label="Perlu Perhatian" value={summary.warning} tone="amber" />
          <MetricCard label="Tidak Sesuai" value={summary.overlimit} tone="red" />
        </div>
      </section>

      <Card>
        <CardHeader className="border-b border-[#223150]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle>Daftar Monitoring WBP</CardTitle>
              <CardDescription>
                Cari berdasarkan nama, NIK, atau nomor registrasi lalu filter per
                unit tujuan.
              </CardDescription>
            </div>

            <div className="flex w-full flex-col gap-3 xl:w-auto xl:flex-row">
              <div className="relative xl:w-[320px]">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  className="pl-11"
                  placeholder="Cari nama / NIK / nomor registrasi"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#223150] bg-[#132341] px-4 py-3 text-sm text-slate-400">
                <FilterIcon className="h-4 w-4 text-[#f4c84c]" />
                Filter Unit
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="flex flex-wrap gap-3">
            <FilterChip
              active={selectedDestination === "Semua"}
              label="Semua"
              onClick={() => setSelectedDestination("Semua")}
            />
            {destinationOptions.map((item) => (
              <FilterChip
                key={item.destination}
                active={selectedDestination === item.destination}
                label={item.title}
                onClick={() => setSelectedDestination(item.destination)}
              />
            ))}
          </div>

          <div className="grid gap-4">
            {visibleMovements.length ? (
              visibleMovements.map((movement) => {
                const person = wbps.find((item) => item.id === movement.wbpId);
                if (!person) {
                  return null;
                }

                const duration = getDurationMinutes(movement, now);
                const tone = getStatusTone(movement.status, duration);

                return (
                  <div
                    key={movement.id}
                    className="rounded-[28px] border border-[#223150] bg-[#0f1b33] p-4 shadow-sm transition hover:border-[#2d4d82] hover:shadow-[0_16px_30px_rgba(2,8,23,0.22)]"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#16294a] text-[#f4c84c]">
                          <UserCircleIcon className="h-8 w-8" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="truncate text-base font-semibold text-[#dbe7ff]">
                              {person.fullName}
                            </p>
                            <Badge tone={tone}>
                              {duration > 60 ? "Tidak Sesuai" : movement.status === "Transit" ? "Pending" : "Aman"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-400">
                            NIK: {person.registrationNumber}
                          </p>
                          <p className="text-sm text-slate-400">
                            {getOriginLabel(person)} · {movement.destination}
                          </p>
                        </div>
                      </div>

                      <div className="grid flex-1 gap-3 sm:grid-cols-3 lg:max-w-[480px]">
                        <InfoPanel label="Jam" value={`${formatTime(movement.updatedAt)} WIB`} />
                        <InfoPanel label="Status" value={getStatusLabel(movement)} />
                        <InfoPanel label="Durasi" value={formatDuration(duration)} />
                      </div>

                      <div className="flex items-center justify-between gap-4 lg:w-[230px] lg:flex-col lg:items-end">
                        <div className="text-sm text-slate-400">
                          <p className="font-medium text-slate-200">
                            {movement.roomOfficer ?? movement.doorOfficer}
                          </p>
                          <p>Petugas Konfirmasi</p>
                        </div>
                        <Button variant="ghost" size="sm" className="text-[#f4c84c] hover:text-[#dbe7ff]">
                          Detail
                          <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-[#223150] bg-[#132341] p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
                  <AlertCircleIcon className="h-7 w-7" />
                </div>
                <p className="mt-4 text-base font-semibold text-[#dbe7ff]">
                  Tidak ada data monitoring yang cocok
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Ubah kata kunci pencarian atau pilih unit lain untuk melihat WBP
                  yang sedang bergerak.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "blue" | "amber" | "red";
}) {
  const toneClass = {
    blue: "bg-[#16294a] text-[#f4c84c]",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-rose-500/15 text-rose-300",
  }[tone];

  return (
    <Card className="min-w-[170px]">
      <CardContent className="p-5">
        <div className={cn("inline-flex rounded-2xl px-3 py-1 text-xs font-semibold", toneClass)}>
          {label}
        </div>
        <p className="mt-4 font-heading text-3xl font-semibold text-[#dbe7ff]">{value}</p>
        <p className="mt-1 text-sm text-slate-500">Orang</p>
      </CardContent>
    </Card>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-[#2154aa] bg-[#2154aa] text-[#dbe7ff]"
          : "border-[#223150] bg-[#0f1b33] text-slate-300 hover:border-[#2d4d82]",
      )}
    >
      {label}
    </button>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#223150] bg-[#132341] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-200">{value}</p>
    </div>
  );
}
