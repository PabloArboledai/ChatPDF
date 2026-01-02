#!/usr/bin/env python3
"""
Herramienta para extraer y agrupar temas de un PDF.

Uso básico:
  python extract_themes.py input.pdf --outdir output

Requisitos: ver `requirements.txt`.
"""
import argparse
import os
import math
from pathlib import Path
import re
import sys

try:
    import pdfplumber
except Exception:
    print("Instale 'pdfplumber' (pip install pdfplumber)")
    raise

try:
    from sentence_transformers import SentenceTransformer
except Exception:
    print("Instale 'sentence-transformers' (pip install sentence-transformers)")
    raise

import numpy as np
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer


def extract_pages_text(pdf_path):
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages.append({"page": i, "text": text})
    return pages


def chunk_pages(pages, min_chars=400):
    chunks = []
    for pg in pages:
        page_no = pg["page"]
        text = pg["text"].strip()
        if not text:
            continue
        # Split by double newlines or single newlines into paragraphs
        parts = re.split(r"\n\s*\n|\r\n\s*\r\n", text)
        buffer = []
        for p in parts:
            p = p.strip()
            if not p:
                continue
            buffer.append(p)
            cur = "\n\n".join(buffer)
            if len(cur) >= min_chars:
                chunks.append({"page": page_no, "text": cur})
                buffer = []
        if buffer:
            chunks.append({"page": page_no, "text": "\n\n".join(buffer)})
    # Attach ordering index
    for idx, c in enumerate(chunks):
        c["idx"] = idx
    return chunks


def embed_chunks(chunks, model_name="all-MiniLM-L6-v2", batch_size=32):
    model = SentenceTransformer(model_name)
    texts = [c["text"] for c in chunks]
    embeddings = model.encode(texts, batch_size=batch_size, show_progress_bar=True)
    return np.array(embeddings)


def choose_n_clusters(n_chunks):
    # Heuristic: one cluster every ~6 chunks, bounded
    n = max(2, min(20, math.ceil(n_chunks / 6)))
    return n


def cluster_embeddings(embeddings, n_clusters):
    km = KMeans(n_clusters=n_clusters, random_state=42)
    labels = km.fit_predict(embeddings)
    return labels


def top_keywords_for_cluster(texts, top_n=5):
    # Use TF-IDF to extract top terms
    vect = TfidfVectorizer(stop_words="spanish", max_features=5000, ngram_range=(1,2))
    X = vect.fit_transform(texts)
    feature_names = np.array(vect.get_feature_names_out())
    # Sum TF-IDF per term across all docs
    sums = np.asarray(X.sum(axis=0)).ravel()
    if sums.sum() == 0:
        return []
    top_indices = sums.argsort()[::-1][:top_n]
    return [feature_names[i] for i in top_indices]


def write_outputs(chunks, labels, outdir, pdf_name):
    os.makedirs(outdir, exist_ok=True)
    clusters = {}
    for c, lab in zip(chunks, labels):
        clusters.setdefault(lab, []).append(c)

    summary = []
    for lab, items in clusters.items():
        # sort by page then idx to keep original order
        items_sorted = sorted(items, key=lambda x: (x["page"], x["idx"]))
        texts = [it["text"] for it in items_sorted]
        full_text = "\n\n".join(texts).strip()
        keywords = top_keywords_for_cluster(texts, top_n=6)
        fname_base = f"theme_{lab+1:02d}"
        safe_keywords = "_".join([re.sub(r'[^a-zA-Z0-9]', '', k) for k in keywords])[:80]
        if safe_keywords:
            fname = f"{fname_base} - {safe_keywords}.txt"
        else:
            fname = f"{fname_base}.txt"
        path = os.path.join(outdir, fname)
        with open(path, "w", encoding="utf-8") as f:
            f.write(f"Source: {pdf_name}\n")
            f.write(f"Theme: {lab+1}\n")
            f.write(f"Keywords: {', '.join(keywords)}\n\n")
            f.write(full_text)
        summary.append({"file": path, "keywords": keywords, "size_chars": len(full_text)})
    return summary


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf", help="Ruta al PDF de entrada")
    ap.add_argument("--outdir", default="output", help="Directorio de salida")
    ap.add_argument("--model", default="all-MiniLM-L6-v2", help="Modelo de sentence-transformers")
    ap.add_argument("--min-chars", type=int, default=400, help="Tamaño mínimo por chunk en caracteres")
    ap.add_argument("--n-clusters", type=int, default=None, help="Número de clusters (temas). Si no se indica, se elige heurísticamente")
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"Archivo no encontrado: {pdf_path}")
        sys.exit(1)

    print("Extrayendo texto del PDF...")
    pages = extract_pages_text(str(pdf_path))
    print(f"Páginas con texto: {len(pages)}")

    print("Generando chunks...")
    chunks = chunk_pages(pages, min_chars=args.min_chars)
    print(f"Chunks creados: {len(chunks)}")
    if len(chunks) == 0:
        print("No se extrajo texto útil del PDF.")
        sys.exit(1)

    print("Calculando embeddings (esto puede tardar)...")
    embeddings = embed_chunks(chunks, model_name=args.model)

    n_clusters = args.n_clusters or choose_n_clusters(len(chunks))
    print(f"Agrupando en {n_clusters} temas (clusters)...")
    labels = cluster_embeddings(embeddings, n_clusters=n_clusters)

    outdir = os.path.join(args.outdir, pdf_path.stem)
    print(f"Escribiendo archivos a: {outdir}")
    summary = write_outputs(chunks, labels, outdir, pdf_path.name)

    print("Hecho. Resumen: ")
    for s in summary:
        print(f"- {s['file']} (keywords: {', '.join(s['keywords'])})")


if __name__ == "__main__":
    main()
