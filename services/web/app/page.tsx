import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Extrae y organiza temas de PDFs</h1>
        <p className="text-base text-black/70 dark:text-white/70">
          Sube un PDF de un libro o documento y obtén sus temas organizados en múltiples formatos:
          Markdown, HTML, DOCX, PDF y más.
        </p>
      </div>

      {/* Quick Guide */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-50 p-4 dark:bg-blue-950">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-100">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Guía rápida
        </h3>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-blue-800 dark:text-blue-200">
          <li>Arrastra tu PDF o haz clic para seleccionarlo</li>
          <li>Elige el tipo de procesamiento (recomendado: Exportación multi-formato)</li>
          <li>Ajusta la configuración si es necesario (los valores por defecto funcionan bien)</li>
          <li>Haz clic en "Crear job" y ve a la página de Jobs para seguir el progreso</li>
          <li>Una vez completado, descarga el ZIP con todos los resultados</li>
        </ol>
      </div>

      <UploadForm />

      {/* Features */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mb-1 font-semibold">Multi-formato</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            Exporta a MD, HTML, DOCX, PDF, TXT y JSON en una sola ejecución
          </p>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="mb-1 font-semibold">Detección automática</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            Identifica temas por encabezados o tabla de contenido automáticamente
          </p>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/10">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
            <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mb-1 font-semibold">Con imágenes</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            Extrae y organiza imágenes automáticamente en cada tema
          </p>
        </div>
      </div>
    </div>
  );
}
