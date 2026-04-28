"use client";

import { useEffect, useState } from "react";

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
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import {
  getAssignmentLabel,
  getRoleLabel,
  getRoleOptionFromUser,
  resolveUserRoleOption,
  type AccountUser,
  type UserManagementRoleOption,
} from "@/lib/domain";
import { getInitials } from "@/lib/formatters";

type AccountFormState = {
  id: string;
  name: string;
  email: string;
  roleOption: UserManagementRoleOption;
  isActive: boolean;
  newPassword: string;
  confirmPassword: string;
};

export function UserManagementPanel({
  actorRole,
  actorId,
}: {
  actorRole?: string | null;
  actorId?: string | null;
}) {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountForm, setAccountForm] = useState<AccountFormState | null>(null);

  useEffect(() => {
    if (actorRole !== "Superadmin") {
      setUsers([]);
      return;
    }

    void fetchUsers();
  }, [actorRole]);

  async function fetchUsers() {
    setUsersLoading(true);
    setUsersError("");

    try {
      const response = await fetch("/api/users", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        users?: AccountUser[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Gagal memuat data akun.");
      }

      setUsers(payload.users ?? []);
    } catch (caughtError) {
      setUsersError(
        caughtError instanceof Error ? caughtError.message : "Gagal memuat data akun.",
      );
    } finally {
      setUsersLoading(false);
    }
  }

  function openAccountEditor(user: AccountUser) {
    setAccountError("");
    setAccountForm({
      id: user.id,
      name: user.name,
      email: user.email,
      roleOption: getRoleOptionFromUser(user.role, user.assignment),
      isActive: user.isActive,
      newPassword: "",
      confirmPassword: "",
    });
    setAccountOpen(true);
  }

  async function submitAccount() {
    if (!accountForm) {
      return;
    }

    const resolved = resolveUserRoleOption(accountForm.roleOption);

    if (accountForm.newPassword && accountForm.newPassword !== accountForm.confirmPassword) {
      setAccountError("Konfirmasi password baru belum sama.");
      return;
    }

    if (accountForm.newPassword && accountForm.newPassword.length < 8) {
      setAccountError("Password baru minimal 8 karakter.");
      return;
    }

    try {
      const updateAccountResponse = await fetch(`/api/users/${accountForm.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: resolved.role,
          assignment: resolved.assignment,
          isActive: accountForm.isActive,
        }),
      });

      const updateAccountPayload = (await updateAccountResponse.json()) as {
        error?: string;
      };
      if (!updateAccountResponse.ok) {
        throw new Error(updateAccountPayload.error ?? "Gagal menyimpan akun.");
      }

      if (accountForm.newPassword) {
        const resetPasswordResponse = await fetch(`/api/users/${accountForm.id}/password`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newPassword: accountForm.newPassword,
          }),
        });

        const resetPasswordPayload = (await resetPasswordResponse.json()) as {
          error?: string;
        };
        if (!resetPasswordResponse.ok) {
          throw new Error(
            resetPasswordPayload.error ?? "Gagal mengganti password pengguna.",
          );
        }
      }

      setAccountOpen(false);
      await fetchUsers();
    } catch (caughtError) {
      setAccountError(
        caughtError instanceof Error ? caughtError.message : "Gagal menyimpan akun.",
      );
    }
  }

  async function handleDeleteUser(target: AccountUser) {
    if (actorRole !== "Superadmin") {
      return;
    }

    const confirmed = window.confirm(
      `Hapus akun ${target.name}? Tindakan ini tidak dapat dibatalkan.`,
    );

    if (!confirmed) {
      return;
    }

    setUsersError("");

    try {
      const response = await fetch(`/api/users/${target.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok && response.status !== 204) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Gagal menghapus akun.");
      }

      if (accountForm?.id === target.id) {
        setAccountOpen(false);
      }

      await fetchUsers();
    } catch (caughtError) {
      setUsersError(
        caughtError instanceof Error ? caughtError.message : "Gagal menghapus akun.",
      );
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b border-[#223150]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Manajemen Akun</CardTitle>
              <CardDescription>
                Superadmin dapat mengubah peran, unit tugas, status akun, password,
                dan menghapus akun pengguna.
              </CardDescription>
            </div>
            <Badge tone={actorRole === "Superadmin" ? "green" : "amber"}>
              {actorRole === "Superadmin" ? "Superadmin Aktif" : "Mode Baca Saja"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {usersError ? (
            <div className="mb-4 rounded-[22px] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {usersError}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-[24px] border border-[#223150] bg-[#0f1b33]">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Nama</TH>
                    <TH>Email</TH>
                    <TH>Peran</TH>
                    <TH>Unit Tugas</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Aksi</TH>
                  </TR>
                </THead>
                <TBody>
                  {usersLoading ? (
                    <TR>
                      <TD colSpan={6} className="text-center text-slate-400">
                        Memuat data akun...
                      </TD>
                    </TR>
                  ) : users.length ? (
                    users.map((item) => (
                      <TR key={item.id}>
                        <TD>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16294a] text-sm font-semibold text-[#f4c84c]">
                              {getInitials(item.name)}
                            </div>
                            <span className="font-medium text-[#dbe7ff]">{item.name}</span>
                          </div>
                        </TD>
                        <TD className="text-slate-300">{item.email}</TD>
                        <TD className="text-slate-200">
                          {getRoleLabel(item.role, item.assignment)}
                        </TD>
                        <TD className="text-slate-300">
                          {getAssignmentLabel(item.assignment)}
                        </TD>
                        <TD>
                          <Badge tone={item.isActive ? "green" : "red"}>
                            {item.isActive ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TD>
                        <TD>
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actorRole !== "Superadmin"}
                              onClick={() => openAccountEditor(item)}
                            >
                              Edit Akun
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                              disabled={actorRole !== "Superadmin" || item.id === actorId}
                              onClick={() => void handleDeleteUser(item)}
                            >
                              Hapus
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    ))
                  ) : (
                    <TR>
                      <TD colSpan={6} className="text-center text-slate-400">
                        Belum ada akun pengguna.
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title="Edit Akun Pengguna"
        description="Perubahan peran, unit tugas, dan password akan langsung diterapkan ke sistem."
      >
        {accountForm ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Nama</label>
                <Input readOnly value={accountForm.name} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <Input readOnly value={accountForm.email} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Peran</label>
                <Select
                  value={accountForm.roleOption}
                  onChange={(event) =>
                    setAccountForm((current) =>
                      current
                        ? {
                            ...current,
                            roleOption: event.target.value as UserManagementRoleOption,
                          }
                        : current,
                    )
                  }
                >
                  <option value="Superadmin">Superadmin</option>
                  <option value="Admin">Admin</option>
                  <option value="Petugas Pintu 3">Petugas Pintu 3</option>
                  <option value="Petugas Klinik">Petugas Klinik</option>
                  <option value="Petugas Registrasi">Petugas Registrasi</option>
                  <option value="Petugas Kunjungan">Petugas Kunjungan</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Unit Tugas</label>
                <Input
                  readOnly
                  value={getAssignmentLabel(resolveUserRoleOption(accountForm.roleOption).assignment)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">Password Baru</label>
                <Input
                  type="password"
                  value={accountForm.newPassword}
                  placeholder="Kosongkan jika tidak ingin mengganti password"
                  onChange={(event) =>
                    setAccountForm((current) =>
                      current ? { ...current, newPassword: event.target.value } : current,
                    )
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-300">
                  Konfirmasi Password Baru
                </label>
                <Input
                  type="password"
                  value={accountForm.confirmPassword}
                  placeholder="Ulangi password baru"
                  onChange={(event) =>
                    setAccountForm((current) =>
                      current
                        ? { ...current, confirmPassword: event.target.value }
                        : current,
                    )
                  }
                />
                <p className="text-xs text-slate-400">
                  Jika password diganti, pengguna harus login ulang dengan password baru.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#223150] bg-[#132341] p-4">
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={accountForm.isActive}
                  onChange={(event) =>
                    setAccountForm((current) =>
                      current ? { ...current, isActive: event.target.checked } : current,
                    )
                  }
                />
                Akun aktif dan boleh login
              </label>
            </div>

            {accountError ? (
              <p className="mt-4 text-sm text-rose-700">{accountError}</p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setAccountOpen(false)}>
                Batal
              </Button>
              <Button onClick={() => void submitAccount()}>Simpan Perubahan</Button>
            </div>
          </>
        ) : null}
      </Modal>
    </>
  );
}
