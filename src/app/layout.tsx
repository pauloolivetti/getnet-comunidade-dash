import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Comunidade Global · Painel de Gestão",
  description: "Painel de gestão da comunidade global",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
