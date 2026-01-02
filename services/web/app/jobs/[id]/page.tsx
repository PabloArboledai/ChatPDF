"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { clientApi } from "@/lib/api";

type Job = {
  id: number;
  job_type: string;
  status: string;
  filename: string;
  output_dir: string;
  zip_path: string;
  log_path: string;
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
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${colorClass}`}>
      {status === "running" && (
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600 dark:bg-blue-400"></span>
      )}
      {status === "succeeded" && "✓"}
      {status === "failed" && "✗"}
      {status}
    </span>
  );
}

function ProgressBar({ status }: { status: string }) {
  const progress: Record<string, number> = {
    pending: 10,
    running: 50,
    succeeded: 100,
    failed: 100,
  };

  const percentage = progress[status] || 0;
  const colorClass =
    status === "succeeded"
      ? "bg-green-500"
      : status === "failed"
        ? "bg-red-500"
        : status === "running"
          ? "bg-blue-500"
          : "bg-gray-300";

  return (
    <div className="w-full rounded-full bg-black/10 dark:bg-white/10">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${colorClass} ${status === "running" ? "animate-pulse" : ""}`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}

export default function JobDetailPageClient({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJob = async () => {
    try {
      const res = await fetch(clientApi(`/jobs/${params.id}`), { cache: "no-store" });
      if (!res.ok) {
        setJob(null);
        return;
      }
      const data = (await res.json()) as Job;
      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 3000); // Auto-refresh every 3 seconds
    return () => clearInterval(interval);
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-black/10 border-t-black/60 dark:border-white/10 dark:border-t-white/60"></div>
          <p className="text-sm text-black/60 dark:text-white/60">Cargando job...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Job no encontrado</h1>
        <Link href="/jobs" className="text-blue-600 hover:underline dark:text-blue-400">
          ← Volver a Jobs
        </Link>
      </div>
    );
  }

  const canDownload = job.status === "succeeded";

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job #{job.id}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Actualización automática cada 3s
          </p>
        </div>
        <Link href="/jobs" className="text-blue-600 hover:underline dark:text-blue-400">
          ← Jobs
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Progreso</span>
          <StatusBadge status={job.status} />
        </div>
        <ProgressBar status={job.status} />
      </div>

      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <h2 className="mb-4 text-lg font-semibold">Detalles del Job</h2>
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-black/60 dark:text-white/60">Tipo de procesamiento</dt>
            <dd className="mt-1 text-sm">
              <span className="rounded bg-black/5 px-2 py-1 dark:bg-white/5">
                {job.job_type}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-black/60 dark:text-white/60">Estado actual</dt>
            <dd className="mt-1">
              <StatusBadge status={job.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-black/60 dark:text-white/60">Archivo procesado</dt>
            <dd className="mt-1 text-sm font-mono">{job.filename}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-black/60 dark:text-white/60">Directorio de salida</dt>
            <dd className="mt-1 text-xs font-mono text-black/60 dark:text-white/60">
              {job.output_dir || "—"}
            </dd>
          </div>
        </dl>

        {job.error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
              <span>⚠️</span> Error
            </div>
            <pre className="mt-2 overflow-auto text-xs text-red-600 dark:text-red-400">
              {job.error}
            </pre>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-all ${
              canDownload
                ? "bg-foreground text-background hover:opacity-90"
                : "cursor-not-allowed bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50"
            }`}
            href={canDownload ? clientApi(`/jobs/${job.id}/download`) : "#"}
            onClick={(e) => !canDownload && e.preventDefault()}
            aria-disabled={!canDownload}
            aria-label={canDownload ? `Descargar ZIP del job ${job.id}` : "Descarga no disponible aún"}
          >
            {canDownload ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar ZIP
              </>
            ) : (
              "Esperando finalización..."
            )}
          </a>
          {canDownload && (
            <span className="text-xs text-black/60 dark:text-white/60">
              El ZIP incluye todos los outputs del job.
            </span>
          )}
        </div>
      </div>

      {job.status === "running" && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-50 p-4 dark:bg-blue-950">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400"></div>
            <span>Procesando... Esta página se actualiza automáticamente.</span>
          </div>
        </div>
      )}
    </div>
  );
}
