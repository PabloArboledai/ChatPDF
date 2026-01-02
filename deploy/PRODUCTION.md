# Producción: civer.online (VPS + Docker + Caddy)

> Seguridad: no uses Global API Keys en scripts. Crea tokens con privilegios mínimos.

## 0) Importante: rota tus claves

Si pegaste tokens o claves en un chat o repo, asume compromiso:
- Revoca/rota el token de Vultr.
- Revoca/rota el Global API Key de Cloudflare (mejor: crea un API Token nuevo y elimina el uso del global).

## 1) Crear VPS

Opción A (manual, recomendado): crea la VPS desde el panel de Vultr y añade tu SSH key.

Opción B (automatizado): usa el script:
- [deploy/vultr/create_instance.sh](deploy/vultr/create_instance.sh)

Necesitarás obtener `VULTR_OS_ID`, `VULTR_PLAN`, `VULTR_REGION` desde la API de Vultr.

## 2) DNS en Cloudflare para civer.online

Recomendado (primer arranque):
- Crea registro `A` para `civer.online` apuntando a la IP de la VPS.
- Deja proxy en **DNS only** (no proxied) hasta que Caddy emita el primer certificado.

Automatizado con API Token (mínimo privilegio):
- [deploy/cloudflare/set_dns.sh](deploy/cloudflare/set_dns.sh)

## 3) Preparar la VPS

Entra por SSH y ejecuta:

- [deploy/vps/bootstrap.sh](deploy/vps/bootstrap.sh)

Luego, dentro del repo en la VPS:

- Copia env y edita:
  - `cp deploy/.env.prod.example deploy/.env.prod`
  - `DOMAIN=civer.online`
  - `ACME_EMAIL=...`
  - `POSTGRES_PASSWORD=...`

- Despliega:
  - `bash deploy/vps/deploy.sh`

## 4) Verificar

- `docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod ps`
- Revisa TLS:
  - `docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod logs -n 200 caddy`

Cuando ya abra en tu navegador:
- Web: `https://civer.online`

## 5) Habilitar clustering ML (opcional)

En la VPS:

`docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod --profile ml up -d --build`
