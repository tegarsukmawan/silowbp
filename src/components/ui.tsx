"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}) {
  const variantClass = {
    default:
      "bg-primary text-primary-foreground shadow-[0_12px_30px_rgba(16,45,112,0.18)] hover:bg-primary/95",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-[#1a2742]",
    outline:
      "border border-border bg-[#0f1b33] text-foreground hover:bg-[#16243f]",
    ghost: "bg-transparent text-foreground hover:bg-[#17253f]",
    destructive:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  }[variant];

  const sizeClass = {
    default: "h-11 px-4 py-2",
    sm: "h-9 rounded-lg px-3",
    lg: "h-12 rounded-2xl px-6 text-sm",
    icon: "h-11 w-11 rounded-2xl p-0",
  }[size];

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantClass,
        sizeClass,
        className,
      )}
      {...props}
    />
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border bg-[#0d1930] px-4 py-2 text-sm text-foreground shadow-sm transition-colors",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border bg-[#0d1930] px-4 py-2 text-sm text-foreground shadow-sm transition-colors",
        "[&_option]:bg-[#0d1930] [&_option]:text-slate-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "green" | "amber" | "red" | "blue";
}) {
  const toneClass = {
    default: "bg-slate-800 text-slate-200",
    green: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    red: "bg-rose-500/15 text-rose-300",
    blue: "bg-sky-500/15 text-sky-300",
  }[tone];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.08em]",
        toneClass,
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-border bg-card text-card-foreground shadow-[0_22px_50px_rgba(2,8,23,0.32)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("space-y-2 p-6", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-heading text-xl font-semibold tracking-tight", className)} {...props} />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />;
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn("[&_tr:last-child]:border-0 [&_tr]:border-b [&_tr]:border-border/80", className)}
      {...props}
    />
  );
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-[#16294a]/55", className)} {...props} />;
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("p-4 align-middle", className)} {...props} />;
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-2xl rounded-[32px] border border-border bg-[#0f1b33] shadow-[0_30px_70px_rgba(2,8,23,0.42)]">
        <div className="flex items-start justify-between gap-4 p-6">
          <div className="space-y-2">
            <h2 className="font-heading text-2xl font-semibold text-slate-50">{title}</h2>
            {description ? <p className="text-sm text-slate-400">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            x
          </Button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
