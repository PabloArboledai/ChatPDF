import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
          Convierte tu PDF en contenido útil
        </h1>
        <p className="max-w-2xl text-base text-black/70 dark:text-white/70">
          Sube un PDF, selecciona el tipo de procesamiento y deja que el sistema trabaje en segundo plano.
          Cuando termine, podrás descargar un ZIP con los resultados.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-50 to-transparent p-6 shadow-sm transition-all hover:shadow-md dark:from-blue-950/30 dark:to-transparent">
          <div className="absolute right-4 top-4 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">
            📄
          </div>
          <div className="relative">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">1) Sube</div>
            <div className="mt-2 text-sm text-black/70 dark:text-white/70">
              PDF de tu clase, libro o manual.
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-50 to-transparent p-6 shadow-sm transition-all hover:shadow-md dark:from-purple-950/30 dark:to-transparent">
          <div className="absolute right-4 top-4 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">
            ⚙️
          </div>
          <div className="relative">
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">2) Procesa</div>
            <div className="mt-2 text-sm text-black/70 dark:text-white/70">
              Exportación multi-formato, Markdown o clustering.
            </div>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-50 to-transparent p-6 shadow-sm transition-all hover:shadow-md dark:from-green-950/30 dark:to-transparent">
          <div className="absolute right-4 top-4 text-4xl opacity-20 group-hover:opacity-30 transition-opacity">
            📦
          </div>
          <div className="relative">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">3) Descarga</div>
            <div className="mt-2 text-sm text-black/70 dark:text-white/70">
              Resultados listos en un ZIP.
            </div>
          </div>
        </div>
      </div>

      <UploadForm />
    </div>
  );
}
