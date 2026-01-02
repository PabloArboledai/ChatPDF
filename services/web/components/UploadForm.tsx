"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { clientApi } from "@/lib/api";
import Toast from "@/components/Toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import Tooltip from "@/components/Tooltip";

type JobType = "export_all" | "markdown" | "clustering";

export default function UploadForm() {
  const router = useRouter();
  const [jobType, setJobType] = useState<JobType>("export_all");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [mode, setMode] = useState("auto");
  const [formats, setFormats] = useState<string[]>(["md", "pdf"]);
  const [topicRegex, setTopicRegex] = useState(
    "^(tema|unidad|cap[ií]tulo)\\s*\\d+\\b",
  );
  const [headingScale, setHeadingScale] = useState(1.6);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState<string>("");
  const [tocMaxPages, setTocMaxPages] = useState(40);

  const [model, setModel] = useState("all-MiniLM-L6-v2");
  const [minChars, setMinChars] = useState(400);
  const [nClusters, setNClusters] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdJobId, setCreatedJobId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const endPageInt = useMemo(() => {
    const s = endPage.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }, [endPage]);

  const nClustersInt = useMemo(() => {
    const s = nClusters.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
  }, [nClusters]);

  async function submit() {
    setError(null);
    setCreatedJobId(null);

    if (!file) {
      setError("Selecciona un PDF.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("job_type", jobType);

    // Common
    fd.append("topic_regex", topicRegex);
    fd.append("heading_scale", String(headingScale));
    fd.append("start_page", String(startPage));
    fd.append("toc_max_pages", String(tocMaxPages));
    if (endPageInt) fd.append("end_page", String(endPageInt));

    if (jobType === "export_all") {
      fd.append("mode", mode);
      fd.append("formats", formats.join(","));
    }

    if (jobType === "markdown") {
      // el worker usa use_toc default true
      fd.append("mode", "headings");
    }

    if (jobType === "clustering") {
      fd.append("model", model);
      fd.append("min_chars", String(minChars));
      if (nClustersInt) fd.append("n_clusters", String(nClustersInt));
    }

    setSubmitting(true);
    try {
      const resp = await fetch(clientApi("/jobs"), {
        method: "POST",
        body: fd,
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `HTTP ${resp.status}`);
      }

      const data = (await resp.json()) as { id: number };
      setCreatedJobId(data.id);
      setToastMessage("Job creado exitosamente");
      setShowToast(true);
      
      // Redirect after short delay
      setTimeout(() => {
        router.push(`/jobs/${data.id}`);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error creando el job");
    } finally {
      setSubmitting(false);
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        setError("Por favor, sube solo archivos PDF.");
      }
    }
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-background p-6 dark:border-white/10">
      {showToast && (
        <Toast 
          message={toastMessage} 
          type="success" 
          onClose={() => setShowToast(false)} 
        />
      )}
      
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <div>
            <div className="text-sm font-medium">Documento</div>
            <p className="text-sm text-black/60 dark:text-white/60">
              Sube un archivo PDF. El procesamiento se ejecuta en background.
            </p>
          </div>

          <label
            className={`group flex cursor-pointer items-center justify-between gap-4 rounded-xl border px-4 py-4 transition-all ${
              dragActive
                ? "border-foreground/50 bg-foreground/5 scale-[1.02]"
                : "border-dashed border-black/20 bg-black/5 hover:bg-black/10 dark:border-white/20 dark:bg-white/5 dark:hover:bg-white/10"
            } focus-within:ring-2 focus-within:ring-foreground/20`}
            aria-label="Seleccionar archivo PDF"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex min-w-0 items-center gap-3">
              {file ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  {file ? file.name : "Seleccionar PDF"}
                </div>
                <div className="truncate text-sm text-black/60 dark:text-white/60">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "Arrastra y suelta aquí o haz clic para elegir"}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-black/10 bg-background px-3 py-1 text-xs text-black/80 group-hover:bg-black/5 dark:border-white/10 dark:text-white/80 dark:group-hover:bg-white/5">
              {file ? "Cambiar" : "Buscar"}
            </span>
            <input
              className="sr-only"
              type="file"
              accept="application/pdf"
              disabled={submitting}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              Tipo de job
              <Tooltip content="Elige el tipo de procesamiento: multi-formato (recomendado), Markdown, o clustering">
                <svg className="h-4 w-4 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Tooltip>
            </label>
            <select
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
              disabled={submitting}
            >
              <option value="export_all">Exportación multi-formato</option>
              <option value="markdown">Markdown por tema</option>
              <option value="clustering">Clustering (TXT)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Regex tema</label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 font-mono text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
              value={topicRegex}
              onChange={(e) => setTopicRegex(e.target.value)}
              disabled={submitting}
            />
            <p className="mt-1 text-xs text-black/60 dark:text-white/60">
              Define cómo detectar los títulos de tema (por ejemplo: “Tema 1”, “Unidad 2”…).
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Página inicial</label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
              type="number"
              min={1}
              value={startPage}
              onChange={(e) => setStartPage(Number(e.target.value || 1))}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Página final (opcional)</label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              placeholder="(vacío = hasta el final)"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              Escala títulos
              <Tooltip content="Ajusta el tamaño relativo de los títulos detectados (1.0 - 4.0)">
                <svg className="h-4 w-4 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Tooltip>
            </label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
              type="number"
              step={0.1}
              min={1}
              max={4}
              value={headingScale}
              onChange={(e) => setHeadingScale(Number(e.target.value || 1.6))}
              disabled={submitting}
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium">
              TOC: páginas a escanear
              <Tooltip content="Número de páginas al inicio del documento donde buscar el índice">
                <svg className="h-4 w-4 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Tooltip>
            </label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
              type="number"
              min={1}
              max={200}
              value={tocMaxPages}
              onChange={(e) => setTocMaxPages(Number(e.target.value || 40))}
              disabled={submitting}
            />
          </div>
        </div>

        {jobType === "export_all" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium">
                Segmentación
                <Tooltip content="auto: detecta automáticamente, headings: usa títulos, toc: usa tabla de contenido">
                  <svg className="h-4 w-4 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </label>
              <select
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                disabled={submitting}
              >
                <option value="auto">auto</option>
                <option value="headings">headings</option>
                <option value="toc">toc</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Formatos</label>
              <div className="flex flex-wrap gap-2">
                {(["md", "html", "docx", "pdf", "txt", "json"] as const).map((f) => (
                  <label key={f} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formats.includes(f)}
                      disabled={submitting}
                      onChange={(e) => {
                        setFormats((prev) =>
                          e.target.checked
                            ? Array.from(new Set([...prev, f]))
                            : prev.filter((x) => x !== f),
                        );
                      }}
                    />
                    {f}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {jobType === "clustering" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Modelo</label>
              <input
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Min chars</label>
              <input
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
                type="number"
                min={100}
                max={5000}
                value={minChars}
                onChange={(e) => setMinChars(Number(e.target.value || 400))}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Clusters (opcional)</label>
              <input
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 dark:border-white/10"
                value={nClusters}
                onChange={(e) => setNClusters(e.target.value)}
                placeholder="(vacío = heurística)"
                disabled={submitting}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-all hover:scale-105 disabled:scale-100 disabled:opacity-60"
            disabled={submitting || !file}
            onClick={submit}
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" />
                Creando...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear job
              </>
            )}
          </button>
          {createdJobId && (
            <a className="text-sm underline" href={`/jobs/${createdJobId}`}>
              Ver job #{createdJobId}
            </a>
          )}
        </div>

        <p className="text-sm text-black/60 dark:text-white/60">
          Consejo: abre “Jobs” para ver el progreso y descargar el ZIP cuando termine.
        </p>
      </div>
    </div>
  );
}
