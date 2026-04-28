import type { Metadata } from "next";
import { Barlow, IBM_Plex_Sans } from "next/font/google";

import { AppShell } from "@/components/app-shell";

import "./globals.css";

const headingFont = Barlow({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Silo WBP",
  description: "Frontend monitoring lokasi WBP untuk operasional Lapas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${headingFont.variable} ${bodyFont.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
