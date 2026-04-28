"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
};

function IconBase({
  className,
  children,
  viewBox = "0 0 24 24",
}: IconProps & {
  children: ReactNode;
  viewBox?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5", className)}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function GovernmentSeal({ className = "" }: IconProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full bg-[#0b2c6b] text-[#f3c34b]",
        className,
      )}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
        <circle cx="50" cy="50" r="48" fill="#0b2c6b" stroke="#f3c34b" strokeWidth="3" />
        <path
          d="M27 67c9 8 37 8 46 0"
          stroke="#f3c34b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M36 30c4 6 9 11 14 15 5-4 10-9 14-15"
          stroke="#f3c34b"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M42 49h16l-3 9H45l-3-9Z"
          fill="#f3c34b"
          stroke="#f3c34b"
          strokeWidth="2"
        />
        <path
          d="M20 25c-5 14-4 32 2 45"
          stroke="#f3c34b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M80 25c5 14 4 32-2 45"
          stroke="#f3c34b"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M24 28c-4 14-3 27 1 39"
          stroke="#f3c34b"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M76 28c4 14 3 27-1 39"
          stroke="#f3c34b"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M50 16l2.1 4.4L57 21l-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L43 21l4.9-.6L50 16Z" fill="#f3c34b" stroke="none" />
      </svg>
      <div className="absolute inset-[18%] rounded-full border border-[#f3c34b]/25" />
    </div>
  );
}

export function DashboardIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </IconBase>
  );
}

export function MonitoringIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.5-4.5" />
    </IconBase>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5v5h5" />
      <path d="M20 12a8 8 0 1 1-2.3-5.7L20 8" />
      <path d="M12 8v5l3 2" />
    </IconBase>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15 17H5.5a1 1 0 0 1-.8-1.6l1.2-1.6a3 3 0 0 0 .6-1.8V9a6 6 0 1 1 12 0v3a3 3 0 0 0 .6 1.8l1.2 1.6a1 1 0 0 1-.8 1.6H19" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </IconBase>
  );
}

export function ReportIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 3.5h7l4 4v13a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20.5V5A1.5 1.5 0 0 1 7.5 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </IconBase>
  );
}

export function MasterDataIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="5.5" rx="6.5" ry="2.5" />
      <path d="M5.5 5.5v5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-5" />
      <path d="M5.5 10.5v5c0 1.4 2.9 2.5 6.5 2.5s6.5-1.1 6.5-2.5v-5" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M19.5 15a1 1 0 0 0 .2 1.1l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.7 1.7 0 1 1-3.4 0v-.1a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.7 1.7 0 1 1 0-3.4h.1a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1 1 0 0 0 1.1.2h.1a1 1 0 0 0 .6-.9V4a1.7 1.7 0 1 1 3.4 0v.1a1 1 0 0 0 .6.9h.1a1 1 0 0 0 1.1-.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1 1 0 0 0-.2 1.1v.1a1 1 0 0 0 .9.6H20a1.7 1.7 0 1 1 0 3.4h-.1a1 1 0 0 0-.9.6Z" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M10 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H10" />
      <path d="M14 16l4-4-4-4" />
      <path d="M8 12h10" />
    </IconBase>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1" />
      <circle cx="9.5" cy="8" r="3" />
      <path d="M20 20v-1.2a3 3 0 0 0-2.1-2.9" />
      <path d="M15.5 5.3a3 3 0 0 1 0 5.4" />
    </IconBase>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M7.5 3.5v3" />
      <path d="M16.5 3.5v3" />
      <path d="M3.5 9.5h17" />
    </IconBase>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m6 9 6 6 6-6" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4-4" />
    </IconBase>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" />
    </IconBase>
  );
}

export function TeamIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="8" r="2.5" />
      <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
      <path d="M13 18.5a3.5 3.5 0 0 1 7 0" />
    </IconBase>
  );
}

export function SwapIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M7 7h11" />
      <path d="m14 4 4 3-4 3" />
      <path d="M17 17H6" />
      <path d="m10 14-4 3 4 3" />
    </IconBase>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </IconBase>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3.5 5.5 6v5.5c0 4.1 2.7 7.7 6.5 9 3.8-1.3 6.5-4.9 6.5-9V6L12 3.5Z" />
      <path d="m9.5 12 1.8 1.8 3.5-3.8" />
    </IconBase>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 9a11 11 0 0 1 15 0" />
      <path d="M7.5 12a6.5 6.5 0 0 1 9 0" />
      <path d="M10.5 15a2.4 2.4 0 0 1 3 0" />
      <path d="M12 19h.01" />
    </IconBase>
  );
}

export function BarsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-8" />
    </IconBase>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="5.5" y="10.5" width="13" height="10" rx="2" />
      <path d="M8.5 10.5V8a3.5 3.5 0 1 1 7 0v2.5" />
    </IconBase>
  );
}

export function UserCircleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6.5 18c1.7-2.4 3.6-3.5 5.5-3.5s3.8 1.1 5.5 3.5" />
    </IconBase>
  );
}
