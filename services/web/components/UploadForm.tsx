"use client";

import { useMemo, useState } from "react";

import { clientApi } from "@/lib/api";

type JobType = "export_all" | "markdown" | "clustering";

const inputBase =
  "w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10";

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"] as const;
  let value = Math.max(0, bytes);
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const precision = unitIndex <= 1 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export default function UploadForm() {
  const [jobType, setJobType] = useState<JobType>("export_all");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  async function submit() {
    setError(null);
    setCreatedJobId(null);

    if (!file) {
      setError("Selecciona un PDF.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("El archivo debe ser un PDF.");
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

  const jobTypeHelp =
    jobType === "export_all"
      ? "Exporta por temas en varios formatos (recomendado)."
      : jobType === "markdown"
        ? "Genera Markdown por tema (rápido para lectura)."
        : "Agrupa texto por similitud (útil para organizar).";

  return (
    <form
      className="rounded-2xl border border-black/10 p-6 dark:border-white/10"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Archivo PDF</div>
              <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                Arrastra y suelta, o haz clic para seleccionar.
              </div>
            </div>
            {file && (
              <button
                type="button"
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                onClick={() => setFile(null)}
              >
                Quitar
              </button>
            )}
          </div>

          <label
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition-colors ${
              isDragging
                ? "border-black/30 bg-black/5 dark:border-white/30 dark:bg-white/5"
                : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            }`}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(false);
              const dropped = e.dataTransfer.files?.[0] || null;
              setFile(dropped);
            }}
          >
            <input
              className="sr-only"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="text-sm">
              {file ? (
                <span className="font-medium">{file.name}</span>
              ) : (
                <span className="font-medium">Seleccionar PDF</span>
              )}
            </div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">
              {file ? formatBytes(file.size) : "Solo archivos .pdf"}
            </div>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de job</label>
            <select
              className={inputBase}
              value={jobType}
              onChange={(e) => setJobType(e.target.value as JobType)}
            >
              <option value="export_all">Exportación multi-formato</option>
              <option value="markdown">Markdown por tema</option>
              <option value="clustering">Clustering (TXT)</option>
            </select>
            <p className="mt-2 text-xs text-black/60 dark:text-white/60">{jobTypeHelp}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Página inicial</label>
            <input
              className={inputBase}
              type="number"
              min={1}
              value={startPage}
              onChange={(e) => setStartPage(Number(e.target.value || 1))}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Página final (opcional)</label>
            <input
              className={inputBase}
              value={endPage}
              onChange={(e) => setEndPage(e.target.value)}
              placeholder="(vacío = hasta el final)"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">TOC: páginas a escanear</label>
            <input
              className={inputBase}
              type="number"
              min={1}
              max={200}
              value={tocMaxPages}
              onChange={(e) => setTocMaxPages(Number(e.target.value || 40))}
            />
          </div>
        </div>

        <details className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
          <summary className="cursor-pointer select-none text-sm font-medium">
            Ajustes avanzados
            <span className="ml-2 text-xs text-black/60 dark:text-white/60">
              (opcional)
            </span>
          </summary>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Regex tema</label>
              <input
                className={inputBase}
                value={topicRegex}
                onChange={(e) => setTopicRegex(e.target.value)}
              />
              <p className="mt-2 text-xs text-black/60 dark:text-white/60">
                Se usa para detectar encabezados como “Tema 1”, “Unidad 2”, “Capítulo 3”…
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Escala títulos</label>
              <input
                className={inputBase}
                type="number"
                step={0.1}
                min={1}
                max={4}
                value={headingScale}
                onChange={(e) => setHeadingScale(Number(e.target.value || 1.6))}
              />
            </div>

            {jobType === "export_all" && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Segmentación</label>
                  <select
                    className={inputBase}
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
                    {(["md", "html", "docx", "pdf", "txt", "json"] as const).map((f) => {
                      const checked = formats.includes(f);
                      return (
                        <button
                          key={f}
                          type="button"
                          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                            checked
                              ? "border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/10"
                              : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                          }`}
                          onClick={() => {
                            setFormats((prev) =>
                              checked ? prev.filter((x) => x !== f) : Array.from(new Set([...prev, f])),
                            );
                          }}
                        >
                          {f}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-black/60 dark:text-white/60">
                    Tip: deja solo los formatos que realmente necesites.
                  </p>
                </div>
              </>
            )}

            {jobType === "clustering" && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium">Modelo</label>
                  <input
                    className={inputBase}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Min chars</label>
                  <input
                    className={inputBase}
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
                    className={inputBase}
                    value={nClusters}
                    onChange={(e) => setNClusters(e.target.value)}
                    placeholder="(vacío = heurística)"
                  />
                </div>
              </>
            )}
          </div>
        </details>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-background disabled:opacity-60"
            disabled={submitting || !file}
            type="submit"
          >
            {submitting ? "Creando…" : "Crear job"}
          </button>
          <a
            className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-sm hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
            href="/jobs"
          >
            Ver jobs
          </a>
          {createdJobId && (
            <a className="text-sm underline" href={`/jobs/${createdJobId}`}>
              Ver job #{createdJobId}
            </a>
          )}
        </div>

        <p className="text-sm text-black/60 dark:text-white/60">
          Nota: el procesamiento ocurre en segundo plano. Puedes seguir el estado desde “Jobs”.
        </p>
      </div>
    </form>
  );
}
