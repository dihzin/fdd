import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Sans } from "next/font/google";

import { QueryProvider } from "@/components/providers/query-provider";

import "./globals.css";

const headingFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Workspace FDD SAP",
  description: "Aplicacao interna para engenharia de solucoes SAP e geracao estruturada de FDD.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} font-[family-name:var(--font-body)]`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
