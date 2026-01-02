import Link from "next/link";

import { clientApi, serverApiBaseUrl } from "@/lib/api";
import AutoRefresh from "@/components/AutoRefresh";
import SuccessAnimation from "@/components/SuccessAnimation";

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
      return "border-black/10 bg-black/5 text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80";
    case "failed":
      return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300";
    case "running":
      return "border-black/10 bg-black/5 text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80";
    case "queued":
      return "border-black/10 bg-black/5 text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80";
    default:
      return "border-black/10 bg-black/5 text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80";
  }
}

async function fetchJob(id: string): Promise<Job | null> {
  const base = serverApiBaseUrl();
  const res = await fetch(`${base}/jobs/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Job;
}

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const job = await fetchJob(params.id);

  if (!job) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Job no encontrado</h1>
        <Link href="/jobs" className="underline">
          Volver
        </Link>
      </div>
    );
  }

  const canDownload = job.status === "succeeded";
  const isProcessing = job.status === "running" || job.status === "queued";

  return (
    <div className="space-y-4">
      {/* Auto-refresh while processing */}
      {isProcessing && <AutoRefresh interval={3000} />}

      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job #{job.id}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            {isProcessing 
              ? "Actualizando automáticamente..." 
              : "Job finalizado."}
          </p>
        </div>
        <Link href="/jobs" className="text-sm underline hover:text-black/80 dark:hover:text-white/80">
          ← Ver todos los jobs
        </Link>
      </div>

      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        {/* Success Celebration */}
        {canDownload && (
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-green-500/30 bg-green-500/5 p-4">
            <SuccessAnimation />
            <div>
              <h3 className="font-medium text-green-700 dark:text-green-300">
                ¡Procesamiento completado!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Tu archivo está listo para descargar.
              </p>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
            <div className="flex h-16 w-16 items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
            </div>
            <div>
              <h3 className="font-medium text-blue-700 dark:text-blue-300">
                Procesando archivo...
              </h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {job.status === "queued" ? "En cola, esperando para iniciar." : "Ejecutando el job. Esto puede tomar unos minutos."}
              </p>
            </div>
          </div>
        )}

        <dl className="grid gap-3 md:grid-cols-2">
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Tipo</dt>
            <dd className="text-sm">
              <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
                {jobTypeLabel(job.job_type)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Estado</dt>
            <dd className="text-sm">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${statusBadgeClass(
                  job.status,
                )}`}
              >
                {isProcessing && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"></span>
                )}
                {job.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Archivo</dt>
            <dd className="text-sm text-black/80 dark:text-white/80">{job.filename}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Error</dt>
            <dd className="text-sm text-black/80 dark:text-white/80">{job.error || "—"}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-all ${
              canDownload
                ? "bg-foreground text-background shadow-lg hover:scale-105 hover:shadow-xl"
                : "cursor-not-allowed bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50"
            }`}
            href={canDownload ? clientApi(`/jobs/${job.id}/download`) : "#"}
            aria-disabled={!canDownload}
          >
            {canDownload && (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            )}
            {canDownload ? "Descargar ZIP" : "Procesando..."}
          </a>
          <span className="text-xs text-black/60 dark:text-white/60">
            {canDownload 
              ? "El ZIP incluye todos los outputs del job." 
              : "El botón se habilitará cuando el job termine."}
          </span>
        </div>
      </div>
    </div>
  );
}
