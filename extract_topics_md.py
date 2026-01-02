#!/usr/bin/env python3
"""Extracción de temas a Markdown (con imágenes) desde un PDF.

Objetivo:
- Generar archivos `.md` legibles.
- Extraer imágenes e insertarlas como `![](...)`.
- Intentar replicar estructura (títulos, listas y recuadros) con heurísticas.
- Agrupar en un archivo por tema usando detección de encabezados.

Limitación importante:
Markdown no puede reproducir de forma *pixel-perfect* un PDF. Este script
prioriza legibilidad y una estructura cercana, pero no idéntica.
"""

from __future__ import annotations

import argparse
import os
import re
import statistics
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

try:
    import fitz  # PyMuPDF
except Exception:
    print("Instale 'PyMuPDF' (pip install pymupdf)")
    raise


_BULLET_RE = re.compile(r"^\s*([•◦·\-–])\s+(.*)$")
_ENUM_RE = re.compile(r"^\s*(\d{1,3})[\.)]\s+(.*)$")


def slugify(value: str, max_len: int = 80) -> str:
    value = value.strip()
    value = re.sub(r"\s+", " ", value)
    value = value.lower()
    value = re.sub(r"[^a-z0-9áéíóúñü\s\-]", "", value)
    value = value.replace(" ", "-")
    value = re.sub(r"-+", "-", value).strip("-")
    return value[:max_len] or "tema"


def is_probably_footer_or_noise(line: str) -> bool:
    s = line.strip()
    if not s:
        return True
    # Common garbage from PDFs with mirrored text or licenses
    if len(s) <= 2 and s.isdigit():
        return True
    if "creative commons" in s.lower() or "licencia" in s.lower():
        return True
    # lines that look reversed / mostly non-words
    letters = sum(ch.isalpha() for ch in s)
    if letters > 0 and letters / max(1, len(s)) < 0.25:
        return True
    return False


def looks_like_page_number(line: str) -> bool:
    s = line.strip()
    return bool(re.fullmatch(r"\d{1,4}", s))


@dataclass
class Item:
    kind: str  # 'text' | 'image' | 'callout'
    y0: float
    x0: float
    y1: float
    x1: float
    text: Optional[str] = None
    font_size: Optional[float] = None
    image_bytes: Optional[bytes] = None
    image_ext: Optional[str] = None


def _median(values: list[float]) -> float:
    if not values:
        return 0.0
    return float(statistics.median(values))


def collect_items(doc: fitz.Document, page_index: int) -> list[Item]:
    page = doc[page_index]
    d = page.get_text("dict")

    items: list[Item] = []
    font_sizes: list[float] = []

    # Text blocks
    for block in d.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            spans = line.get("spans", [])
            text = "".join(s.get("text", "") for s in spans).strip()
            if not text:
                continue
            size = max((float(s.get("size", 0.0)) for s in spans), default=0.0)
            bbox = line.get("bbox") or block.get("bbox")
            if not bbox:
                continue
            font_sizes.append(size)
            items.append(
                Item(
                    kind="text",
                    x0=float(bbox[0]),
                    y0=float(bbox[1]),
                    x1=float(bbox[2]),
                    y1=float(bbox[3]),
                    text=text,
                    font_size=size,
                )
            )

    # Image blocks (prefer xref+rects to place them)
    img_seen = set()
    for img in page.get_images(full=True):
        xref = img[0]
        if xref in img_seen:
            continue
        rects = page.get_image_rects(xref)
        if not rects:
            continue
        try:
            info = doc.extract_image(xref)
        except Exception:
            continue
        img_bytes = info.get("image")
        img_ext = info.get("ext", "png")
        img_seen.add(xref)
        for r in rects:
            items.append(
                Item(
                    kind="image",
                    x0=float(r.x0),
                    y0=float(r.y0),
                    x1=float(r.x1),
                    y1=float(r.y1),
                    image_bytes=img_bytes,
                    image_ext=img_ext,
                )
            )

    # Detect rectangles to approximate “recuadros” -> GitHub callouts
    # This is heuristic: we create a callout item that replaces text that sits inside.
    rects: list[fitz.Rect] = []
    try:
        for dr in page.get_drawings():
            r = dr.get("rect")
            if r is None:
                continue
            rr = fitz.Rect(r)
            # ignore very small or huge (page border)
            if rr.get_area() < 10_000:
                continue
            if rr.width > page.rect.width * 0.98 and rr.height > page.rect.height * 0.98:
                continue
            rects.append(rr)
    except Exception:
        rects = []

    if rects:
        # For each rect, collect contained text lines
        consumed_ids: set[int] = set()
        for rr in rects:
            contained: list[Item] = []
            for idx, it in enumerate(items):
                if it.kind != "text":
                    continue
                if idx in consumed_ids:
                    continue
                # Containment with small tolerance
                if it.x0 >= rr.x0 - 2 and it.x1 <= rr.x1 + 2 and it.y0 >= rr.y0 - 2 and it.y1 <= rr.y1 + 2:
                    contained.append(it)
                    consumed_ids.add(idx)
            if contained:
                contained_sorted = sorted(contained, key=lambda t: (t.y0, t.x0))
                body = "\n".join(t.text for t in contained_sorted if t.text)
                items.append(
                    Item(
                        kind="callout",
                        x0=float(rr.x0),
                        y0=float(rr.y0),
                        x1=float(rr.x1),
                        y1=float(rr.y1),
                        text=body.strip(),
                        font_size=_median(font_sizes) if font_sizes else None,
                    )
                )

        # Remove consumed text items
        if consumed_ids:
            items = [it for idx, it in enumerate(items) if idx not in consumed_ids]

    # Sort items in reading order
    items.sort(key=lambda it: (it.y0, it.x0))
    return items


