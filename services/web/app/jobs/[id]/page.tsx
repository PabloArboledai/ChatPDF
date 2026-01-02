import Link from "next/link";

import { clientApi, serverApiBaseUrl } from "@/lib/api";

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

function statusLabel(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "succeeded") return "✅ Completado";
  if (s === "running") return "⏳ En progreso";
  if (s === "queued") return "⏸️ En cola";
  if (s === "failed") return "❌ Falló";
  return status || "—";
}

function statusClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "succeeded") return "border-green-500/50 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400";
  if (s === "running") return "border-blue-500/50 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
  if (s === "queued") return "border-yellow-500/50 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400";
  if (s === "failed") return "border-red-500/50 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400";
  return "border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5";
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
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 text-6xl">❓</div>
          <h1 className="text-2xl font-bold tracking-tight">Job no encontrado</h1>
          <p className="mt-2 text-base text-black/70 dark:text-white/70">
            El job solicitado no existe o no está disponible.
          </p>
          <div className="mt-6">
            <Link href="/jobs" className="inline-flex items-center gap-2 font-medium text-blue-600 underline transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              ← Volver a jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canDownload = job.status === "succeeded";
  const isFailed = job.status === "failed";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            Job #{job.id}
          </h1>
          <p className="mt-1 text-base text-black/70 dark:text-white/70">
            {job.status === "running" || job.status === "queued" 
              ? "Refresca para ver cambios en tiempo real." 
              : "Detalles del trabajo completado."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/jobs/${job.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </a>
          <Link href="/jobs" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm text-white shadow-sm transition-all hover:shadow-md dark:from-blue-500 dark:to-purple-500">
            <span>←</span>
            <span>Volver</span>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white/50 p-6 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-black/70 dark:text-white/70">
              <span>📋</span>
              <span>Tipo</span>
            </dt>
            <dd className="mt-1 flex items-center gap-2 text-base font-medium">
              <span>{job.job_type === "export_all" ? "📦" : job.job_type === "markdown" ? "📝" : "🔍"}</span>
              <span>{job.job_type}</span>
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-black/70 dark:text-white/70">
              <span>🎯</span>
              <span>Estado</span>
            </dt>
            <dd className="mt-1">
              <span className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium ${statusClass(job.status)}`}>
                {statusLabel(job.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-black/70 dark:text-white/70">
              <span>📄</span>
              <span>Archivo</span>
            </dt>
            <dd className="mt-1 text-base">{job.filename}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-black/70 dark:text-white/70">
              <span>⚠️</span>
              <span>Error</span>
            </dt>
            <dd className="mt-1 text-base">{job.error || "—"}</dd>
          </div>
        </dl>

        {isFailed && job.error && (
          <div className="mt-6 rounded-xl border border-red-500/50 bg-red-50 px-4 py-3 shadow-sm dark:bg-red-950/30">
            <div className="flex items-start gap-2">
              <span className="text-xl">❌</span>
              <div className="flex-1">
                <div className="font-semibold text-red-700 dark:text-red-400">El job falló</div>
                <div className="mt-1 text-sm text-red-600 dark:text-red-300">{job.error}</div>
              </div>
            </div>
          </div>
        )}

        {job.status === "running" && (
          <div className="mt-6 rounded-xl border border-blue-500/50 bg-blue-50 px-4 py-3 shadow-sm dark:bg-blue-950/30">
            <div className="flex items-start gap-2">
              <span className="animate-spin text-xl">⏳</span>
              <div className="flex-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400">Procesando...</div>
                <div className="mt-1 text-sm text-blue-600 dark:text-blue-300">
                  Tu archivo está siendo procesado. Esto puede tomar varios minutos dependiendo del tamaño.
                </div>
              </div>
            </div>
          </div>
        )}

        {job.status === "queued" && (
          <div className="mt-6 rounded-xl border border-yellow-500/50 bg-yellow-50 px-4 py-3 shadow-sm dark:bg-yellow-950/30">
            <div className="flex items-start gap-2">
              <span className="text-xl">⏸️</span>
              <div className="flex-1">
                <div className="font-semibold text-yellow-700 dark:text-yellow-400">En cola</div>
                <div className="mt-1 text-sm text-yellow-600 dark:text-yellow-300">
                  Tu job está esperando a ser procesado. Comenzará pronto.
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-semibold shadow-sm transition-all ${
              canDownload
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-md dark:from-blue-500 dark:to-purple-500"
                : "cursor-not-allowed bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50"
            }`}
            href={canDownload ? clientApi(`/jobs/${job.id}/download`) : "#"}
          >
            <span>📦</span>
            <span>Descargar ZIP</span>
          </a>
          <span className="text-sm text-black/60 dark:text-white/60">
            {canDownload
              ? "El ZIP incluye todos los outputs del job."
              : "Disponible cuando el job termine."}
          </span>
        </div>
      </div>
    </div>
  );
}
