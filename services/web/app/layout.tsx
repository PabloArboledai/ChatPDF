import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
        <div className="min-h-dvh bg-background text-foreground">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
          >
            Saltar al contenido
          </a>
          <header className="border-b border-black/10 bg-white/80 backdrop-blur-sm dark:border-white/10 dark:bg-black/80">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="group inline-flex items-center gap-3 leading-tight">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-xl shadow-sm transition-transform group-hover:scale-105">
                  📄
                </div>
                <div className="inline-flex flex-col">
                  <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                    ChatPDF
                  </span>
                  <span className="text-xs text-black/60 group-hover:text-black/80 dark:text-white/60 dark:group-hover:text-white/80">
                    Extrae y exporta por temas
                  </span>
                </div>
              </Link>

              <nav className="flex items-center gap-2 text-sm">
                <Link
                  className="rounded-full border border-black/10 px-4 py-2 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                  href="/"
                >
                  ➕ Nuevo job
                </Link>
                <Link
                  className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-sm transition-all hover:shadow-md dark:from-blue-500 dark:to-purple-500"
                  href="/jobs"
                >
                  📋 Jobs
                </Link>
              </nav>
            </div>
          </header>
          <main id="main" className="mx-auto max-w-5xl px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
