# Extracción y organización de temas desde PDFs

Este pequeño proyecto permite extraer texto de un libro en PDF y agrupar el contenido por "temas" (topics). Genera un archivo por cada tema que contiene todo el texto relacionado (aunque esté distribuido en varias páginas).

Requisitos
- Python 3.9+
- Instalar dependencias:

```bash
pip install -r requirements.txt
```

Uso

1. Descargar el PDF (por ejemplo, desde Google Drive). Si el archivo es público puede usarse `gdown`:

```bash
pip install gdown
gdown 'https://drive.google.com/uc?id=1mU6iMWe0ZxtfJqaTmNqybJyO2ax7JlJI&export=download'
```

2. Ejecutar el extractor:

```bash
python extract_themes.py path/al/libro.pdf --outdir output
```

Opciones útiles:
- `--model`: modelo de `sentence-transformers` (por defecto `all-MiniLM-L6-v2`).
- `--min-chars`: tamaño mínimo por chunk (por defecto 400).
- `--n-clusters`: forzar número de temas.

Salida

Se crea `output/<nombre_del_pdf>/` con un archivo por tema (`theme_01 - keywords.txt`, etc.).

Notas
- Si el PDF está escaneado (imagen), primero conviértalo con OCR (por ejemplo Tesseract) o use un pipeline OCR antes de procesarlo.
- La agrupación usa embeddings y clustering; puede necesitar ajustes según el libro y el tamaño.

Si quieres, puedo:
- Añadir generación de PDFs por tema en lugar de `.txt`.
- Ajustar el algoritmo para detectar encabezados numéricos/por estilo.
- Probar el script con el PDF que indicas (necesitaré que lo subas o confirmes acceso público).
# ChatPDF