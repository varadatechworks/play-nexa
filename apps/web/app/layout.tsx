import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { arenaConfig } from "@/lib/arena-config";

export const metadata: Metadata = {
  title: { default: `${arenaConfig.name} | ${arenaConfig.city}`, template: `%s | ${arenaConfig.name}` },
  description: `Sports, fitness, coaching and community at ${arenaConfig.name} in ${arenaConfig.city}.`,
  other: {
    "codex-preview": "development",
  },
  icons: arenaConfig.logoUrl ? { icon: arenaConfig.logoUrl, shortcut: arenaConfig.logoUrl } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ "--olive": arenaConfig.primaryColor, "--saffron": arenaConfig.accentColor, "--gold": arenaConfig.accentColor } as React.CSSProperties}><AppProvider>{children}</AppProvider></body>
    </html>
  );
}
