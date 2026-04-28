"use client";

import { useAppState } from "@/components/app-state";
import { UserManagementPanel } from "@/components/user-management-panel";
import { ShieldIcon, UsersIcon } from "@/components/silo-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export default function UsersPage() {
  const { actor } = useAppState();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="border-b border-[#223150]">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16294a] text-[#f4c84c]">
              <UsersIcon className="h-7 w-7" />
            </div>
            <div>
              <CardTitle>Data User</CardTitle>
              <CardDescription>
                Halaman khusus superadmin untuk mengelola akun petugas, peran,
                unit tugas, status akun, dan penggantian password.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-[24px] border border-[#223150] bg-[#132341] p-4 text-sm text-slate-300">
            {actor?.role === "Superadmin"
              ? "Gunakan halaman ini untuk mengelola seluruh akun petugas secara terpisah dari data WBP."
              : "Halaman ini hanya tersedia untuk superadmin."}
          </div>
        </CardContent>
      </Card>

      {actor?.role === "Superadmin" ? (
        <UserManagementPanel actorRole={actor?.role} actorId={actor?.id} />
      ) : (
        <Card>
          <CardHeader className="border-b border-[#223150]">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300">
                <ShieldIcon className="h-7 w-7" />
              </div>
              <div>
                <CardTitle>Akses Dibatasi</CardTitle>
                <CardDescription>
                  Login sebagai superadmin untuk membuka pengelolaan akun pengguna.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
