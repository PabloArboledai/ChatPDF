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
          <header className="border-b border-black/10 dark:border-white/10">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
              <Link href="/" className="group inline-flex flex-col leading-tight">
                <span className="text-lg font-semibold tracking-tight">
                  ChatPDF
                </span>
                <span className="text-xs text-black/60 group-hover:text-black/80 dark:text-white/60 dark:group-hover:text-white/80">
                  Extrae y exporta por temas
                </span>
              </Link>

              <nav className="flex items-center gap-2 text-sm">
                <Link
                  className="rounded-full border border-black/10 px-4 py-2 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                  href="/"
                >
                  Nuevo job
                </Link>
                <Link
                  className="rounded-full bg-foreground px-4 py-2 text-background hover:opacity-90"
                  href="/jobs"
                >
                  Jobs
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
