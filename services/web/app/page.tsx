import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Extrae y organiza temas de libros en PDF
        </h1>
        <p className="text-base text-black/60 dark:text-white/60">
          Procesa tus documentos PDF y obtén contenido organizado por temas en múltiples formatos. 
          Perfecto para estudiantes, profesores e investigadores.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-gradient-to-br from-black/5 to-transparent p-4 dark:border-white/10 dark:from-white/5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mb-1 font-medium">Multi-formato</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            Exporta a Markdown, HTML, DOCX, PDF y más formatos
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-gradient-to-br from-black/5 to-transparent p-4 dark:border-white/10 dark:from-white/5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="mb-1 font-medium">Procesamiento rápido</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            Workers en background para procesamiento eficiente
          </p>
        </div>

        <div className="rounded-xl border border-black/10 bg-gradient-to-br from-black/5 to-transparent p-4 dark:border-white/10 dark:from-white/5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-black/10 dark:bg-white/10">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="mb-1 font-medium">Organización inteligente</h3>
          <p className="text-sm text-black/60 dark:text-white/60">
            Detecta automáticamente temas y estructura el contenido
          </p>
        </div>
      </div>

      <UploadForm />
    </div>
  );
}
