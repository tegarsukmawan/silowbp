"use client";

import { useMemo } from "react";

import { useAppState } from "@/components/app-state";
import {
  AlertCircleIcon,
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  DashboardIcon,
  ShieldIcon,
  SwapIcon,
  TeamIcon,
  UserCircleIcon,
} from "@/components/silo-icons";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { getDurationMinutes } from "@/lib/domain";
import { formatDateTime, formatTime, getOriginLabel, getStatusLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function MiniLineChart({ points }: { points: number[] }) {
  const maxValue = Math.max(...points, 1);
  const width = 540;
  const height = 220;
  const padding = 24;
  const stepX = (width - padding * 2) / Math.max(points.length - 1, 1);

  const polyline = points
    .map((point, index) => {
      const x = padding + stepX * index;
      const y = height - padding - ((point / maxValue) * (height - padding * 2));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[24px] border border-[#223150] bg-[#0f1b33] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = padding + ((height - padding * 2) / 3) * line;
          return (
            <line
              key={line}
              x1={padding}
              x2={width - padding}
              y1={y}
              y2={y}
              stroke="#243552"
              strokeWidth="1"
            />
          );
        })}
        {points.map((_, index) => {
          const x = padding + stepX * index;
          return (
            <line
              key={index}
              x1={x}
              x2={x}
              y1={padding}
              y2={height - padding}
              stroke="#1a2843"
              strokeWidth="1"
            />
          );
        })}
        <polyline
          points={polyline}
          fill="none"
          stroke="#4f8cff"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => {
          const x = padding + stepX * index;
          const y = height - padding - ((point / maxValue) * (height - padding * 2));
          return <circle key={index} cx={x} cy={y} r="5" fill="#f4c84c" />;
        })}
      </svg>
      <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-slate-400">
        {["14 Mei", "15 Mei", "16 Mei", "17 Mei", "18 Mei", "19 Mei", "20 Mei"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
    </div>
  );
}

