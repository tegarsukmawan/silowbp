"use client";

import { useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { useAppState } from "@/components/app-state";
import {
  ArrowRightIcon,
  CalendarIcon,
  HistoryIcon,
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
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { getDurationMinutes, type ReportFilterState } from "@/lib/domain";
import { formatDateTime, formatDuration, formatTime, getStatusLabel } from "@/lib/formatters";

const initialFilters: ReportFilterState = {
  query: "",
  destination: "Semua",
  status: "Semua",
  range: "Hari ini",
};

type ExportFormat = "pdf" | "excel" | null;

export default function LogsPage() {
  const { logs, wbps, movements, now } = useAppState();
  const [filters, setFilters] = useState<ReportFilterState>(initialFilters);
  const [activeExport, setActiveExport] = useState<ExportFormat>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const rangeMs = {
    "Hari ini": 24 * 60 * 60 * 1000,
    "7 Hari": 7 * 24 * 60 * 60 * 1000,
    "30 Hari": 30 * 24 * 60 * 60 * 1000,
  }[filters.range];

  const filteredLogs = useMemo(() => {
    const threshold = now.getTime() - rangeMs;
    return logs.filter((item) => {
      const person = wbps.find((wbp) => wbp.id === item.wbpId);
      const haystack =
        `${person?.fullName ?? ""} ${person?.registrationNumber ?? ""}`.toLowerCase();

      const matchesQuery =
        !filters.query.trim() || haystack.includes(filters.query.trim().toLowerCase());
      const matchesDestination =
        filters.destination === "Semua" || item.destination === filters.destination;
      const matchesStatus = filters.status === "Semua" || item.status === filters.status;
      const matchesRange = new Date(item.timestamp).getTime() >= threshold;

      return matchesQuery && matchesDestination && matchesStatus && matchesRange;
    });
  }, [filters, logs, now, rangeMs, wbps]);

  const filteredMovements = useMemo(() => {
    const ids = new Set(filteredLogs.map((item) => item.movementId));
    return movements.filter((item) => ids.has(item.id));
  }, [filteredLogs, movements]);

  const summary = {
    totalLogs: filteredLogs.length,
    totalMovements: filteredMovements.length,
    pending: filteredMovements.filter((item) => item.status === "Transit").length,
    completed: filteredMovements.filter((item) => item.status === "Kembali").length,
  };

  const exportRows = useMemo(() => {
    return filteredMovements.flatMap((movement) => {
      const person = wbps.find((item) => item.id === movement.wbpId);
      if (!person) {
        return [];
      }

      return [
        {
          nama: person.fullName,
          registrasi: person.registrationNumber,
          blok: person.roomBlock,
          kamar: person.roomNumber,
          tujuan: movement.destination,
          status: getStatusLabel(movement),
          keberangkatan: formatDateTime(movement.departureAt),
          pembaruanTerakhir: formatDateTime(movement.updatedAt),
          durasi: formatDuration(getDurationMinutes(movement, now)),
          petugasPintu3: movement.doorOfficer,
          petugasRuangan: movement.roomOfficer ?? "-",
        },
      ];
    });
  }, [filteredMovements, now, wbps]);

  const logExportRows = useMemo(() => {
    return filteredLogs.flatMap((log) => {
      const person = wbps.find((item) => item.id === log.wbpId);
      if (!person) {
        return [];
      }

      return [
        {
          waktu: formatDateTime(log.timestamp),
          nama: person.fullName,
          registrasi: person.registrationNumber,
          tujuan: log.destination,
          status: log.status,
          aktivitas: log.event,
          operator: log.operator,
        },
      ];
    });
  }, [filteredLogs, wbps]);

  const hasExportData = exportRows.length > 0 || logExportRows.length > 0;

  function buildExportFileName(extension: "pdf" | "xlsx") {
    const stamp = new Date(now)
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);

    return `riwayat-silo-wbp-${filters.range.toLowerCase().replace(/\s+/g, "-")}-${stamp}.${extension}`;
  }

  async function handleExportExcel() {
    if (!hasExportData) {
      setExportMessage("Tidak ada data yang bisa diexport untuk filter saat ini.");
      return;
    }

    setActiveExport("excel");
    setExportMessage(null);

    try {
      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet([
        { indikator: "Rentang", nilai: filters.range },
        { indikator: "Tujuan", nilai: filters.destination },
        { indikator: "Status", nilai: filters.status },
        { indikator: "Pencarian", nilai: filters.query || "-" },
        { indikator: "Total log", nilai: summary.totalLogs },
        { indikator: "Total pergerakan", nilai: summary.totalMovements },
        { indikator: "Menunggu konfirmasi", nilai: summary.pending },
        { indikator: "Sudah kembali", nilai: summary.completed },
      ]);

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan");

      if (exportRows.length) {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(exportRows),
          "Pergerakan",
        );
      }

      if (logExportRows.length) {
        XLSX.utils.book_append_sheet(
          workbook,
          XLSX.utils.json_to_sheet(logExportRows),
          "Timeline",
        );
      }

      XLSX.writeFile(workbook, buildExportFileName("xlsx"));
      setExportMessage("File Excel berhasil diunduh.");
    } catch {
      setExportMessage("Export Excel gagal. Coba lagi beberapa saat.");
    } finally {
      setActiveExport(null);
    }
  }

  async function handleExportPdf() {
    if (!hasExportData) {
      setExportMessage("Tidak ada data yang bisa diexport untuk filter saat ini.");
      return;
    }

    setActiveExport("pdf");
    setExportMessage(null);

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(18);
      doc.text("Riwayat Pergerakan WBP", 40, 42);
      doc.setFontSize(10);
      doc.text(`Diexport: ${formatDateTime(now.toISOString())}`, 40, 64);
      doc.text(`Filter: ${filters.range} | ${filters.destination} | ${filters.status}`, 40, 80);

      autoTable(doc, {
        startY: 102,
        theme: "grid",
        head: [["Ringkasan", "Nilai"]],
        body: [
          ["Total log", String(summary.totalLogs)],
          ["Total pergerakan", String(summary.totalMovements)],
          ["Menunggu konfirmasi", String(summary.pending)],
          ["Sudah kembali", String(summary.completed)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [15, 47, 114] },
      });

      autoTable(doc, {
        startY:
          (((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
            102) + 18),
        theme: "striped",
        head: [[
          "Nama",
          "Registrasi",
          "Tujuan",
          "Status",
          "Durasi",
          "Keberangkatan",
          "Petugas",
        ]],
        body: exportRows.length
          ? exportRows.map((row) => [
              row.nama,
              row.registrasi,
              row.tujuan,
              row.status,
              row.durasi,
              row.keberangkatan,
              `${row.petugasPintu3} / ${row.petugasRuangan}`,
            ])
          : [["-", "-", "-", "-", "-", "-", "-"]],
        styles: { fontSize: 8, cellPadding: 6 },
        headStyles: { fillColor: [33, 84, 170] },
      });

      doc.save(buildExportFileName("pdf"));
      setExportMessage("File PDF berhasil diunduh.");
    } catch {
      setExportMessage("Export PDF gagal. Coba lagi beberapa saat.");
    } finally {
      setActiveExport(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#dbe7ff]">
            Riwayat Pergerakan
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Lihat timeline lengkap pergerakan WBP, filter per status dan tujuan,
            lalu unduh laporan operasional jika dibutuhkan.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Log" value={summary.totalLogs} />
          <SummaryCard label="Pergerakan" value={summary.totalMovements} />
          <SummaryCard label="Menunggu Konfirmasi" value={summary.pending} />
          <SummaryCard label="Sudah Kembali" value={summary.completed} />
        </div>
      </section>

      <Card>
        <CardHeader className="border-b border-[#223150]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle>Filter Riwayat</CardTitle>
              <CardDescription>
                Sesuaikan pencarian untuk menampilkan aktivitas yang ingin ditinjau.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => void handleExportPdf()}
                disabled={activeExport !== null}
              >
                {activeExport === "pdf" ? "Menyiapkan PDF..." : "Export PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleExportExcel()}
                disabled={activeExport !== null}
              >
                {activeExport === "excel" ? "Menyiapkan Excel..." : "Export Excel"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 xl:grid-cols-4">
            <div className="relative xl:col-span-1">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-11"
                placeholder="Cari nama atau registrasi"
                value={filters.query}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, query: event.target.value }))
                }
              />
            </div>
            <Select
              value={filters.destination}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  destination: event.target.value as ReportFilterState["destination"],
                }))
              }
            >
              <option value="Semua">Semua Tujuan</option>
              <option value="Klinik">Klinik</option>
              <option value="Registrasi">Registrasi</option>
              <option value="Kunjungan">Kunjungan</option>
            </Select>
            <Select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as ReportFilterState["status"],
                }))
              }
            >
              <option value="Semua">Semua Status</option>
              <option value="Transit">Transit</option>
              <option value="Tiba">Tiba</option>
              <option value="Selesai">Selesai</option>
              <option value="Kembali">Kembali</option>
            </Select>
            <Select
              value={filters.range}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  range: event.target.value as ReportFilterState["range"],
                }))
              }
            >
              <option value="Hari ini">Hari Ini</option>
              <option value="7 Hari">7 Hari Terakhir</option>
              <option value="30 Hari">30 Hari Terakhir</option>
            </Select>
          </div>

          {exportMessage ? (
            <div className="rounded-[22px] border border-[#223150] bg-[#132341] px-4 py-3 text-sm text-[#8fb3ff]">
              {exportMessage}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
        <Card>
          <CardHeader className="border-b border-[#223150]">
            <CardTitle>Tabel Pergerakan</CardTitle>
            <CardDescription>
              Status terakhir untuk kebutuhan laporan dan validasi petugas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-hidden rounded-[24px] border border-[#223150] bg-[#0f1b33]">
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>WBP</TH>
                      <TH>Tujuan</TH>
                      <TH>Status</TH>
                      <TH>Pembaruan</TH>
                      <TH>Durasi</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {filteredMovements.length ? (
                      filteredMovements.map((movement) => {
                        const person = wbps.find((item) => item.id === movement.wbpId);
                        if (!person) {
                          return null;
                        }

                        return (
                          <TR key={movement.id}>
                            <TD>
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16294a] text-[#f4c84c]">
                                  <UserCircleIcon className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="font-medium text-[#dbe7ff]">{person.fullName}</p>
                                  <p className="text-xs text-slate-400">{person.registrationNumber}</p>
                                </div>
                              </div>
                            </TD>
                            <TD className="text-slate-300">{movement.destination}</TD>
                            <TD>
                              <Badge
                                tone={
                                  movement.status === "Kembali"
                                    ? "green"
                                    : movement.status === "Selesai"
                                      ? "amber"
                                      : movement.status === "Transit"
                                        ? "blue"
                                        : "default"
                                }
                              >
                                {getStatusLabel(movement)}
                              </Badge>
                            </TD>
                            <TD className="text-slate-300">{formatDateTime(movement.updatedAt)}</TD>
                            <TD className="text-slate-300">
                              {formatDuration(getDurationMinutes(movement, now))}
                            </TD>
                          </TR>
                        );
                      })
                    ) : (
                      <TR>
                        <TD colSpan={5} className="text-center text-slate-400">
                          Tidak ada data sesuai filter.
                        </TD>
                      </TR>
                    )}
                  </TBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[#223150]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>Timeline Aktivitas</CardTitle>
                <CardDescription>
                  Urutan kejadian terbaru dari seluruh pergerakan.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {filteredLogs.length ? (
              filteredLogs.map((log) => {
                const person = wbps.find((item) => item.id === log.wbpId);
                if (!person) {
                  return null;
                }

                return (
                  <div key={log.id} className="grid grid-cols-[54px_18px_1fr] gap-3">
                    <div className="pt-1 text-sm font-semibold text-slate-400">
                      {formatTime(log.timestamp)}
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-[#2154aa]" />
                      <div className="mt-1 h-full w-px bg-[#223150]" />
                    </div>
                    <div className="rounded-[22px] border border-[#223150] bg-[#132341] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#dbe7ff]">{person.fullName}</p>
                          <p className="mt-1 text-sm text-slate-400">{log.event}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Dikonfirmasi oleh {log.operator}
                          </p>
                        </div>
                        <Badge tone="green">{log.destination}</Badge>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-[#223150] bg-[#132341] p-6 text-sm text-slate-400">
                Tidak ada timeline untuk rentang waktu yang dipilih.
              </div>
            )}

            <div className="rounded-[22px] border border-[#223150] bg-[#132341] p-4">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-sm font-semibold text-[#dbe7ff]"
              >
                Lihat Riwayat Lengkap
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="min-w-[170px]">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 text-[#8fb3ff]">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16294a]">
            <HistoryIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              {label}
            </p>
            <p className="mt-1 font-heading text-2xl font-semibold text-[#dbe7ff]">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
