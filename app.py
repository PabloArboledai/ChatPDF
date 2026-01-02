#!/usr/bin/env python3

from __future__ import annotations

import os
import re
import shutil
import subprocess
import time
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import streamlit as st


APP_ROOT = Path(__file__).resolve().parent
CACHE_DIR = APP_ROOT / ".cache"
UPLOADS_DIR = CACHE_DIR / "uploads"
ZIPS_DIR = CACHE_DIR / "zips"

DEFAULT_OUT_EXPORT_ALL = APP_ROOT / "output_all"
DEFAULT_OUT_MD = APP_ROOT / "output_md"
DEFAULT_OUT_CLUSTER = APP_ROOT / "output"
DEFAULT_OUT_UI = APP_ROOT / "output_ui"


@dataclass(frozen=True)
class RunResult:
    ok: bool
    exit_code: int
    elapsed_s: float
    combined_log: str


def _safe_filename(name: str) -> str:
    name = name.strip().replace("\\", "/")
    name = name.split("/")[-1]
    name = re.sub(r"\s+", " ", name)
    name = re.sub(r"[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ._\- ()]", "", name)
    name = name.strip().replace(" ", "_")
    if not name.lower().endswith(".pdf"):
        name = f"{name}.pdf" if name else "documento.pdf"
    return name or "documento.pdf"


def _ensure_dirs() -> None:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    ZIPS_DIR.mkdir(parents=True, exist_ok=True)
    DEFAULT_OUT_UI.mkdir(parents=True, exist_ok=True)


def _existing_pdfs() -> list[Path]:
    pdfs = sorted(APP_ROOT.glob("*.pdf"))
    return [p for p in pdfs if p.is_file()]


def _pdf_stem(pdf_path: Path) -> str:
    # imita Path.stem pero evita cosas raras
    return pdf_path.name[:-4] if pdf_path.name.lower().endswith(".pdf") else pdf_path.stem


def _zip_dir(src_dir: Path, zip_path: Path) -> Path:
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for p in src_dir.rglob("*"):
            if p.is_dir():
                continue
            arcname = p.relative_to(src_dir).as_posix()
            zf.write(p, arcname)
    return zip_path


def _iter_lines(stream) -> Iterable[str]:
    # stdout puede ser None si algo va mal
    if stream is None:
        return
    for line in iter(stream.readline, ""):
        yield line


def run_command_streamed(argv: list[str], env: Optional[dict[str, str]] = None) -> RunResult:
    started = time.time()
    combined: list[str] = []

    status = st.status("Ejecutando…", expanded=True)
    log_box = st.empty()

    try:
        proc = subprocess.Popen(
            argv,
            cwd=str(APP_ROOT),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            env=env or os.environ.copy(),
        )
    except FileNotFoundError as e:
        elapsed = time.time() - started
        msg = f"No se pudo ejecutar el comando: {e}"
        status.update(label="Error", state="error", expanded=True)
        log_box.code(msg)
        return RunResult(ok=False, exit_code=127, elapsed_s=elapsed, combined_log=msg)

    for line in _iter_lines(proc.stdout):
        combined.append(line)
        # Evita que el widget crezca infinito; muestra lo último.
        tail = "".join(combined[-400:])
        log_box.code(tail)

    exit_code = proc.wait()
    elapsed = time.time() - started
    ok = exit_code == 0

    if ok:
        status.update(label=f"Listo en {elapsed:.1f}s", state="complete", expanded=False)
    else:
        status.update(label=f"Falló (exit {exit_code})", state="error", expanded=True)

    return RunResult(ok=ok, exit_code=exit_code, elapsed_s=elapsed, combined_log="".join(combined))


