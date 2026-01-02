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
  if (s === "succeeded") return "Completado";
  if (s === "running") return "En progreso";
  if (s === "queued") return "En cola";
  if (s === "failed") return "Falló";
  return status || "—";
}

function statusClass(status: string) {
  const s = (status || "").toLowerCase();
  if (s === "succeeded") return "border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/10";
  if (s === "failed") return "border-red-500/30 bg-red-500/10";
  return "border-black/10 dark:border-white/10";
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
  const isFailed = job.status === "failed";

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job #{job.id}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Si está en progreso, refresca para ver cambios.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/jobs/${job.id}`}
            className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            Actualizar
          </a>
          <Link href="/jobs" className="rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90">
            Volver
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
        <dl className="grid gap-3 md:grid-cols-2">
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Tipo</dt>
            <dd className="text-sm">{job.job_type}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Estado</dt>
            <dd className="text-sm">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusClass(job.status)}`}>
                {statusLabel(job.status)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Archivo</dt>
            <dd className="text-sm">{job.filename}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Error</dt>
            <dd className="text-sm">{job.error || "—"}</dd>
          </div>
        </dl>

        {isFailed && job.error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            <div className="font-medium">El job falló</div>
            <div className="mt-1 text-black/80 dark:text-white/80">{job.error}</div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm ${
              canDownload
                ? "bg-foreground text-background"
                : "cursor-not-allowed bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50"
            }`}
            href={canDownload ? clientApi(`/jobs/${job.id}/download`) : "#"}
          >
            Descargar ZIP
          </a>
          <span className="text-xs text-black/60 dark:text-white/60">
            {canDownload
              ? "El ZIP incluye todos los outputs del job."
              : "Disponible cuando el job termine."}
          </span>
        </div>
      </div>
    </div>
  );
}
