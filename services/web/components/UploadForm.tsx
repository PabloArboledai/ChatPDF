"use client";

import { useMemo, useState, useRef, DragEvent } from "react";

import { clientApi } from "@/lib/api";

type JobType = "export_all" | "markdown" | "clustering";

export default function UploadForm() {
  const [jobType, setJobType] = useState<JobType>("export_all");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Validate both MIME type and file extension for better security
      const isPDF = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPDF) {
        setFile(file);
      } else {
        setError("Por favor, arrastra un archivo PDF válido.");
      }
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

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
    } catch (e: any) {
      setError(e?.message || "Error creando el job");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-black/10 p-6 dark:border-white/10">
      <div className="flex flex-col gap-4">
        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFileInputClick}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : file
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-black/20 hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            {file ? (
              <>
                <svg
                  className="h-12 w-12 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {file.name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="mt-2 text-xs text-red-600 underline hover:text-red-700 dark:text-red-400"
                >
                  Cambiar archivo
                </button>
              </>
            ) : (
              <>
                <svg
                  className="h-12 w-12 text-black/40 dark:text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-sm font-medium">
                  {isDragging ? "Suelta el archivo aquí" : "Arrastra un PDF o haz clic para seleccionar"}
                </p>
                <p className="text-xs text-black/60 dark:text-white/60">
                  Solo archivos PDF
                </p>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 flex items-center gap-1 text-sm font-medium">
              Tipo de job
              <span
                className="cursor-help text-black/40 dark:text-white/40"
                title="Exportación multi-formato: genera MD, HTML, DOCX, PDF, etc. | Markdown: solo archivos MD con imágenes | Clustering: agrupa texto por similitud semántica"
                aria-label="Información sobre tipos de job"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
            </label>
            <select
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
            >
              <option value="export_all">Exportación multi-formato</option>
              <option value="markdown">Markdown por tema</option>
              <option value="clustering">Clustering (TXT)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1 text-sm font-medium">
              Regex tema
              <span
                className="cursor-help text-black/40 dark:text-white/40"
                title="Expresión regular para detectar el inicio de un tema. Por ejemplo: Tema 1, Unidad 2, Capítulo 3"
                aria-label="Información sobre regex de temas"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </span>
            </label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              value={topicRegex}
              onChange={(e) => setTopicRegex(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Página inicial</label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              type="number"
              min={1}
              value={startPage}
              onChange={(e) => setStartPage(Number(e.target.value || 1))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Página final (opcional)</label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              placeholder="(vacío = hasta el final)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Escala títulos</label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              type="number"
              step={0.1}
              min={1}
              max={4}
              value={headingScale}
              onChange={(e) => setHeadingScale(Number(e.target.value || 1.6))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">TOC: páginas a escanear</label>
            <input
              className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
              type="number"
              min={1}
              max={200}
              value={tocMaxPages}
              onChange={(e) => setTocMaxPages(Number(e.target.value || 40))}
            />
          </div>
        </div>

        {jobType === "export_all" && (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Segmentación</label>
              <select
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
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
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Min chars</label>
              <input
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
                type="number"
                min={100}
                max={5000}
                value={minChars}
                onChange={(e) => setMinChars(Number(e.target.value || 400))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Clusters (opcional)</label>
              <input
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 dark:border-white/10"
                value={nClusters}
                onChange={(e) => setNClusters(e.target.value)}
                placeholder="(vacío = heurística)"
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-background disabled:opacity-60"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? "Creando…" : "Crear job"}
          </button>
          {createdJobId && (
            <a className="text-sm underline" href={`/jobs/${createdJobId}`}>
              Ver job #{createdJobId}
            </a>
          )}
        </div>

        <p className="text-sm text-black/60 dark:text-white/60">
          Nota: el procesamiento ocurre en background (worker). Ve a Jobs para seguir el estado.
        </p>
      </div>
    </div>
  );
}