def _render_results_browser(base_dir: Path) -> None:
    st.subheader("Resultados")

    if not base_dir.exists():
        st.info("Aún no hay resultados en este directorio.")
        return

    pdf_dirs = sorted([p for p in base_dir.iterdir() if p.is_dir()])
    if not pdf_dirs:
        st.info("Aún no hay resultados en este directorio.")
        return

    chosen = st.selectbox(
        "Selecciona un trabajo (carpeta):",
        options=pdf_dirs,
        format_func=lambda p: p.name,
        key=f"select_{base_dir.name}",
    )

    index_md = chosen / "index.md"
    index_html = chosen / "index.html"
    index_json = chosen / "index.json"

    cols = st.columns([1, 1, 1])
    with cols[0]:
        st.caption("Ruta")
        st.code(str(chosen))
    with cols[1]:
        zip_path = ZIPS_DIR / f"{chosen.name}_{base_dir.name}.zip"
        if st.button("Preparar ZIP", key=f"zip_{base_dir.name}"):
            _zip_dir(chosen, zip_path)
        if zip_path.exists():
            st.download_button(
                "Descargar ZIP",
                data=zip_path.read_bytes(),
                file_name=zip_path.name,
                mime="application/zip",
                key=f"download_zip_{base_dir.name}",
            )
    with cols[2]:
        st.caption("Índices")
        st.write(
            {
                "index.md": index_md.exists(),
                "index.html": index_html.exists(),
                "index.json": index_json.exists(),
            }
        )

    # Vista rápida de index.md
    if index_md.exists():
        with st.expander("Vista previa: index.md", expanded=True):
            st.markdown(index_md.read_text(encoding="utf-8"))

    # Exploración por tema
    topic_dirs = sorted([p for p in chosen.iterdir() if p.is_dir() and p.name.startswith("tema_")])
    if not topic_dirs:
        st.warning("No se detectaron carpetas de tema (tema_XXX_*).")
        return

    topic = st.selectbox("Tema:", options=topic_dirs, format_func=lambda p: p.name)

    md_path = topic / "tema.md"
    html_path = topic / "tema.html"
    txt_path = topic / "tema.txt"
    json_path = topic / "tema.json"
    docx_path = topic / "tema.docx"
    pdf_path = topic / "tema.pdf"

    st.write(
        {
            "md": md_path.exists(),
            "html": html_path.exists(),
            "docx": docx_path.exists(),
            "pdf": pdf_path.exists(),
            "txt": txt_path.exists(),
            "json": json_path.exists(),
        }
    )

    preview_tabs = st.tabs(["Markdown", "HTML", "Texto", "Descargas"])

    with preview_tabs[0]:
        if md_path.exists():
            st.markdown(md_path.read_text(encoding="utf-8"))
            img_dir = topic / "images"
            if img_dir.exists():
                imgs = sorted([p for p in img_dir.iterdir() if p.is_file()])
                if imgs:
                    with st.expander("Imágenes del tema"):
                        for img in imgs[:40]:
                            st.image(str(img), caption=img.name)
                        if len(imgs) > 40:
                            st.caption(f"Mostrando 40/{len(imgs)}")
        else:
            st.info("No hay tema.md en este tema.")

    with preview_tabs[1]:
        if html_path.exists():
            html = html_path.read_text(encoding="utf-8")
            st.components.v1.html(html, height=800, scrolling=True)
        else:
            st.info("No hay tema.html en este tema.")

    with preview_tabs[2]:
        if txt_path.exists():
            st.text(txt_path.read_text(encoding="utf-8"))
        else:
            st.info("No hay tema.txt en este tema.")

    with preview_tabs[3]:
        downloads = []
        for p in [md_path, html_path, docx_path, pdf_path, txt_path, json_path]:
            if p.exists():
                downloads.append(p)
        if not downloads:
            st.info("No hay archivos descargables en este tema.")
        else:
            for p in downloads:
                st.download_button(
                    f"Descargar {p.name}",
                    data=p.read_bytes(),
                    file_name=p.name,
                    key=f"dl_{base_dir.name}_{topic.name}_{p.name}",
                )


