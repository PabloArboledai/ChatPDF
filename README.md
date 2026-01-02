# ChatPDF (extracción de temas)

Este repo contiene scripts para extraer contenido de libros en PDF y organizarlo por “tema”.

Importante (calidad / fidelidad)
- Extraer “tema completo” de un PDF puede hacerse de dos formas:
	- **Por encabezados reales** (recomendado cuando el libro tiene “Tema 1”, “Unidad 2”, etc.).
	- **Por agrupación semántica** (clustering). Útil cuando NO hay títulos claros, pero no replica fielmente el orden/estructura.
- **Markdown no puede replicar pixel-perfect un PDF**. Aun así, podemos generar un `.md` legible, con imágenes y cierta estructura (títulos, listas, recuadros) mediante heurísticas.

## Instalación

```bash
pip install -r requirements.txt
```

## GUI (recomendado)

La forma más cómoda de usar todas las acciones del sistema es la GUI local (web) con Streamlit:

```bash
streamlit run app.py
```

Atajos:
- `make gui`
- VS Code: **Terminal → Run Task… → ChatPDF: Run GUI (Streamlit)**

Desde la GUI puedes:
- Subir/seleccionar un PDF
- Ejecutar: exportación multi-formato, Markdown por tema, o clustering
- Ver vista previa (MD/HTML) y descargar resultados (ZIP o archivos individuales)

## Stack profesional (frontend + API + workers) [en progreso]

Además de la GUI local, el repo incluye un stack pensado para multiusuario en la nube:
- Frontend: Next.js en `services/web`
- API: FastAPI en `services/api`
- Workers: Celery en `services/worker`
- Infra local: Postgres + Redis vía Docker Compose

Arranque local (modo producción-like):

```bash
cp .env.example .env
docker compose up --build
```

Nota sobre Clustering (ML):
- El job `clustering` requiere dependencias pesadas (embeddings). Para evitar builds gigantes en entornos con poco disco, hay un worker ML opcional.
- En local puedes correr el stack base (export/markdown). Para habilitar clustering:

```bash
docker compose --profile ml up --build
```

Servicios:
- Web: http://localhost:3000
- API: http://localhost:8000/health

## Producción (VPS + dominio + HTTPS)

Este repo incluye un despliegue “production-like” con Docker Compose + Caddy (TLS automático).

### Requisitos en el VPS

- Docker + Docker Compose plugin instalados.
- Puertos 80/443 abiertos (firewall del proveedor + UFW si aplica).
- Un dominio apuntando (A/AAAA) al VPS.

### 1) Configurar variables

En tu VPS:

```bash
cd ChatPDF
cp deploy/.env.prod.example deploy/.env.prod
```

Edita `deploy/.env.prod`:
- `DOMAIN` (tu dominio)
- `ACME_EMAIL`
- `POSTGRES_PASSWORD` (larga)

Nota Cloudflare: para que Caddy pueda emitir el certificado con HTTP-01, el registro suele necesitar estar en modo “DNS only” durante la primera emisión. Luego puedes volver a habilitar el proxy si quieres.

### 2) Levantar el stack

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build
```

Guía ampliada (VPS + DNS + scripts): [deploy/PRODUCTION.md](deploy/PRODUCTION.md)

Para habilitar clustering (worker ML pesado):

```bash
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod --profile ml up -d --build
```

### 3) Verificar

- Web: `https://<tu-dominio>`
- Health API (interno, pero puedes exponerlo si lo necesitas): `docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod logs -n 100 api`

## Descargar PDF desde Google Drive (si es público)

```bash
gdown 'https://drive.google.com/uc?id=1mU6iMWe0ZxtfJqaTmNqybJyO2ax7JlJI&export=download' -O libro.pdf
```

## 1) Extracción por clustering (TXT)

Genera archivos `.txt` por cluster (menos fiel a “Tema” real):

```bash
python extract_themes.py libro.pdf --outdir output
```

Salida: `output/<pdf>/theme_XX*.txt`

## 2) Extracción a Markdown con imágenes (recomendado)

Genera `.md` por tema (si detecta encabezados) y extrae imágenes a carpetas `images/`.

```bash
python extract_topics_md.py libro.pdf --outdir output_md
```

Opciones útiles:
- `--topic-regex`: regex para detectar el inicio de un tema (por defecto: `^(tema|unidad|cap[ií]tulo)\s*\d+\b`).
- `--start-page` / `--end-page`: limitar páginas.

Salida:
- `output_md/<pdf>/index.md`
- `output_md/<pdf>/tema_XXX_<slug>/tema.md`
- `output_md/<pdf>/tema_XXX_<slug>/images/*`

## 3) Exportación multi-formato (todas las opciones en una)

Este modo exporta **por cada tema** a varios formatos a la vez:
- `tema.md` (legible + imágenes)
- `tema.html` (legible + CSS + imágenes)
- `tema.docx` (editable + imágenes)
- `tema.pdf` (**pixel-perfect**: páginas copiadas del PDF original)
- `tema.txt` (texto plano)
- `tema.json` (estructura para integraciones)

Ejemplo (TODO en una ejecución):

```bash
python export_topics.py libro.pdf --outdir output_all --formats all --mode auto --toc-max-pages 50
```

Notas rápidas de elección de formato:
- Si quieres “idéntico visual al libro”: usa `--formats pdf`.
- Si quieres “editable”: usa `--formats docx`.
- Si quieres “legible y versionable”: usa `--formats md` o `--formats html`.

