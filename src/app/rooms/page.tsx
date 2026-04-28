"use client";

import { useMemo, useState } from "react";

import { useAppState } from "@/components/app-state";
import { CalendarIcon, TeamIcon } from "@/components/silo-icons";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  dashboardColumns,
  getDurationMinutes,
  getRoleLabel,
  type Destination,
} from "@/lib/domain";
import { formatDuration, formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export default function RoomsPage() {
  const { actor, movements, wbps, now, confirmArrival, completeAndReturn } = useAppState();
  const [selected, setSelected] = useState<Destination>("Klinik");

  const allowedColumns = useMemo(() => {
    if (actor?.role === "Petugas Ruangan") {
      return dashboardColumns.filter((item) => item.destination === actor.assignment);
    }

    return dashboardColumns;
  }, [actor?.assignment, actor?.role]);

  const effectiveSelected = useMemo(() => {
    if (allowedColumns.some((item) => item.destination === selected)) {
      return selected;
    }
    return allowedColumns[0]?.destination ?? "Klinik";
  }, [allowedColumns, selected]);

  const selectedData = useMemo(
    () => ({
      arrivals: movements.filter(
        (item) => item.destination === effectiveSelected && item.status === "Transit",
      ),
      inService: movements.filter(
        (item) => item.destination === effectiveSelected && item.status === "Tiba",
      ),
      finished: movements.filter(
        (item) => item.destination === effectiveSelected && item.status === "Selesai",
      ),
    }),
    [effectiveSelected, movements],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-[#223150]">
          <CardTitle>Dashboard Petugas Ruangan</CardTitle>
          <CardDescription>
            {actor?.role === "Petugas Ruangan"
              ? `${getRoleLabel(actor.role, actor.assignment)} hanya dapat mengakses unit ${actor.assignment}.`
              : "Konfirmasi kedatangan, pantau durasi layanan, lalu tandai selesai untuk dikembalikan ke blok."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className={`grid gap-3 ${allowedColumns.length > 1 ? "md:grid-cols-3" : ""}`}>
            {allowedColumns.map((column) => (
              <button
                key={column.destination}
                type="button"
                onClick={() => setSelected(column.destination)}
                className={cn(
                  "rounded-[28px] border p-5 text-left transition-all",
                  effectiveSelected === column.destination
                    ? "border-[#2d4d82] bg-[#16294a]"
                    : "border-[#223150] bg-[#0f1b33] hover:border-[#33598f]",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16294a] text-[#f4c84c]">
                    <TeamIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-heading text-xl font-semibold text-[#dbe7ff]">
                      {column.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">{column.subtitle}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <BoardCard
          title="Menunggu Konfirmasi Sampai"
          description={`${selectedData.arrivals.length} transit aktif`}
          emptyMessage={`Tidak ada WBP transit menuju ${effectiveSelected.toLowerCase()}.`}
        >
          {selectedData.arrivals.map((movement) => {
            const person = wbps.find((item) => item.id === movement.wbpId);
            if (!person) {
              return null;
            }

            return (
              <QueueItem
                key={movement.id}
                title={person.fullName}
                subtitle={person.registrationNumber}
                note={`Berangkat dari Pintu 3 pukul ${formatTime(movement.departureAt)} WIB`}
                badge={<Badge tone="blue">Transit</Badge>}
                action={
                  <Button className="w-full" onClick={() => void confirmArrival(movement.id)}>
                    Konfirmasi Sampai
                  </Button>
                }
              />
            );
          })}
        </BoardCard>

        <BoardCard
          title="Sedang Ditangani"
          description="Monitor durasi layanan secara real-time."
          emptyMessage={`Belum ada layanan aktif di ${effectiveSelected.toLowerCase()}.`}
        >
          {selectedData.inService.map((movement) => {
            const person = wbps.find((item) => item.id === movement.wbpId);
            if (!person) {
              return null;
            }

            const duration = getDurationMinutes(movement, now);

            return (
              <QueueItem
                key={movement.id}
                title={person.fullName}
                subtitle={`Mulai ditangani ${formatTime(movement.arrivedAt)} WIB`}
                note={`Durasi layanan ${formatDuration(duration)}`}
                badge={
                  <Badge tone={duration > 60 ? "red" : duration >= 45 ? "amber" : "green"}>
                    {formatDuration(duration)}
                  </Badge>
                }
                action={
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => void completeAndReturn(movement.id)}
                  >
                    Selesai & Kembalikan
                  </Button>
                }
              />
            );
          })}
        </BoardCard>

        <BoardCard
          title="Menunggu Dijemput Pintu 3"
          description="Sudah selesai dan tinggal diverifikasi kembali."
          emptyMessage={`Tidak ada antrean selesai untuk ${effectiveSelected.toLowerCase()}.`}
        >
          {selectedData.finished.map((movement) => {
            const person = wbps.find((item) => item.id === movement.wbpId);
            if (!person) {
              return null;
            }

            return (
              <QueueItem
                key={movement.id}
                title={person.fullName}
                subtitle={`Selesai pada ${formatTime(movement.completedAt)} WIB`}
                note="Menunggu verifikasi akhir oleh petugas Pintu 3."
                badge={<Badge tone="green">Selesai</Badge>}
              />
            );
          })}
        </BoardCard>
      </div>
    </div>
  );
}

function BoardCard({
  title,
  description,
  emptyMessage,
  children,
}: {
  title: string;
  description: string;
  emptyMessage: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);

  return (
    <Card>
      <CardHeader className="border-b border-[#223150]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#16294a] text-[#f4c84c]">
            <CalendarIcon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {items.length ? (
          items
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#223150] bg-[#132341] p-5 text-sm text-slate-400">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QueueItem({
  title,
  subtitle,
  note,
  badge,
  action,
}: {
  title: string;
  subtitle: string;
  note: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-[#223150] bg-[#132341] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[#dbe7ff]">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        {badge}
      </div>
      <p className="mt-3 text-sm text-slate-400">{note}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
