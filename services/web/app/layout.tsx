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
  title: "ChatPDF",
  description: "Extracción y exportación por temas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-dvh flex-col bg-background text-foreground">
          <header className="sticky top-0 z-50 border-b border-black/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-white/10">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <a href="/" className="flex items-center gap-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-lg font-semibold tracking-tight">ChatPDF</span>
              </a>
              <nav className="flex items-center gap-6 text-sm">
                <a className="transition-colors hover:text-blue-600 dark:hover:text-blue-400" href="/">
                  Inicio
                </a>
                <a className="transition-colors hover:text-blue-600 dark:hover:text-blue-400" href="/jobs">
                  Jobs
                </a>
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-black/10 py-6 dark:border-white/10">
            <div className="mx-auto max-w-5xl px-4 text-center text-sm text-black/60 dark:text-white/60">
              <p>ChatPDF - Extracción y exportación de temas desde PDFs</p>
              <p className="mt-1">Procesamiento en background con múltiples formatos de salida</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
