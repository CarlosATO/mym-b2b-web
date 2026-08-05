import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MYM Distribuidora — Portal B2B Mayorista",
  description: "Portal de compras mayoristas exclusivo para clientes comerciales registrados de MYM Distribuidora.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
