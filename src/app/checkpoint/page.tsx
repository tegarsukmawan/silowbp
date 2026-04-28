"use client";

import { useMemo, useState } from "react";

import { useAppState } from "@/components/app-state";
import {
  ArrowRightIcon,
  SearchIcon,
  SwapIcon,
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
import { dashboardColumns } from "@/lib/domain";
import { formatDateTime, formatTime, getOriginLabel, getStatusLabel } from "@/lib/formatters";

export default function CheckpointPage() {
  const { wbps, movements, sendToDestination, confirmReturned } = useAppState();
  const [query, setQuery] = useState("");

  const filteredWbps = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return wbps;
    }

    return wbps.filter(
      (item) =>
        item.fullName.toLowerCase().includes(normalized) ||
        item.registrationNumber.toLowerCase().includes(normalized),
    );
  }, [query, wbps]);

  const returnQueue = movements.filter((item) => item.status === "Selesai");
  const activeTransit = movements.filter((item) => item.status === "Transit");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
      <Card>
        <CardHeader className="border-b border-[#223150]">
          <CardTitle>Panel Pintu 3</CardTitle>
          <CardDescription>
            Cari WBP, cek status aktif, lalu arahkan ke unit tujuan dengan satu klik.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-11"
              placeholder="Cari nama atau nomor registrasi"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <div className="grid gap-4">
            {filteredWbps.length ? (
              filteredWbps.map((person) => {
                const activeMovement = movements.find(
                  (item) => item.wbpId === person.id && item.status !== "Kembali",
                );

                return (
                  <div
                    key={person.id}
                    className="rounded-[28px] border border-[#223150] bg-[#0f1b33] p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16294a] text-[#f4c84c]">
                          <UserCircleIcon className="h-8 w-8" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-heading text-xl font-semibold text-[#dbe7ff]">
                              {person.fullName}
                            </h3>
                            <Badge tone={activeMovement ? "amber" : "green"}>
                              {activeMovement ? getStatusLabel(activeMovement) : "Siap Berangkat"}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">{person.registrationNumber}</p>
                          <p className="text-sm text-slate-400">{getOriginLabel(person)}</p>
                          {activeMovement ? (
                            <p className="mt-2 text-sm text-slate-400">
                              Aktivitas terakhir ke {activeMovement.destination} sejak{" "}
                              {formatTime(activeMovement.departureAt)} WIB
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="grid w-full gap-3 md:grid-cols-3 xl:w-[430px]">
                        {dashboardColumns.map((column) => (
                          <Button
                            key={column.destination}
                            className="h-14 rounded-2xl"
                            disabled={Boolean(activeMovement)}
                            onClick={() => void sendToDestination(person.id, column.destination)}
                          >
                            Ke {column.destination}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[28px] border border-dashed border-[#223150] bg-[#132341] p-8 text-center text-sm text-slate-400">
                WBP tidak ditemukan. Coba kata kunci lain.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <QueueCard
          title="Antrian Kepulangan"
          description="Konfirmasi akhir dilakukan oleh petugas Pintu 3."
          items={returnQueue}
          wbps={wbps}
          emptyMessage="Belum ada WBP yang menunggu konfirmasi kembali."
          actionLabel="Konfirmasi Kembali"
          onAction={(movementId) => void confirmReturned(movementId)}
        />

        <Card>
          <CardHeader className="border-b border-[#223150]">
            <CardTitle>Transit Aktif</CardTitle>
            <CardDescription>WBP yang baru berangkat dari Pintu 3.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {activeTransit.length ? (
              activeTransit.map((movement) => {
                const person = wbps.find((item) => item.id === movement.wbpId);
                if (!person) {
                  return null;
                }

                return (
                  <div
                    key={movement.id}
                    className="rounded-[24px] border border-[#223150] bg-[#132341] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#dbe7ff]">{person.fullName}</p>
                        <p className="mt-1 text-sm text-slate-400">Menuju {movement.destination}</p>
                      </div>
                      <Badge tone="blue">Transit</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                      Dikirim {formatDateTime(movement.departureAt)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#223150] bg-[#132341] p-5 text-sm text-slate-400">
                Tidak ada transit aktif dari Pintu 3.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QueueCard({
  title,
  description,
  items,
  wbps,
  emptyMessage,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  items: Array<{
    id: string;
    wbpId: string;
    destination: string;
    completedAt?: string;
  }>;
  wbps: Array<{
    id: string;
    fullName: string;
  }>;
  emptyMessage: string;
  actionLabel: string;
  onAction: (movementId: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="border-b border-[#223150]">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {items.length ? (
          items.map((movement) => {
            const person = wbps.find((item) => item.id === movement.wbpId);
            if (!person) {
              return null;
            }

            return (
              <div
                key={movement.id}
                className="rounded-[24px] border border-[#223150] bg-[#132341] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-[#dbe7ff]">{person.fullName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {movement.destination} selesai pukul {formatTime(movement.completedAt)} WIB
                    </p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16294a] text-[#f4c84c]">
                    <SwapIcon className="h-5 w-5" />
                  </div>
                </div>

                <Button className="mt-4 w-full" onClick={() => onAction(movement.id)}>
                  {actionLabel}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#223150] bg-[#132341] p-5 text-sm text-slate-400">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
