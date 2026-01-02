import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Convierte tu PDF en contenido útil
        </h1>
        <p className="max-w-2xl text-sm text-black/60 dark:text-white/60">
          Sube un PDF, selecciona el tipo de procesamiento y deja que el sistema trabaje en segundo plano.
          Cuando termine, podrás descargar un ZIP con los resultados.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <div className="text-sm font-medium">1) Sube</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">
            PDF de tu clase, libro o manual.
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <div className="text-sm font-medium">2) Procesa</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">
            Exportación multi-formato, Markdown o clustering.
          </div>
        </div>
        <div className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <div className="text-sm font-medium">3) Descarga</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">
            Resultados listos en un ZIP.
          </div>
        </div>
      </div>

      <UploadForm />
    </div>
  );
}
