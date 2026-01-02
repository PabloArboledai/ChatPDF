"use client";

import { useMemo, useState } from "react";

import { clientApi } from "@/lib/api";

type JobType = "export_all" | "markdown" | "clustering";

export default function UploadForm() {
  const [jobType, setJobType] = useState<JobType>("export_all");
  const [file, setFile] = useState<File | null>(null);

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
        <div>
          <label className="mb-1 block text-sm font-medium">PDF</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de job</label>
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
            <label className="mb-1 block text-sm font-medium">Regex tema</label>
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
