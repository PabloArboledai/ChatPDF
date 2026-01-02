import Link from "next/link";

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

async function fetchJob(id: string): Promise<Job | null> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
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
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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
            <dd className="text-sm">{job.job_type}</dd>
          </div>
          <div>
            <dt className="text-xs text-black/60 dark:text-white/60">Estado</dt>
            <dd className="text-sm">{job.status}</dd>
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

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            className={`inline-flex h-11 items-center justify-center rounded-full px-5 text-sm ${
              canDownload
                ? "bg-foreground text-background"
                : "cursor-not-allowed bg-black/10 text-black/50 dark:bg-white/10 dark:text-white/50"
            }`}
            href={canDownload ? `${base}/jobs/${job.id}/download` : "#"}
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
