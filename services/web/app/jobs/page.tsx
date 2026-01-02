import Link from "next/link";

type Job = {
  id: number;
  created_at: string;
  updated_at: string;
  job_type: string;
  status: string;
  filename: string;
  error: string;
};

async function fetchJobs(): Promise<Job[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
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
                <td className="px-4 py-3">{j.job_type}</td>
                <td className="px-4 py-3">{j.status}</td>
                <td className="px-4 py-3">{j.filename}</td>
                <td className="px-4 py-3">
                  <Link className="underline" href={`/jobs/${j.id}`}>
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