function TimelineCard({
  time,
  title,
  subtitle,
  badge,
}: {
  time: string;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <div className="grid grid-cols-[56px_20px_1fr] gap-3">
      <div className="pt-1 text-sm font-semibold text-slate-400">{time}</div>
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full bg-[#4f8cff]" />
        <div className="mt-1 h-full w-px bg-[#223150]" />
      </div>
      <div className="rounded-[22px] border border-[#223150] bg-[#132341] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-[#dbe7ff]">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">{subtitle}</p>
          </div>
          {badge ? <Badge tone="green">{badge}</Badge> : null}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { movements, logs, wbps, now } = useAppState();

  const activeMovements = movements.filter((item) => item.status !== "Kembali");
  const pendingConfirmations = movements.filter(
    (item) => item.status === "Transit" || item.status === "Selesai",
  );
  const mismatched = activeMovements.filter((item) => getDurationMinutes(item, now) > 60);

  const latestMovements = useMemo(() => {
    return [...activeMovements]
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )
      .slice(0, 5);
  }, [activeMovements]);

  const chartPoints = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - index));
      return date;
    });

    return days.map((date) => {
      return (
        movements.filter((movement) => {
          return new Date(movement.departureAt).toDateString() === date.toDateString();
        }).length || indexFallback(date)
      );
    });
  }, [movements, now]);

  const roomSummary = useMemo(() => {
    const locations = [
      { id: "Klinik", label: "Ruangan Klinik" },
      { id: "Kunjungan", label: "Ruangan Kunjungan" },
      { id: "Registrasi", label: "Ruangan Registrasi" },
      { id: "Pintu 3", label: "Pintu 3" },
    ];
    
    return locations.map((loc, index) => {
      const activeInLoc = activeMovements.filter((movement) => movement.destination === loc.id);
      const total = activeInLoc.length;
      const flagged = activeInLoc.some((movement) => getDurationMinutes(movement, now) > 60);

      return {
        id: loc.id,
        label: loc.label,
        total,
        status: flagged ? "Tidak Sesuai" : total > 0 ? "Pending" : "Aman",
      };
    });
  }, [activeMovements, now]);

  const latestLogs = useMemo(() => logs.slice(0, 4), [logs]);

  const kpis = [
    {
      label: "Total WBP Aktif",
      value: activeMovements.length,
      note: "Orang",
      icon: TeamIcon,
      tone: "blue" as const,
    },
    {
      label: "Perpindahan Hari Ini",
      value: movements.filter(
        (item) => new Date(item.departureAt).toDateString() === now.toDateString(),
      ).length,
      note: "Orang",
      icon: SwapIcon,
      tone: "green" as const,
    },
    {
      label: "Belum Dikonfirmasi",
      value: pendingConfirmations.length,
      note: "Perlu Perhatian",
      icon: AlertCircleIcon,
      tone: "amber" as const,
    },
    {
      label: "Tidak Sesuai",
      value: mismatched.length,
      note: "Perlu Tindakan",
      icon: ShieldIcon,
      tone: "red" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div>
            <h1 className="font-heading text-3xl font-semibold text-[#dbe7ff]">Dashboard</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ringkasan informasi monitoring pergerakan WBP secara real-time.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => {
              const Icon = item.icon;
              const toneClasses = {
                blue: "bg-[#16294a] text-[#f4c84c]",
                green: "bg-emerald-500/15 text-emerald-300",
                amber: "bg-amber-500/15 text-amber-300",
                red: "bg-rose-500/15 text-rose-300",
              }[item.tone];

              return (
                <Card key={item.label}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", toneClasses)}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <Badge tone={item.tone}>{item.note}</Badge>
                    </div>
                    <p className="mt-5 text-sm text-slate-400">{item.label}</p>
                    <p className="mt-2 font-heading text-4xl font-semibold text-[#dbe7ff]">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">Orang</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-[#223150]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Timeline Pergerakan</CardTitle>
                <CardDescription>Ringkasan perpindahan terbaru hari ini.</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            {latestMovements.length ? (
              latestMovements.map((movement) => {
                const person = wbps.find((item) => item.id === movement.wbpId);
                if (!person) return null;

                return (
                  <TimelineCard
                    key={movement.id}
                    time={formatTime(movement.updatedAt)}
                    title={movement.destination}
                    subtitle={`Dikonfirmasi oleh ${movement.roomOfficer ?? movement.doorOfficer} · ${formatDateTime(movement.updatedAt)}`}
                    badge={movement.status === "Transit" ? "Pending" : "Aman"}
                  />
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#223150] bg-[#132341] p-5 text-sm text-slate-400">
                Belum ada pergerakan terbaru.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <Card>
          <CardHeader className="flex flex-col gap-4 border-b border-[#223150] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Grafik Pergerakan</CardTitle>
              <CardDescription>Perbandingan perpindahan WBP dalam 7 hari terakhir.</CardDescription>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-[#223150] bg-[#132341] px-4 py-2 text-sm text-slate-300">
              <CalendarIcon className="h-4 w-4 text-[#f4c84c]" />
              7 Hari Terakhir
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <MiniLineChart points={chartPoints} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[#223150]">
            <div>
              <CardTitle>Pergerakan Terbaru</CardTitle>
              <CardDescription>Daftar WBP yang baru bergerak.</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              Lihat Semua
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {latestMovements.length ? (
              latestMovements.map((movement) => {
                const person = wbps.find((item) => item.id === movement.wbpId);
                if (!person) return null;

                const badgeTone =
                  movement.status === "Transit"
                    ? "amber"
                    : getDurationMinutes(movement, now) > 60
                      ? "red"
                      : "green";

                return (
                  <div key={movement.id} className="flex items-center gap-3 rounded-[22px] border border-[#223150] bg-[#132341] p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16294a] text-[#f4c84c]">
                      <UserCircleIcon className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#dbe7ff]">
                        {person.fullName}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        NIK: {person.registrationNumber}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{getOriginLabel(person)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-400">
                        {formatTime(movement.updatedAt)}
                      </p>
                      <Badge tone={badgeTone}>{getStatusLabel(movement)}</Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#223150] bg-[#132341] p-5 text-sm text-slate-400">
                Belum ada pergerakan aktif.
              </div>
            )}

            <Button className="w-full" size="lg">
              Lihat Semua Pergerakan
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[#223150]">
            <div>
              <CardTitle>Ringkasan Per Ruangan</CardTitle>
              <CardDescription>Distribusi WBP dan status pengawasan per ruangan operasional.</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              Lihat Semua
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 xl:grid-cols-4">
            {roomSummary.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-[#223150] bg-[#132341] p-5">
                <div className="flex items-start gap-3 text-[#f4c84c]">
                  <DashboardIcon className="h-5 w-5 shrink-0 mt-0.5" />
                  <p className="font-semibold text-[#dbe7ff] leading-tight min-h-[40px] flex items-center">{item.label}</p>
                </div>
                <p className="mt-5 font-heading text-4xl font-semibold text-[#dbe7ff]">
                  {item.total}
                </p>
                <p className="mt-1 text-sm text-slate-400">WBP Aktif</p>
                <div className="mt-6">
                  <Badge
                    tone={
                      item.status === "Aman"
                        ? "green"
                        : item.status === "Pending"
                          ? "amber"
                          : "red"
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-[#223150]">
            <div>
              <CardTitle>Notifikasi Terbaru</CardTitle>
              <CardDescription>Informasi penting yang memerlukan perhatian.</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              Lihat Semua
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {latestLogs.length ? (
              latestLogs.map((log, index) => {
                const tone =
                  log.status === "Transit"
                    ? "amber"
                    : index === 1
                      ? "red"
                      : "green";
                const Icon =
                  tone === "amber"
                    ? AlertCircleIcon
                    : tone === "red"
                      ? ShieldIcon
                      : BellIcon;

                return (
                  <div key={log.id} className="flex items-start gap-3 rounded-[22px] border border-[#223150] bg-[#132341] p-4">
                    <div
                      className={cn(
                        "mt-0.5 flex h-10 w-10 items-center justify-center rounded-full",
                        tone === "amber"
                          ? "bg-amber-500/15 text-amber-300"
                          : tone === "red"
                            ? "bg-rose-500/15 text-rose-300"
                            : "bg-emerald-500/15 text-emerald-300",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#dbe7ff]">{log.event}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatTime(log.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#223150] bg-[#132341] p-5 text-sm text-slate-400">
                Belum ada notifikasi terbaru.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function indexFallback(date: Date) {
  return [6, 15, 12, 19, 10, 17, 22][date.getDay() % 7];
}
