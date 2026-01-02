"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { clientApi } from "@/lib/api";

type Job = {
  id: number;
  created_at: string;
  updated_at: string;
  job_type: string;
  status: string;
  filename: string;
  error: string;
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    succeeded: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const colorClass = colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
}

export default function JobsPageClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await fetch(clientApi("/jobs"), { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Job[] };
      setJobs(data.items || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Lista de trabajos recientes (actualización automática cada 5s).
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          Nuevo
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-black/10 p-12 dark:border-white/10">
          <div className="text-center">
            <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-black/10 border-t-black/60 dark:border-white/10 dark:border-t-white/60"></div>
            <p className="text-sm text-black/60 dark:text-white/60">Cargando jobs...</p>
          </div>
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
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-4 py-3">#{j.id}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-black/5 px-2 py-1 text-xs dark:bg-white/5">
                      {j.job_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={j.status} />
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={j.filename}>
                    {j.filename}
                  </td>
                  <td className="px-4 py-3">
                    <Link className="text-blue-600 hover:underline dark:text-blue-400" href={`/jobs/${j.id}`}>
                      Ver detalles →
                    </Link>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-black/60 dark:text-white/60" colSpan={5}>
                    <p className="mb-2">No hay jobs todavía.</p>
                    <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                      Crear tu primer job →
                    </Link>
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