def find_printed_page_number(items: list[Item], page_height: float) -> Optional[int]:
    """Heurística: número de página impreso suele estar cerca del borde inferior."""
    candidates: list[tuple[float, int]] = []
    for it in items:
        if it.kind != "text" or not it.text:
            continue
        s = it.text.strip()
        if not looks_like_page_number(s):
            continue
        try:
            n = int(s)
        except Exception:
            continue
        # Near bottom 20%
        if it.y0 >= page_height * 0.80:
            candidates.append((it.y0, n))
    if not candidates:
        return None
    # choose the lowest on the page
    candidates.sort(key=lambda t: t[0], reverse=True)
    return candidates[0][1]


def parse_toc_entries(doc: fitz.Document, max_pages: int = 40) -> list[tuple[str, int]]:
    """Parsea una tabla de contenidos típica: '1. Título .... 160'.

    Devuelve lista de (titulo, pagina_impresa).
    """
    entries: list[tuple[str, int]] = []
    # Acepta puntos, espacios, o líneas con puntos de relleno
    toc_re = re.compile(
        r"^\s*(\d{1,2})\s*[\.)]\s*(.+?)\s*[\.·…\s]{2,}(\d{1,4})\s*$",
        re.IGNORECASE,
    )
    for page_i in range(min(max_pages, doc.page_count)):
        page = doc[page_i]
        items = collect_items(doc, page_i)
        lines = [it.text.strip() for it in items if it.kind == "text" and it.text]
        for ln in lines:
            if is_probably_footer_or_noise(ln):
                continue
            m = toc_re.match(ln)
            if not m:
                continue
            title = m.group(2).strip()
            try:
                pn = int(m.group(3))
            except Exception:
                continue
            if len(title) < 3:
                continue
            entries.append((title, pn))

    # Dedup conservando orden
    seen = set()
    dedup: list[tuple[str, int]] = []
    for t, p in entries:
        key = (t.lower(), p)
        if key in seen:
            continue
        seen.add(key)
        dedup.append((t, p))
    return dedup


def estimate_printed_to_pdf_offset(doc: fitz.Document, scan_pages: int = 80) -> Optional[int]:
    """Estimación robusta de offset: (pdf_page_1_indexed - printed_page).

    Si el PDF tiene páginas preliminares, la numeración impresa suele ir desfasada.
    """
    offsets: list[int] = []
    for page_i in range(min(scan_pages, doc.page_count)):
        page = doc[page_i]
        items = collect_items(doc, page_i)
        printed = find_printed_page_number(items, page.rect.height)
        if printed is None:
            continue
        # pdf page number is 1-indexed
        offsets.append((page_i + 1) - printed)
    if not offsets:
        return None
    # median to reduce outliers
    return int(statistics.median(offsets))


def format_text_line(line: str) -> tuple[str, bool]:
    """Return (md_line, is_list_item)."""
    m = _BULLET_RE.match(line)
    if m:
        return f"- {m.group(2).strip()}", True
    m = _ENUM_RE.match(line)
    if m:
        return f"{m.group(1)}. {m.group(2).strip()}", True
    return line.strip(), False


