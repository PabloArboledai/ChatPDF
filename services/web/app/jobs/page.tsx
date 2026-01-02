import Link from "next/link";

import { serverApiBaseUrl } from "@/lib/api";

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

async function fetchJobs(): Promise<Job[]> {
  const base = serverApiBaseUrl();
  const res = await fetch(`${base}/jobs`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { items: Job[] };
  return data.items || [];
}

export default async function JobsPage() {
  const jobs = await fetchJobs();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-black/60 dark:text-white/60">
            Lista de trabajos recientes (refresca la página para ver estados).
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10"
        >
          Nuevo
        </Link>
      </div>

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
                <td className="px-4 py-3">{j.id}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs text-black/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80">
                    {jobTypeLabel(j.job_type)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusBadgeClass(
                      j.status,
                    )}`}
                  >
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
                    className="inline-flex h-9 items-center justify-center rounded-full border border-black/10 px-3 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    href={`/jobs/${j.id}`}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-black/60 dark:text-white/60" colSpan={5}>
                  No hay jobs todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
