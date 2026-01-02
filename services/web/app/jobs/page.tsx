"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { clientApi } from "@/lib/api";
import LoadingSpinner from "@/components/LoadingSpinner";

type Job = {
  id: number;
  created_at: string;
  updated_at: string;
  job_type: string;
  status: string;
  filename: string;
  error: string;
};

function jobTypeLabel(jobType: string): string {
  switch (jobType) {
    case "export_all":
      return "Exportación";
    case "markdown":
      return "Markdown";
    case "clustering":
      return "Clustering";
    default:
      return jobType;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "succeeded":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300";
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
    case "running":
      return "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300";
    case "queued":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
    default:
      return "border-black/10 bg-black/5 text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80";
  }
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch(clientApi("/jobs"), { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Error al cargar los jobs");
      }
      const data = (await res.json()) as { items: Job[] };
      setJobs(data.items || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const hasActiveJobs = jobs.some(j => j.status === "running" || j.status === "queued");

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {hasActiveJobs 
              ? "Actualizando automáticamente..." 
              : "Lista de trabajos recientes."}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-black/10 px-4 text-sm transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo job
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-black/10 p-12 dark:border-white/10">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left font-medium">ID</th>
                <th className="px-4 py-3 text-left font-medium">Tipo</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-left font-medium">Archivo</th>
                <th className="px-4 py-3 text-left font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const isProcessing = j.status === "running" || j.status === "queued";
                return (
                  <tr key={j.id} className="border-t border-black/10 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <span className="font-medium">#{j.id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
                        {jobTypeLabel(j.job_type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${statusBadgeClass(
                          j.status,
                        )}`}
                      >
                        {isProcessing && (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"></span>
                        )}
                        {j.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[28ch] truncate text-black/80 dark:text-white/80">
                        {j.filename}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-black/10 px-3 text-xs transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                        href={`/jobs/${j.id}`}
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {jobs.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-black/60 dark:text-white/60" colSpan={5}>
                    <div className="flex flex-col items-center gap-3">
                      <svg className="h-12 w-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No hay jobs todavía. ¡Crea tu primer job!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
