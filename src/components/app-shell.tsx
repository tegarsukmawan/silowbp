"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AppStateProvider, useAppState } from "@/components/app-state";
import { motion, useScroll, useTransform } from "framer-motion";
import { ActivityIcon, CheckCircleIcon, MapPinIcon, BarChart2Icon, SearchIcon } from "lucide-react";
import {
  ArrowRightIcon,
  BarsIcon,
  BellIcon,
  CalendarIcon,
  ChevronDownIcon,
  DashboardIcon,
  FilterIcon,
  HistoryIcon,
  LockIcon,
  LogoutIcon,
  MasterDataIcon,
  MonitoringIcon,
  ReportIcon,
  SettingsIcon,
  ShieldIcon,
  TeamIcon,
  UserCircleIcon,
  UsersIcon,
  WifiIcon,
} from "@/components/silo-icons";
import { Badge, Button, Input, Select } from "@/components/ui";
import {
  type PublicRegistrationRoleOption,
  getAssignmentLabel,
  getRoleLabel,
  resolveUserRoleOption,
  type Role,
} from "@/lib/domain";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  short: string;
  group: "utama" | "operasional" | "master";
  roles?: Role[];
  icon: (props: { className?: string }) => React.ReactNode;
};

const navigation: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    short: "DSH",
    group: "utama",
    icon: DashboardIcon,
  },
  {
    href: "/monitoring",
    label: "Monitoring",
    short: "MON",
    group: "utama",
    icon: MonitoringIcon,
  },
  {
    href: "/logs",
    label: "Riwayat Pergerakan",
    short: "RWT",
    group: "utama",
    icon: HistoryIcon,
  },
  {
    href: "/checkpoint",
    label: "Pintu 3",
    short: "PT3",
    group: "operasional",
    roles: ["Superadmin", "Admin", "Petugas Pintu 3"],
    icon: FilterIcon,
  },
  {
    href: "/rooms",
    label: "Ruangan",
    short: "RNG",
    group: "operasional",
    roles: ["Superadmin", "Admin", "Petugas Ruangan"],
    icon: TeamIcon,
  },
  {
    href: "/admin",
    label: "Data WBP",
    short: "WBP",
    group: "master",
    roles: ["Superadmin", "Admin"],
    icon: MasterDataIcon,
  },
  {
    href: "/users",
    label: "Data User",
    short: "USR",
    group: "master",
    roles: ["Superadmin"],
    icon: UsersIcon,
  },
];

type NotificationItem = {
  id: string;
  href: string;
  title: string;
  description: string;
  tone: "blue" | "amber";
};

function AppWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-4", compact && "gap-3")}>
      <div
        className={cn(
          "relative h-14 w-14 overflow-hidden rounded-full border border-[#204f94] bg-[#0c1d3a] shadow-lg",
          compact && "h-11 w-11",
        )}
      >
        <Image
          src="/logo-kemenimipas-2024.png"
          alt="Logo Kementerian Imigrasi dan Pemasyarakatan"
          fill
          sizes={compact ? "44px" : "56px"}
          className="object-contain p-[6%]"
          priority
        />
      </div>
      <div>
        <p className={cn("font-heading font-semibold tracking-tight text-[#dbe7ff]", compact ? "text-2xl" : "text-[2rem]")}>
          SILO WBP
        </p>
        <p className="text-xs font-medium uppercase tracking-[0.08em] text-slate-300">
          Sistem Monitoring Pergerakan Warga Binaan Pemasyarakatan
        </p>
        {!compact ? (
          <p className="mt-1 text-xs uppercase tracking-[0.08em] text-slate-500">
            Kementerian Imigrasi dan Pemasyarakatan Republik Indonesia
          </p>
        ) : null}
      </div>
    </div>
  );
}

function LandingFeature({
  title,
  description,
  icon,
  className,
  style,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-[#233454] bg-[#132341]/90 p-5 shadow-[0_20px_50px_rgba(2,8,23,0.28)] backdrop-blur",
        className,
      )}
      style={style}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#16294a] text-[#f4c84c]">
        {icon}
      </div>
      <p className="mt-4 text-sm font-semibold text-[#dbe7ff]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function LandingMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[26px] border border-[#233454] bg-[#101d37]/85 p-5 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 font-heading text-3xl font-semibold text-[#dbe7ff]">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{helper}</p>
    </div>
  );
}

