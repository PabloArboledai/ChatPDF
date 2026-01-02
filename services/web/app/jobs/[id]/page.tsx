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

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Job #{job.id}</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Refresca la página para ver cambios.
          </p>
        </div>
        <Link href="/jobs" className="underline">
          Jobs
        </Link>
      </div>

      <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
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
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusBadgeClass(
                  job.status,
                )}`}
              >
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
            El ZIP incluye todos los outputs del job.
          </span>
        </div>
      </div>
    </div>
  );
}
