"use client";

import { useMemo, useState } from "react";

import { useAppState } from "@/components/app-state";
import { UserManagementPanel } from "@/components/user-management-panel";
import { MasterDataIcon, UserCircleIcon } from "@/components/silo-icons";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { getInitials } from "@/lib/formatters";

type WbpFormState = {
  id?: string;
  originalRegistrationNumber?: string;
  registrationNumber: string;
  fullName: string;
  roomBlock: string;
  roomNumber: string;
  photoUrl: string;
};

const emptyWbpForm: WbpFormState = {
  registrationNumber: "",
  fullName: "",
  roomBlock: "",
  roomNumber: "",
  photoUrl: "",
};

export default function AdminPage() {
  const { actor, wbps, movements, upsertWbp, deleteWbp } = useAppState();
  const [query, setQuery] = useState("");
  const [wbpOpen, setWbpOpen] = useState(false);
  const [wbpError, setWbpError] = useState("");
  const [wbpForm, setWbpForm] = useState<WbpFormState>(emptyWbpForm);

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

  function openCreateWbp() {
    setWbpError("");
    setWbpForm(emptyWbpForm);
    setWbpOpen(true);
  }

  function openEditWbp(id: string) {
    const target = wbps.find((item) => item.id === id);
    if (!target) {
      return;
    }

    setWbpError("");
    setWbpForm({
      id: target.id,
      originalRegistrationNumber: target.registrationNumber,
      registrationNumber: target.registrationNumber,
      fullName: target.fullName,
      roomBlock: target.roomBlock,
      roomNumber: target.roomNumber,
      photoUrl: target.photoUrl ?? "",
    });
    setWbpOpen(true);
  }

  async function submitWbp() {
    if (
      !wbpForm.registrationNumber.trim() ||
      !wbpForm.fullName.trim() ||
      !wbpForm.roomBlock.trim() ||
      !wbpForm.roomNumber.trim()
    ) {
      setWbpError("Lengkapi nomor registrasi, nama, blok, dan nomor kamar.");
      return;
    }

    const success = await upsertWbp({
      originalRegistrationNumber: wbpForm.originalRegistrationNumber,
      registrationNumber: wbpForm.registrationNumber.trim(),
      fullName: wbpForm.fullName.trim(),
      roomBlock: wbpForm.roomBlock.trim().toUpperCase(),
      roomNumber: wbpForm.roomNumber.trim(),
      photoUrl: wbpForm.photoUrl.trim() || undefined,
    });

    if (success) {
      setWbpOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-[#dbe7ff]">
            Master Data WBP
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Kelola data registrasi, lokasi hunian, dan identitas dasar WBP agar
            operasional monitoring tetap rapi dan konsisten.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MiniSummary label="Total WBP" value={wbps.length} />
          <MiniSummary
            label="Sedang Keluar"
            value={movements.filter((item) => item.status !== "Kembali").length}
          />
          <MiniSummary
            label="Standby"
            value={wbps.length - movements.filter((item) => item.status !== "Kembali").length}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
        <Card>
          <CardHeader className="border-b border-[#223150]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Data WBP</CardTitle>
                <CardDescription>
                  Tambah, edit, dan kelola data penghuni secara terpusat.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  className="sm:w-[280px]"
                  placeholder="Cari nama atau registrasi"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <Button onClick={openCreateWbp}>Tambah WBP</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-hidden rounded-[24px] border border-[#223150] bg-[#0f1b33]">
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>WBP</TH>
                      <TH>Registrasi</TH>
                      <TH>Hunian</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Aksi</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {filteredWbps.length ? (
                      filteredWbps.map((person) => {
                        const active = movements.find(
                          (item) => item.wbpId === person.id && item.status !== "Kembali",
                        );

                        return (
                          <TR key={person.id}>
                            <TD>
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#16294a] text-sm font-semibold text-[#f4c84c]">
                                  {getInitials(person.fullName)}
                                </div>
                                <div>
                                  <p className="font-medium text-[#dbe7ff]">{person.fullName}</p>
                                  <p className="text-xs text-slate-400">Foto: placeholder</p>
                                </div>
                              </div>
                            </TD>
                            <TD className="text-slate-300">{person.registrationNumber}</TD>
                            <TD className="text-slate-300">
                              Blok {person.roomBlock}-{person.roomNumber}
                            </TD>
                            <TD>
                              <Badge tone={active ? "amber" : "green"}>
                                {active ? active.status : "Standby"}
                              </Badge>
                            </TD>
                            <TD>
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditWbp(person.id)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                                  disabled={Boolean(active)}
                                  onClick={() => void deleteWbp(person.registrationNumber)}
                                >
                                  Hapus
                                </Button>
                              </div>
                            </TD>
                          </TR>
                        );
                      })
                    ) : (
                      <TR>
                        <TD colSpan={5} className="text-center text-slate-400">
                          Tidak ada data WBP yang cocok.
                        </TD>
                      </TR>
                    )}
                  </TBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-[#223150]">
              <CardTitle>Ringkasan Pengelolaan</CardTitle>
              <CardDescription>
                Informasi cepat untuk administrasi harian dan pengawasan data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 text-sm text-slate-300">
              <InfoCard
                title="Data Terintegrasi"
                text="Data WBP digunakan langsung untuk monitoring, ruangan, dan riwayat pergerakan."
              />
              <InfoCard
                title="Kontrol Akses"
                text="Pengaturan akun petugas dan hak akses berada di panel manajemen akun."
              />
            </CardContent>
          </Card>

          {actor?.role === "Superadmin" ? (
            <UserManagementPanel actorRole={actor?.role} actorId={actor?.id} />
          ) : (
            <Card>
              <CardHeader className="border-b border-[#223150]">
                <CardTitle>Manajemen Akun</CardTitle>
                <CardDescription>Halaman ini hanya dapat diakses penuh oleh superadmin.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 text-sm text-slate-400">
                Admin dapat mengelola data WBP, tetapi perubahan akun pengguna dilakukan oleh superadmin.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={wbpOpen}
        onClose={() => setWbpOpen(false)}
        title={wbpForm.id ? "Edit Data WBP" : "Tambah WBP Baru"}
        description="Perubahan data akan langsung diterapkan ke sistem."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Nomor Registrasi"
            value={wbpForm.registrationNumber}
            onChange={(value) =>
              setWbpForm((current) => ({ ...current, registrationNumber: value }))
            }
          />
          <FormField
            label="Nama Lengkap"
            value={wbpForm.fullName}
            onChange={(value) => setWbpForm((current) => ({ ...current, fullName: value }))}
          />
          <FormField
            label="Blok"
            value={wbpForm.roomBlock}
            onChange={(value) => setWbpForm((current) => ({ ...current, roomBlock: value }))}
          />
          <FormField
            label="Nomor Kamar"
            value={wbpForm.roomNumber}
            onChange={(value) => setWbpForm((current) => ({ ...current, roomNumber: value }))}
          />
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-slate-300">URL Foto (Opsional)</label>
            <Input
              value={wbpForm.photoUrl}
              onChange={(event) =>
                setWbpForm((current) => ({ ...current, photoUrl: event.target.value }))
              }
            />
          </div>
        </div>

        {wbpError ? <p className="mt-4 text-sm text-rose-700">{wbpError}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setWbpOpen(false)}>
            Batal
          </Button>
          <Button onClick={() => void submitWbp()}>Simpan</Button>
        </div>
      </Modal>
    </div>
  );
}

function MiniSummary({ label, value }: { label: string; value: number }) {
  return (
    <Card className="min-w-[170px]">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16294a] text-[#f4c84c]">
            <MasterDataIcon className="h-5 w-5" />
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

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-[#223150] bg-[#132341] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#edf3ff] text-[#2154aa]">
          <UserCircleIcon className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-[#dbe7ff]">{title}</p>
          <p className="mt-1 leading-6 text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
