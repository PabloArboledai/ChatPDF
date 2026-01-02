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
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
            Jobs
          </h1>
          <p className="mt-1 text-base text-black/70 dark:text-white/70">
            Lista de trabajos recientes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/jobs"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            <span>🔄</span>
            <span>Actualizar</span>
          </a>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm text-white shadow-sm transition-all hover:shadow-md dark:from-blue-500 dark:to-purple-500"
          >
            <span>➕</span>
            <span>Nuevo job</span>
          </Link>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-gradient-to-br from-blue-50 to-purple-50 p-8 text-center shadow-sm dark:border-white/10 dark:from-blue-950/30 dark:to-purple-950/30">
          <div className="mx-auto mb-4 text-6xl">📭</div>
          <h2 className="text-xl font-semibold tracking-tight">Aún no hay jobs</h2>
          <p className="mx-auto mt-3 max-w-md text-base text-black/70 dark:text-white/70">
            Crea tu primer job subiendo un PDF. Aquí verás el progreso y podrás descargar el resultado.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 font-semibold text-white shadow-md transition-all hover:shadow-lg dark:from-blue-500 dark:to-purple-500"
            >
              <span>➕</span>
              <span>Crear nuevo job</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/10 shadow-sm dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-left font-semibold">Archivo</th>
                  <th className="px-4 py-3 text-left font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr
                    key={j.id}
                    className="border-t border-black/10 transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-mono font-semibold">#{j.id}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium dark:bg-white/5">
                        {j.job_type === "export_all" ? "📦" : j.job_type === "markdown" ? "📝" : "🔍"}
                        <span>{j.job_type}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass(
                          j.status,
                        )}`}
                      >
                        {statusLabel(j.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="max-w-[200px] truncate" title={j.filename}>{j.filename}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link className="font-medium text-blue-600 underline transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300" href={`/jobs/${j.id}`}>
                        Ver detalles →
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
