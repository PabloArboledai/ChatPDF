import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChatPDF - Extracción de Temas",
  description: "Extrae y organiza temas de libros en PDF. Exporta a múltiples formatos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <div className="min-h-dvh bg-background text-foreground">
          <header className="sticky top-0 z-40 border-b border-black/10 bg-background/80 backdrop-blur-sm dark:border-white/10">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight transition-opacity hover:opacity-80">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                ChatPDF
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link className="transition-opacity hover:opacity-80" href="/">
                  Inicio
                </Link>
                <Link className="transition-opacity hover:opacity-80" href="/jobs">
                  Jobs
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          <footer className="border-t border-black/10 py-6 dark:border-white/10">
            <div className="mx-auto max-w-5xl px-4 text-center text-sm text-black/60 dark:text-white/60">
              <p>ChatPDF - Sistema de extracción de temas de libros PDF</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