function LoginPanel() {
  const { signIn, signUp, isAuthenticating, error, clearError } = useAppState();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [roleOption, setRoleOption] =
    useState<PublicRegistrationRoleOption>("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);

  const resolvedRole = resolveUserRoleOption(roleOption);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    if (mode === "sign-up") {
      await signUp({
        name,
        email,
        password,
        role: resolvedRole.role as "Admin" | "Petugas Pintu 3" | "Petugas Ruangan",
        assignment: resolvedRole.assignment,
      });
      return;
    }

    await signIn({ email, password });
  }

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 1000], [0, 400]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  return (
    <div className="relative min-h-screen bg-[#07101d] text-slate-100 font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 transition-all duration-300 bg-[#0a1526]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <AppWordmark compact />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#beranda" className="text-[#f4c84c] border-b-2 border-[#f4c84c] pb-1">Beranda</a>
            <a href="#tentang" className="hover:text-white transition">Tentang</a>
            <a href="#fitur" className="hover:text-white transition">Fitur</a>
            <a href="#dashboard" className="hover:text-white transition">Dashboard</a>
            <a href="#kontak" className="hover:text-white transition">Kontak</a>
          </div>
          <button 
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 bg-[#1b345f] hover:bg-[#25467e] text-white px-5 py-2.5 rounded-xl font-semibold transition"
          >
            <LockIcon className="w-4 h-4" />
            Login
          </button>
        </div>
      </nav>

      {/* Hero Parallax Section */}
      <section id="beranda" className="relative h-screen flex items-center justify-center overflow-hidden bg-[#07101d]">
        <motion.div 
          style={{ y: heroY, opacity: heroOpacity }}
          className="absolute inset-0 z-0"
        >
          {/* Gradien yang sangat tipis agar gambar tetap terlihat terang */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07101d]/80 via-transparent to-transparent z-10" />
          <Image 
            src="/images/hero.png" 
            alt="Hero Background" 
            fill 
            className="object-cover object-[70%_top]"
            priority
            unoptimized
          />
        </motion.div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 mt-20">
          <div className="max-w-2xl">
            <h2 className="text-[#f4c84c] font-bold tracking-widest text-sm mb-4 uppercase">Sistem Terintegrasi</h2>
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#dbe7ff] leading-[1.15] mb-6 font-heading">
              Monitoring Pergerakan Warga Binaan secara <span className="text-[#f4c84c]">Real-time</span>
            </h1>
            <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl">
              SILO WBP adalah sistem terintegrasi untuk memantau pergerakan Warga Binaan Pemasyarakatan secara real-time, akurat, dan terintegrasi.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-2 bg-[#f4c84c] hover:bg-[#f3b924] text-[#07101d] px-6 py-3.5 rounded-xl font-bold transition">
                <BarChart2Icon className="w-5 h-5" />
                Lihat Dashboard
              </button>
              <a href="#tentang" className="flex items-center gap-2 border border-white/20 hover:bg-white/10 text-white px-6 py-3.5 rounded-xl font-bold transition">
                <SearchIcon className="w-5 h-5" />
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Floating Section */}
      <section className="relative z-20 -mt-24 max-w-6xl mx-auto px-6">
        <div className="bg-[#0f1d38] border border-[#233454] rounded-[32px] p-8 shadow-2xl flex flex-wrap md:flex-nowrap justify-between gap-8 backdrop-blur-xl">
          <div className="flex-1 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
              <UsersIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#dbe7ff] mb-1">2.453</h3>
              <p className="text-sm font-semibold text-slate-300">Total WBP Aktif</p>
              <p className="text-xs text-slate-500 mt-1">Data real-time</p>
            </div>
          </div>
          <div className="hidden md:block w-px bg-white/10"></div>
          <div className="flex-1 flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
              <ActivityIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#dbe7ff] mb-1">128</h3>
              <p className="text-sm font-semibold text-slate-300">Perpindahan Hari Ini</p>
              <p className="text-xs text-slate-500 mt-1">Diperbarui real-time</p>
            </div>
          </div>
          <div className="hidden md:block w-px bg-white/10"></div>
          <div className="flex-1 flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
              <BellIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#dbe7ff] mb-1">23</h3>
              <p className="text-sm font-semibold text-slate-300">Belum Dikonfirmasi</p>
              <p className="text-xs text-slate-500 mt-1">Perlu perhatian</p>
            </div>
          </div>
          <div className="hidden md:block w-px bg-white/10"></div>
          <div className="flex-1 flex items-center gap-4">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400">
              <ShieldIcon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#dbe7ff] mb-1">5</h3>
              <p className="text-sm font-semibold text-slate-300">Tidak Sesuai</p>
              <p className="text-xs text-slate-500 mt-1">Perlu tindakan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-32 relative bg-[#0a1526] overflow-hidden border-t border-[#233454]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-[#f4c84c] font-bold tracking-widest text-sm mb-4 uppercase">Kenapa Silo WBP?</h2>
          <h1 className="text-4xl font-extrabold text-[#dbe7ff] mb-16 font-heading">Sistem Terintegrasi untuk Keamanan yang Lebih Baik</h1>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { title: "Akurat & Real-time", desc: "Data pergerakan diperbarui secara real-time dan akurat setiap saat.", icon: CheckCircleIcon, color: "text-blue-400", bg: "bg-blue-500/10" },
              { title: "Terintegrasi", desc: "Terhubung dengan sistem internal untuk monitoring yang lebih efektif.", icon: MapPinIcon, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { title: "Notifikasi Otomatis", desc: "Peringatan otomatis untuk setiap aktivitas yang perlu mendapat perhatian.", icon: BellIcon, color: "text-amber-400", bg: "bg-amber-500/10" },
              { title: "Laporan & Analitik", desc: "Laporan lengkap dan analitik untuk mendukung pengambilan keputusan.", icon: BarChart2Icon, color: "text-purple-400", bg: "bg-purple-500/10" },
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0f1d38] border border-[#233454] rounded-3xl p-8 shadow-xl hover:bg-[#132341] transition duration-300 flex flex-col items-center text-center"
              >
                <div className={`w-16 h-16 rounded-full ${f.bg} flex items-center justify-center mb-6`}>
                  <f.icon className={`w-8 h-8 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold text-[#dbe7ff] mb-4">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="relative py-32 bg-[#07101d] overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-40">
          <Image src="/images/about.png" alt="About" fill className="object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#07101d] via-[#07101d]/80 to-transparent z-10" />
        
        <div className="relative z-20 max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-[#f4c84c] font-bold tracking-widest text-sm mb-4 uppercase">Tentang Silo WBP?</h2>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#dbe7ff] leading-tight mb-6 font-heading">
              Mendukung Pengawasan yang Efektif dan Efisien
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-lg">
              SILO WBP dikembangkan untuk membantu petugas pemasyarakatan dalam memantau seluruh pergerakan WBP secara terstruktur, transparan, dan akuntabel. Sistem ini mendukung terciptanya lingkungan pemasyarakatan yang aman, tertib, dan kondusif.
            </p>
            <button className="flex items-center gap-2 border border-white/20 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold transition">
              Selengkapnya <SearchIcon className="w-4 h-4 ml-2" />
            </button>
          </div>
          <div className="flex-1 relative">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 rounded-full border border-white/10 border-dashed animate-[spin_60s_linear_infinite]" />
              <div className="absolute inset-4 rounded-full overflow-hidden border-4 border-[#0f1d38]">
                <Image src="/images/about.png" alt="Officers" fill className="object-cover" />
              </div>
              
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-8 top-1/4 bg-white rounded-2xl p-4 shadow-xl flex flex-col items-center text-center w-28"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                  <UsersIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">Petugas Terverifikasi</p>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-4 top-10 bg-white rounded-2xl p-4 shadow-xl flex flex-col items-center text-center w-28"
              >
                <div className="w-10 h-10 bg-[#07101d] rounded-full flex items-center justify-center text-white mb-2">
                  <LockIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">Keamanan Terjamin</p>
              </motion.div>
              
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute -right-8 bottom-1/4 bg-white rounded-2xl p-4 shadow-xl flex flex-col items-center text-center w-28"
              >
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
                  <ShieldIcon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">Sistem Aman</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#07101d] py-8 border-t border-[#233454] text-center">
        <p className="text-slate-400 italic font-medium">"Integrasi, Transparansi, dan Akuntabilitas untuk Pemasyarakatan yang Lebih Baik."</p>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07101d]/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#0f1b33] rounded-[32px] border border-[#233454] shadow-2xl overflow-hidden relative"
          >
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <div className="p-8">
              <div className="mb-6">
                <AppWordmark compact />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-[#dbe7ff] mb-2">
                {mode === "sign-in" ? "Masuk Ke Dashboard" : "Daftar Akun Baru"}
              </h2>
              <p className="text-sm leading-6 text-slate-400 mb-6">
                {mode === "sign-in"
                  ? "Masuk untuk memantau aktivitas WBP."
                  : "Buat akun petugas sesuai peran."}
              </p>

              <div className="inline-flex rounded-full border border-[#233454] bg-[#132341] p-1 mb-6 w-full">
                {[
                  { id: "sign-in", label: "Masuk" },
                  { id: "sign-up", label: "Daftar" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      clearError();
                      setMode(item.id as "sign-in" | "sign-up");
                      if (item.id === "sign-up") {
                        setName("");
                        setRoleOption("Admin");
                        setEmail("");
                        setPassword("");
                      }
                    }}
                    className={cn(
                      "flex-1 rounded-full px-5 py-2.5 text-sm font-semibold transition-all",
                      mode === item.id
                        ? "bg-[#2154aa] text-white shadow-[0_10px_24px_rgba(33,84,170,0.3)]"
                        : "text-slate-400 hover:text-white",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <form className="space-y-5" onSubmit={submit}>
                {mode === "sign-up" && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Nama Lengkap</label>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Masukkan nama lengkap petugas"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Peran</label>
                      <Select
                        value={roleOption}
                        onChange={(event) =>
                          setRoleOption(event.target.value as PublicRegistrationRoleOption)
                        }
                      >
                        <option value="Admin">Admin</option>
                        <option value="Petugas Pintu 3">Petugas Pintu 3</option>
                        <option value="Petugas Klinik">Petugas Klinik</option>
                        <option value="Petugas Registrasi">Petugas Registrasi</option>
                        <option value="Petugas Kunjungan">Petugas Kunjungan</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Unit Tugas</label>
                      <Input readOnly value={getAssignmentLabel(resolvedRole.assignment)} />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="petugas@silo-wbp.go.id"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Masukkan password"
                  />
                </div>

                {error && (
                  <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <Button className="w-full" size="lg" disabled={isAuthenticating} type="submit">
                  {isAuthenticating
                    ? mode === "sign-in"
                      ? "Memproses..."
                      : "Memproses..."
                    : mode === "sign-in"
                      ? "Masuk"
                      : "Daftar & Masuk"}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07101d] text-slate-100 overflow-hidden relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Rings */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-10">
          {/* Outer dashed ring */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-dashed border-[#4f8cff]/40"
          />
          {/* Inner solid ring spinning opposite */}
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-3 rounded-full border-t-2 border-l-2 border-transparent border-b-[#f4c84c] border-r-[#f4c84c] opacity-80"
          />
          {/* Center glowing icon */}
          <motion.div 
            animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-6 rounded-full bg-[#132341] border border-[#233454] flex items-center justify-center shadow-[0_0_40px_rgba(79,140,255,0.4)]"
          >
            <ShieldIcon className="w-8 h-8 text-[#f4c84c]" />
          </motion.div>
        </div>

        {/* Text Area */}
        <div className="text-center">
          <motion.h2 
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="font-heading text-3xl font-extrabold text-[#dbe7ff] mb-3 tracking-wide"
          >
            SILO <span className="text-[#f4c84c]">WBP</span>
          </motion.h2>
          
          <div className="flex items-center justify-center gap-1.5 text-slate-400 font-medium text-sm">
            <span>Memuat sistem operasional</span>
            <span className="flex gap-0.5">
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}>.</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}>.</motion.span>
              <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}>.</motion.span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function groupLabel(group: NavItem["group"]) {
  if (group === "utama") return "Menu Utama";
  if (group === "operasional") return "Operasional";
  return "Master Data";
}

function SidebarSection({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-2">
      <p className="px-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
        {title}
      </p>
      <div className="space-y-1.5">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-[#163d86] text-[#dbe7ff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                  : "text-[#c8d8ff]/85 hover:bg-white/10 hover:text-[#e7f0ff]",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-2xl",
                  active ? "bg-[#f3c34b] text-[#163d86]" : "bg-white/10 text-[#dbe7ff]",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div>{item.label}</div>
              </div>
              <ArrowRightIcon className={cn("h-4 w-4", active ? "text-[#dbe7ff]" : "text-slate-400")} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { actor, movements, now, signOut, error, clearError } = useAppState();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const allowedNavigation = useMemo(() => {
    if (!actor) {
      return [];
    }

    return navigation.filter((item) => !item.roles || item.roles.includes(actor.role));
  }, [actor]);

  useEffect(() => {
    if (!actor) {
      return;
    }

    const allowed = allowedNavigation.some((item) => item.href === pathname);
    if (!allowed) {
      router.replace("/dashboard");
    }
  }, [actor, allowedNavigation, pathname, router]);

  useEffect(() => {
    setNotificationsOpen(false);
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [actor, pathname]);

  const notifications = useMemo<NotificationItem[]>(() => {
    if (!actor) {
      return [];
    }

    const items: NotificationItem[] = [];

    for (const movement of movements) {
      if (
        movement.status === "Transit" &&
        (actor.role === "Superadmin" ||
          actor.role === "Admin" ||
          (actor.role === "Petugas Ruangan" && actor.assignment === movement.destination))
      ) {
        items.push({
          id: `arrival-${movement.id}`,
          href: "/rooms",
          title: `Konfirmasi Kedatangan ${movement.destination}`,
          description: `${movement.doorOfficer} mengirim WBP dan menunggu konfirmasi ruangan.`,
          tone: "blue",
        });
      }

      if (
        movement.status === "Selesai" &&
        (actor.role === "Superadmin" ||
          actor.role === "Admin" ||
          actor.role === "Petugas Pintu 3")
      ) {
        items.push({
          id: `return-${movement.id}`,
          href: "/checkpoint",
          title: "Konfirmasi Kepulangan WBP",
          description: `${movement.destination} sudah selesai dan menunggu verifikasi akhir di Pintu 3.`,
          tone: "amber",
        });
      }
    }

    return items;
  }, [actor, movements]);

  const groupedNavigation = useMemo(() => {
    return {
      utama: allowedNavigation.filter((item) => item.group === "utama"),
      operasional: allowedNavigation.filter((item) => item.group === "operasional"),
      master: allowedNavigation.filter((item) => item.group === "master"),
    };
  }, [allowedNavigation]);

  const mobilePrimary = allowedNavigation.filter((item) =>
    ["/dashboard", "/monitoring", "/logs"].includes(item.href),
  );

  if (!actor) {
    return <LoginPanel />;
  }

  const activeCount = movements.filter((item) => item.status !== "Kembali").length;

  return (
    <div className="min-h-screen bg-[#08111f] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1640px] flex-col lg:flex-row">
        <aside className="hidden w-[300px] shrink-0 bg-[#0f2f72] px-6 py-7 text-white lg:flex lg:flex-col">
          <AppWordmark compact />

          <div className="mt-8 flex-1 space-y-8">
            <SidebarSection title={groupLabel("utama")} items={groupedNavigation.utama} pathname={pathname} />
            {groupedNavigation.operasional.length ? (
              <SidebarSection title={groupLabel("operasional")} items={groupedNavigation.operasional} pathname={pathname} />
            ) : null}
            {groupedNavigation.master.length ? (
              <SidebarSection title={groupLabel("master")} items={groupedNavigation.master} pathname={pathname} />
            ) : null}
          </div>

          <div className="space-y-5 pt-6">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-2xl border border-white/15 bg-white/5 px-4 py-6 text-white hover:bg-white/10"
              onClick={() => void signOut()}
            >
              <LogoutIcon className="h-5 w-5" />
              Logout
            </Button>

            <div className="rounded-[28px] border border-white/10 bg-[#12387f] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3c34b] text-[#163d86]">
                  <ShieldIcon className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f8d77f]">Aman & Terpercaya</p>
                  <p className="mt-1 text-xs leading-5 text-slate-200">
                    Sistem dirancang untuk monitoring pergerakan secara aman,
                    cepat, dan terintegrasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#223150] bg-[#091425]/95 backdrop-blur">
            <div className="flex items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#223150] bg-[#0f1b33] text-white lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu"
              >
                <BarsIcon className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="lg:hidden">
                  <AppWordmark compact />
                </div>
                <div className="hidden lg:block">
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#f4c84c]">
                    SILO WBP
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Ringkasan Informasi Monitoring Pergerakan WBP Secara Real-time
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotificationsOpen((current) => !current)}
                className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#223150] bg-[#0f1b33] text-white transition hover:bg-[#16243f]"
                aria-label="Buka notifikasi"
              >
                <BellIcon className="h-5 w-5" />
                {notifications.length ? (
                  <span className="absolute right-0 top-0 inline-flex min-w-5 -translate-y-1/3 translate-x-1/4 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {notifications.length}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => setAccountMenuOpen((current) => !current)}
                className="hidden items-center gap-3 rounded-[28px] border border-[#223150] bg-[#0f1b33] px-4 py-2.5 text-left shadow-sm transition hover:border-[#33598f] hover:bg-[#132341] sm:flex"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16294a] text-[#f4c84c]">
                  <UserCircleIcon className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#dbe7ff]">{actor.name}</p>
                  <p className="truncate text-xs text-slate-400">{actor.email}</p>
                </div>
                <Badge tone="blue" className="ml-1">
                  {getRoleLabel(actor.role, actor.assignment)}
                </Badge>
                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-8">
            {error ? (
              <div className="mb-5 flex items-center justify-between gap-4 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <span>{error}</span>
                <Button size="sm" variant="ghost" onClick={clearError}>
                  Tutup
                </Button>
              </div>
            ) : null}

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#223150] bg-[#0f1b33] px-4 py-4 shadow-[0_16px_40px_rgba(2,8,23,0.24)]">
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Operasional Hari Ini
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="green">Pemantauan Aktif</Badge>
                  <Badge tone="blue">{activeCount} WBP Aktif</Badge>
                  <Badge tone="amber">{notifications.length} Perlu Konfirmasi</Badge>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-[#223150] bg-[#132341] px-4 py-3 text-sm text-slate-300">
                  <CalendarIcon className="h-4 w-4 text-[#f4c84c]" />
                  <span>{formatDateTime(now.toISOString())}</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-[#223150] bg-[#132341] px-4 py-3 text-sm text-slate-300">
                  <SettingsIcon className="h-4 w-4 text-[#f4c84c]" />
                  <span>{getAssignmentLabel(actor.assignment ?? "Administrasi")}</span>
                </div>
              </div>
            </div>

            {children}
          </main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dbe4f0] bg-[#0f2f72] px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-3 text-white lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {mobilePrimary.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium",
                  active ? "bg-white/12 text-[#f3c34b]" : "text-[#dbe7ff]/80",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium text-[#dbe7ff]/80"
          >
            <UsersIcon className="h-5 w-5" />
            <span>Menu</span>
          </button>
        </div>
      </nav>

      {notificationsOpen ? (
        <>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            className="fixed inset-0 z-40 bg-slate-950/25"
            onClick={() => setNotificationsOpen(false)}
          />
          <div className="fixed right-4 top-24 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-[28px] border border-[#223150] bg-[#0f1b33] p-4 shadow-[0_30px_70px_rgba(2,8,23,0.42)] lg:right-8">
            <div className="flex items-center justify-between gap-3 border-b border-[#223150] pb-3">
              <div>
                <p className="text-sm font-semibold text-[#dbe7ff]">Notifikasi</p>
                <p className="text-xs text-slate-400">
                  Aksi yang sedang menunggu konfirmasi.
                </p>
              </div>
              <Badge tone={notifications.length ? "amber" : "green"}>
                {notifications.length ? `${notifications.length} Baru` : "Aman"}
              </Badge>
            </div>

            <div className="mt-4 max-h-[min(70vh,32rem)] space-y-3 overflow-y-auto pr-1">
              {notifications.length ? (
                notifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      router.push(item.href);
                    }}
                    className="w-full rounded-[22px] border border-[#223150] bg-[#132341] p-4 text-left transition hover:border-[#2d4d82] hover:bg-[#16294a]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#dbe7ff]">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {item.description}
                        </p>
                      </div>
                      <Badge tone={item.tone}>{item.tone === "blue" ? "Ruangan" : "Pintu 3"}</Badge>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[#223150] bg-[#132341] p-4 text-sm text-slate-400">
                  Belum ada notifikasi yang membutuhkan tindak lanjut.
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}

      {accountMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Tutup menu akun"
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setAccountMenuOpen(false)}
          />
          <div className="fixed right-4 top-24 z-50 hidden w-[340px] rounded-[28px] border border-[#223150] bg-[#0f1b33] p-4 shadow-[0_30px_70px_rgba(2,8,23,0.42)] sm:block lg:right-8">
            <div className="flex items-center gap-4 rounded-[24px] border border-[#223150] bg-[#132341] p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16294a] text-[#f4c84c]">
                <UserCircleIcon className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#dbe7ff]">{actor.name}</p>
                <p className="truncate text-xs text-slate-400">{actor.email}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="blue">{getRoleLabel(actor.role, actor.assignment)}</Badge>
                  <Badge tone="default">{getAssignmentLabel(actor.assignment ?? "Administrasi")}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen(false);
                  router.push("/dashboard");
                }}
                className="flex w-full items-center justify-between rounded-[22px] border border-[#223150] bg-[#132341] px-4 py-3 text-left text-sm font-medium text-[#dbe7ff] transition hover:border-[#33598f] hover:bg-[#16294a]"
              >
                <span>Dashboard Utama</span>
                <ArrowRightIcon className="h-4 w-4 text-slate-400" />
              </button>

              {actor.role === "Superadmin" ? (
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    router.push("/users");
                  }}
                  className="flex w-full items-center justify-between rounded-[22px] border border-[#223150] bg-[#132341] px-4 py-3 text-left text-sm font-medium text-[#dbe7ff] transition hover:border-[#33598f] hover:bg-[#16294a]"
                >
                  <span>Kelola Akun Pengguna</span>
                  <ArrowRightIcon className="h-4 w-4 text-slate-400" />
                </button>
              ) : null}

              {(actor.role === "Superadmin" || actor.role === "Admin") ? (
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    router.push("/admin");
                  }}
                  className="flex w-full items-center justify-between rounded-[22px] border border-[#223150] bg-[#132341] px-4 py-3 text-left text-sm font-medium text-[#dbe7ff] transition hover:border-[#33598f] hover:bg-[#16294a]"
                >
                  <span>Master Data WBP</span>
                  <ArrowRightIcon className="h-4 w-4 text-slate-400" />
                </button>
              ) : null}
            </div>

            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => {
                setAccountMenuOpen(false);
                void signOut();
              }}
            >
              <LogoutIcon className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </>
      ) : null}

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Tutup menu"
            className="fixed inset-0 z-40 bg-slate-950/35 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-[32px] border border-[#223150] bg-[#0f1b33] p-5 shadow-[0_-24px_60px_rgba(2,8,23,0.42)] lg:hidden">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-200" />
            <div className="flex items-center gap-3 rounded-[24px] bg-[#132341] p-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#16294a] text-[#f4c84c]">
                <UserCircleIcon className="h-8 w-8" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#dbe7ff]">{actor.name}</p>
                <p className="truncate text-xs text-slate-400">{actor.email}</p>
                <div className="mt-2">
                  <Badge tone="blue">{getRoleLabel(actor.role, actor.assignment)}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {allowedNavigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3",
                      active
                        ? "border-[#2d4d82] bg-[#16294a] text-[#dbe7ff]"
                        : "border-[#223150] bg-[#132341] text-slate-200",
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#16294a] text-[#f4c84c]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <ArrowRightIcon className="h-4 w-4 text-slate-400" />
                  </Link>
                );
              })}
            </div>

            <Button className="mt-5 w-full" variant="outline" onClick={() => void signOut()}>
              <LogoutIcon className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function ShellContent({ children }: { children: ReactNode }) {
  const { isLoading } = useAppState();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <ShellFrame>{children}</ShellFrame>;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <ShellContent>{children}</ShellContent>
    </AppStateProvider>
  );
}
