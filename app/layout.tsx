import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CobroPilot | Controla facturas pendientes y cobra antes",
    template: "%s | CobroPilot",
  },
  description:
    "CobroPilot te ayuda a organizar clientes, facturas y recordatorios para controlar cobros pendientes y hacer seguimiento sin perder tiempo.",
  applicationName: "CobroPilot",
  keywords: [
    "cobros pendientes",
    "facturas",
    "recordatorios de cobro",
    "seguimiento de clientes",
    "software de cobros",
    "gestión de facturas",
    "CobroPilot",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-950 flex flex-col">
        {children}
      </body>
    </html>
  );
}