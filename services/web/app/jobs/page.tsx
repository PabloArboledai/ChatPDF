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
            Lista de trabajos recientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/jobs"
            className="rounded-full border border-black/10 px-4 py-2 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            Actualizar
          </a>
          <Link
            href="/"
            className="rounded-full bg-foreground px-4 py-2 text-sm text-background hover:opacity-90"
          >
            Nuevo job
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
          <h2 className="text-base font-semibold tracking-tight">Aún no hay jobs</h2>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
            Crea tu primer job subiendo un PDF. Aquí verás el progreso y podrás descargar el resultado.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm text-background hover:opacity-90"
            >
              Crear nuevo job
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
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
                  <tr
                    key={j.id}
                    className="border-t border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3">{j.id}</td>
                    <td className="px-4 py-3">{j.job_type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${statusClass(
                          j.status,
                        )}`}
                      >
                        {statusLabel(j.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{j.filename}</td>
                    <td className="px-4 py-3">
                      <Link className="underline" href={`/jobs/${j.id}`}>
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