def main() -> None:
    _ensure_dirs()

    st.set_page_config(page_title="ChatPDF – GUI", layout="wide")

    st.title("ChatPDF – GUI")
    st.caption("Sube un PDF, elige el modo, ejecuta y descarga resultados.")

    with st.sidebar:
        st.header("1) PDF")
        uploaded = st.file_uploader("Subir PDF", type=["pdf"], accept_multiple_files=False)

        pdf_path: Optional[Path] = None
        if uploaded is not None:
            name = _safe_filename(uploaded.name)
            pdf_path = UPLOADS_DIR / name
            pdf_path.write_bytes(uploaded.getbuffer())
            st.success(f"PDF cargado: {pdf_path.name}")
        else:
            existing = _existing_pdfs()
            if existing:
                chosen = st.selectbox("…o usar un PDF existente en el proyecto", existing, format_func=lambda p: p.name)
                pdf_path = chosen
            else:
                st.info("No hay PDFs en el proyecto. Sube uno.")

        st.divider()
        st.header("2) Salida")
        out_base = st.text_input("Directorio base de salida", value=str(DEFAULT_OUT_UI))
        out_base_path = Path(out_base)

        st.caption("Sugerencia: deja el default para mantener todo organizado.")

    if pdf_path is None:
        st.stop()

    pdf_stem = _pdf_stem(pdf_path)

    st.header("Acciones")
    tabs = st.tabs(["Exportación (multi-formato)", "Markdown (temas)", "Clustering (TXT)", "Resultados"])

    with tabs[0]:
        st.subheader("Exportar por tema a múltiples formatos")
        st.write(
            "Este modo es el más completo. Para máxima fidelidad visual, incluye `pdf` (copia páginas del original)."
        )

        col1, col2, col3 = st.columns([1, 1, 1])
        with col1:
            mode = st.selectbox("Modo de segmentación", options=["auto", "headings", "toc"], index=0)
            topic_regex = st.text_input(
                "Regex de inicio de tema (headings)",
                value=r"^(tema|unidad|cap[ií]tulo)\s*\d+\b",
            )
            heading_scale = st.number_input("Escala de título", min_value=1.0, max_value=4.0, value=1.6, step=0.1)

        with col2:
            formats_ui = st.multiselect(
                "Formatos",
                options=["md", "html", "docx", "pdf", "txt", "json"],
                default=["md", "pdf"],
            )
            toc_max_pages = st.number_input("TOC: páginas a escanear", min_value=1, max_value=200, value=40, step=1)

        with col3:
            start_page = st.number_input("Página inicial (1-index)", min_value=1, value=1, step=1)
            end_page_raw = st.text_input("Página final (opcional)", value="")
            end_page: Optional[int]
            try:
                end_page = int(end_page_raw) if end_page_raw.strip() else None
            except Exception:
                end_page = None
                st.warning("Página final inválida; se ignorará.")

        outdir = out_base_path / "export_all"
        cmd = [
            "python",
            "export_topics.py",
            str(pdf_path),
            "--outdir",
            str(outdir),
            "--formats",
            ",".join(formats_ui) if formats_ui else "md",
            "--mode",
            mode,
            "--topic-regex",
            topic_regex,
            "--heading-scale",
            str(heading_scale),
            "--start-page",
            str(int(start_page)),
            "--toc-max-pages",
            str(int(toc_max_pages)),
        ]
        if end_page is not None:
            cmd += ["--end-page", str(int(end_page))]

        st.code(" ".join(cmd))

        if st.button("Ejecutar exportación", type="primary"):
            res = run_command_streamed(cmd)
            if res.ok:
                st.session_state["last_export_all"] = str(outdir / pdf_stem)

    with tabs[1]:
        st.subheader("Generar Markdown por tema (con imágenes)")
        col1, col2 = st.columns([1, 1])
        with col1:
            topic_regex = st.text_input(
                "Regex de inicio de tema",
                value=r"^(tema|unidad|cap[ií]tulo)\s*\d+\b",
                key="md_topic_regex",
            )
            heading_scale = st.number_input(
                "Escala de título",
                min_value=1.0,
                max_value=4.0,
                value=1.6,
                step=0.1,
                key="md_heading_scale",
            )
            use_toc = st.checkbox("Usar TOC como fallback", value=True)
            toc_max_pages = st.number_input(
                "TOC: páginas a escanear",
                min_value=1,
                max_value=200,
                value=40,
                step=1,
                key="md_toc_max_pages",
            )

        with col2:
            start_page = st.number_input("Página inicial (1-index)", min_value=1, value=1, step=1, key="md_start")
            end_page_raw = st.text_input("Página final (opcional)", value="", key="md_end")
            end_page: Optional[int]
            try:
                end_page = int(end_page_raw) if end_page_raw.strip() else None
            except Exception:
                end_page = None
                st.warning("Página final inválida; se ignorará.")

        outdir = out_base_path / "md"
        cmd = [
            "python",
            "extract_topics_md.py",
            str(pdf_path),
            "--outdir",
            str(outdir),
            "--topic-regex",
            topic_regex,
            "--heading-scale",
            str(heading_scale),
            "--start-page",
            str(int(start_page)),
            "--toc-max-pages",
            str(int(toc_max_pages)),
        ]
        if end_page is not None:
            cmd += ["--end-page", str(int(end_page))]
        if use_toc:
            cmd += ["--use-toc"]

        st.code(" ".join(cmd))

        if st.button("Ejecutar Markdown", type="primary", key="run_md"):
            res = run_command_streamed(cmd)
            if res.ok:
                st.session_state["last_md"] = str(outdir / pdf_stem)

    with tabs[2]:
        st.subheader("Clustering semántico (TXT por cluster)")
        st.write(
            "Útil si el PDF no tiene encabezados claros. Es menos fiel al orden/estructura real del libro."
        )

        col1, col2, col3 = st.columns([1, 1, 1])
        with col1:
            model = st.text_input("Modelo embeddings", value="all-MiniLM-L6-v2")
            min_chars = st.number_input("Mínimo chars por chunk", min_value=100, max_value=5000, value=400, step=50)
        with col2:
            n_clusters_raw = st.text_input("Número de clusters (opcional)", value="")
            n_clusters: Optional[int]
            try:
                n_clusters = int(n_clusters_raw) if n_clusters_raw.strip() else None
            except Exception:
                n_clusters = None
                st.warning("Número de clusters inválido; se usará heurística.")
        with col3:
            outdir = out_base_path / "clusters"
            st.caption("Salida")
            st.code(str(outdir))

        cmd = [
            "python",
            "extract_themes.py",
            str(pdf_path),
            "--outdir",
            str(outdir),
            "--model",
            model,
            "--min-chars",
            str(int(min_chars)),
        ]
        if n_clusters is not None:
            cmd += ["--n-clusters", str(int(n_clusters))]

        st.code(" ".join(cmd))

        if st.button("Ejecutar clustering", type="primary", key="run_cluster"):
            res = run_command_streamed(cmd)
            if res.ok:
                st.session_state["last_cluster"] = str(outdir / pdf_stem)

    with tabs[3]:
        st.subheader("Explorar y descargar resultados")

        base_choice = st.selectbox(
            "Directorio de resultados",
            options=[
                (out_base_path / "export_all"),
                (out_base_path / "md"),
                (out_base_path / "clusters"),
                DEFAULT_OUT_EXPORT_ALL,
                DEFAULT_OUT_MD,
                DEFAULT_OUT_CLUSTER,
            ],
            format_func=lambda p: str(p),
        )
        _render_results_browser(Path(base_choice))


if __name__ == "__main__":
    main()