def heading_prefix(size: float, base_size: float, heading_scale: float) -> str:
    if base_size <= 0:
        return ""
    if size >= base_size * (heading_scale + 0.6):
        return "# "
    if size >= base_size * heading_scale:
        return "## "
    return ""


def write_topic(topic_dir: Path, title: str, lines: list[str]) -> Path:
    topic_dir.mkdir(parents=True, exist_ok=True)
    md_path = topic_dir / "tema.md"
    with md_path.open("w", encoding="utf-8") as f:
        f.write(f"# {title.strip()}\n\n")
        f.write("\n".join(lines).strip())
        f.write("\n")
    return md_path


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", help="Ruta al PDF")
    ap.add_argument("--outdir", default="output_md", help="Directorio de salida")
    ap.add_argument(
        "--topic-regex",
        default=r"^(tema|unidad|cap[ií]tulo)\s*\d+\b",
        help="Regex (case-insensitive) que define inicio de tema. Se aplica a líneas con tamaño grande.",
    )
    ap.add_argument("--heading-scale", type=float, default=1.6, help="Escala relativa para detectar títulos (base*scale)")
    ap.add_argument("--start-page", type=int, default=1, help="Página inicial (1-indexed)")
    ap.add_argument("--end-page", type=int, default=None, help="Página final (1-indexed, inclusive)")
    ap.add_argument(
        "--use-toc",
        action="store_true",
        help="Intentar segmentar por tabla de contenidos si no se detectan encabezados de tema.",
    )
    ap.add_argument(
        "--toc-max-pages",
        type=int,
        default=40,
        help="Máximo de páginas iniciales a escanear para tabla de contenidos.",
    )
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        raise SystemExit(f"Archivo no encontrado: {pdf_path}")

    out_root = Path(args.outdir) / pdf_path.stem
    out_root.mkdir(parents=True, exist_ok=True)

    topic_re = re.compile(args.topic_regex, re.IGNORECASE)

    doc = fitz.open(str(pdf_path))
    start_i = max(0, args.start_page - 1)
    end_i = (args.end_page - 1) if args.end_page else (doc.page_count - 1)
    end_i = min(end_i, doc.page_count - 1)

    def render_pages_to_lines(page_range: range, topic_dir: Path) -> list[str]:
        lines_out: list[str] = []
        for page_i in page_range:
            page = doc[page_i]
            items = collect_items(doc, page_i)

            # estimate base font size on this page
            sizes = [it.font_size for it in items if it.kind == "text" and it.font_size]
            base = _median([float(s) for s in sizes if s]) if sizes else 0.0

            lines_out.append(f"\n<!-- Página {page_i+1} -->\n")

            list_open = False
            for it in items:
                if it.kind == "image":
                    img_dir = topic_dir / "images"
                    img_dir.mkdir(parents=True, exist_ok=True)
                    img_name = f"p{page_i+1:03d}_y{int(it.y0):04d}_x{int(it.x0):04d}.{it.image_ext or 'png'}"
                    img_path = img_dir / img_name
                    if it.image_bytes and not img_path.exists():
                        img_path.write_bytes(it.image_bytes)
                    lines_out.append(f"![](images/{img_name})")
                    list_open = False
                    continue

                if it.kind == "callout" and it.text:
                    body_lines = [ln.strip() for ln in it.text.splitlines() if ln.strip()]
                    body_lines = [ln for ln in body_lines if not is_probably_footer_or_noise(ln)]
                    if body_lines:
                        lines_out.append("> [!NOTE]")
                        for ln in body_lines:
                            lines_out.append(f"> {ln}")
                    list_open = False
                    continue

                if it.kind != "text" or not it.text:
                    continue

                raw = it.text.strip()
                if is_probably_footer_or_noise(raw):
                    continue

                # Headings (simple)
                pref = heading_prefix(float(it.font_size or 0.0), base, args.heading_scale)
                if pref:
                    lines_out.append(f"{pref}{raw}")
                    list_open = False
                    continue

                # Lists and paragraphs
                md_line, is_list = format_text_line(raw)
                if is_list:
                    lines_out.append(md_line)
                    list_open = True
                else:
                    if list_open:
                        lines_out.append("")
                        list_open = False
                    lines_out.append(md_line)
        return lines_out

    def normalize_title(s: str) -> str:
        s = re.sub(r"\s+", " ", s.replace("\t", " ")).strip()
        return s

    def detect_heading_topics() -> list[tuple[str, int]]:
        """Detecta inicios de tema por encabezados prominentes en el flujo."""
        found: list[tuple[str, int]] = []
        seen_titles: set[str] = set()
        for page_i in range(start_i, end_i + 1):
            items = collect_items(doc, page_i)
            sizes = [it.font_size for it in items if it.kind == "text" and it.font_size]
            base = _median([float(s) for s in sizes if s]) if sizes else 0.0
            for it in items:
                if it.kind != "text" or not it.text:
                    continue
                raw = normalize_title(it.text)
                if is_probably_footer_or_noise(raw):
                    continue
                pref = heading_prefix(float(it.font_size or 0.0), base, args.heading_scale)
                if not pref:
                    continue
                if not topic_re.match(raw):
                    continue
                key = raw.lower()
                if key in seen_titles:
                    continue
                seen_titles.add(key)
                found.append((raw, page_i))
        found.sort(key=lambda t: t[1])
        return found

    index_lines: list[str] = []
    wrote_any = False

    # 1) Preferimos encabezados (si existen), pero ya renderizando el contenido real
    topics = detect_heading_topics()
    if topics:
        for idx, (title, start_page_idx) in enumerate(topics, start=1):
            end_page_idx = (topics[idx][1] - 1) if idx < len(topics) else end_i
            start_page_idx = max(start_i, start_page_idx)
            end_page_idx = min(end_i, end_page_idx)
            if end_page_idx < start_page_idx:
                continue
            slug = slugify(title)
            topic_dir = out_root / f"tema_{idx:03d}_{slug}"
            lines = render_pages_to_lines(range(start_page_idx, end_page_idx + 1), topic_dir)
            md_path = write_topic(topic_dir, title, lines)
            rel = md_path.relative_to(out_root)
            index_lines.append(f"- [{title}]({rel.as_posix()})")
        wrote_any = True

    # 2) Si no detectamos temas por encabezados, usamos tabla de contenidos
    if not wrote_any and args.use_toc:
        toc = parse_toc_entries(doc, max_pages=args.toc_max_pages)
        offset = estimate_printed_to_pdf_offset(doc)

        def printed_to_pdf_index(printed: int) -> Optional[int]:
            if offset is None:
                return None
            pdf_page = printed + offset
            if pdf_page < 1 or pdf_page > doc.page_count:
                return None
            return pdf_page - 1

        toc_pdf: list[tuple[str, int]] = []
        for title, p_printed in toc:
            idx2 = printed_to_pdf_index(p_printed)
            if idx2 is None:
                continue
            toc_pdf.append((normalize_title(title), idx2))

        if toc_pdf:
            toc_pdf.sort(key=lambda t: t[1])
            for idx, (title, start_page_idx) in enumerate(toc_pdf, start=1):
                end_page_idx = (toc_pdf[idx][1] - 1) if idx < len(toc_pdf) else end_i
                start_page_idx = max(start_i, start_page_idx)
                end_page_idx = min(end_i, end_page_idx)
                if end_page_idx < start_page_idx:
                    continue
                slug = slugify(title)
                topic_dir = out_root / f"tema_{idx:03d}_{slug}"
                lines = render_pages_to_lines(range(start_page_idx, end_page_idx + 1), topic_dir)
                md_path = write_topic(topic_dir, title, lines)
                rel = md_path.relative_to(out_root)
                index_lines.append(f"- [{title}]({rel.as_posix()})")
            wrote_any = True

    # 3) Fallback: un solo archivo con todo
    if not wrote_any:
        title = pdf_path.stem
        slug = slugify(title)
        topic_dir = out_root / f"tema_001_{slug}"
        lines = render_pages_to_lines(range(start_i, end_i + 1), topic_dir)
        md_path = write_topic(topic_dir, title, lines)
        rel = md_path.relative_to(out_root)
        index_lines.append(f"- [{title}]({rel.as_posix()})")
        wrote_any = True

    # Write index
    (out_root / "index.md").write_text(
        "# Índice de temas\n\n" + "\n".join(index_lines) + "\n",
        encoding="utf-8",
    )

    print(f"Listo. Markdown generado en: {out_root}")


if __name__ == "__main__":
    main()
