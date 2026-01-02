# 🚀 INSTRUCCIONES DE DESPLIEGUE A PRODUCCIÓN

## Estado Actual
- ✅ Aplicación lista en `main`
- ✅ Todos los cambios de agentes fusionados
- ✅ VPS existente en `civer.online`
- ✅ Script de despliegue automatizado creado

## Información Requerida

Antes de desplegar, necesitas tener a mano:

1. **Host SSH de la VPS**
   - Ejemplo: `root@your-vps-ip` o `your-vps.com`
   - Debe estar configurado para acceso sin contraseña (SSH key)

2. **Dominio**
   - Ya configurado: `civer.online` ✅
   - Debe apuntar a la IP de la VPS

3. **Email para ACME/Let's Encrypt**
   - Para certificados SSL automáticos
   - Ejemplo: `admin@civer.online`

## Prerequisitos

### En tu máquina local:

```bash
# 1. Verificar que tienes Git
git --version

# 2. Verificar acceso SSH a la VPS
ssh your-vps-host "echo SSH works"

# 3. Estar en el repositorio ChatPDF
cd /workspaces/ChatPDF
```

### En la VPS:

```bash
# 1. Tener Docker instalado
docker --version
docker compose version

# 2. Tener Git instalado
git --version

# 3. Tener acceso a /opt/chatpdf (crear si no existe)
sudo mkdir -p /opt/chatpdf
sudo chown $USER:$USER /opt/chatpdf
```

## Opción 1: Despliegue Automatizado (Recomendado)

### Paso 1: Ejecutar el Script de Despliegue

```bash
cd /workspaces/ChatPDF

# Sintaxis:
# bash deploy_to_production.sh <vps-host> [dominio] [email]

# Ejemplo 1: Si tu VPS IP es 192.168.1.100
bash deploy_to_production.sh root@192.168.1.100 civer.online admin@civer.online

# Ejemplo 2: Si tienes un hostname configurado
bash deploy_to_production.sh vps.civer.online civer.online admin@civer.online

# Ejemplo 3: Modo dry-run (ver cambios sin ejecutar)
bash deploy_to_production.sh --dry-run root@192.168.1.100 civer.online admin@civer.online
```

### Paso 2: El script hará automáticamente:

1. ✅ Validar configuración local
2. ✅ Verificar conexión SSH a la VPS
3. ✅ Crear archivo `.env.prod` en la VPS
4. ✅ Clonar o actualizar el repositorio en `/opt/chatpdf`
5. ✅ Construir imágenes Docker
6. ✅ Iniciar servicios con Docker Compose
7. ✅ Esperar a que Caddy emita certificados ACME
8. ✅ Verificar que la aplicación está accesible

### Paso 3: Verificar que funciona

```bash
# Espera 5-10 minutos para que los certificados se emitan
# Luego accede a:
https://civer.online

# Deberías ver la interfaz de ChatPDF con el nuevo diseño
```

## Opción 2: Despliegue Manual Paso a Paso

Si prefieres hacerlo manualmente:

### Paso 1: Conectarse a la VPS

```bash
ssh root@your-vps-ip
# o
ssh your-vps-hostname
```

### Paso 2: Clonar/Actualizar el Repositorio

```bash
# Crear directorio si no existe
mkdir -p /opt/chatpdf
cd /opt/chatpdf

# Si es la primera vez:
git clone https://github.com/PabloArboledai/ChatPDF.git .

# Si ya existe, actualizar:
cd /opt/chatpdf
git fetch origin main
git reset --hard origin/main
```

### Paso 3: Crear archivo de configuración

```bash
cd /opt/chatpdf

# Copiar el ejemplo
cp deploy/.env.prod.example deploy/.env.prod

# Editar con tus valores
nano deploy/.env.prod
```

Edita estos valores:
```bash
DOMAIN=civer.online
ACME_EMAIL=tu-email@civer.online
POSTGRES_PASSWORD=una-password-muy-segura-de-32-caracteres
```

### Paso 4: Desplegar con Docker Compose

```bash
cd /opt/chatpdf

# Construir e iniciar
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  up -d --build
```

### Paso 5: Verificar estado

```bash
# Ver estado de servicios
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  ps

# Ver logs de Caddy (para certificados ACME)
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  logs caddy

# Ver logs de toda la app
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  logs -f
```

### Paso 6: Verificar en navegador

```
https://civer.online
```

## Troubleshooting

### ❌ "Connection refused on port 443"

**Causa**: Caddy aún está emitiendo certificados ACME  
**Solución**: Espera 5-10 minutos y vuelve a intentar

```bash
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  logs caddy | tail -50
```

### ❌ "SSL certificate error"

**Causa**: DNS no está apuntando correctamente  
**Solución**: Verifica en Cloudflare que el registro A está correcto

```bash
# Desde tu máquina local:
nslookup civer.online
dig civer.online
```

### ❌ "Permission denied /opt/chatpdf"

**Causa**: Permisos incorrectos  
**Solución**: Cambiar permisos

```bash
sudo chown -R $USER:$USER /opt/chatpdf
chmod -R 755 /opt/chatpdf
```

### ❌ "Docker: command not found"

**Causa**: Docker no está instalado  
**Solución**: Instalar Docker

```bash
# En Ubuntu/Debian:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo bash get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### ❌ "PostgreSQL connection refused"

**Causa**: Volumen de base de datos corrupto  
**Solución**: Eliminar volumen y recrear (⚠️ se pierden datos)

```bash
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  down -v

# Luego desplegar de nuevo
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  up -d --build
```

## Después del Despliegue

### Validar cambios implementados

```bash
# Accede a la aplicación
https://civer.online

# Prueba las nuevas características:
# ✅ Drag & drop para cargar PDFs
# ✅ Auto-refresh en jobs
# ✅ Status badges con colores
# ✅ Tooltips en formularios
# ✅ Animaciones fluidas
```

### Monitorear la aplicación

```bash
# Ver logs en vivo
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  logs -f

# Ver uso de recursos
docker stats

# Ver servicios corriendo
docker ps
```

### Hacer respaldos

```bash
cd /opt/chatpdf

# Respaldar base de datos
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  exec postgres pg_dump -U chatpdf chatpdf > backup.sql

# Respaldar datos
cp -r /data /data-backup-$(date +%Y%m%d)
```

### Actualizar en el futuro

Cuando haya nuevos cambios en `main`:

```bash
cd /opt/chatpdf

# Actualizar código
git pull origin main

# Reconstruir e reiniciar
docker compose -f deploy/docker-compose.prod.yml \
  --env-file deploy/.env.prod \
  up -d --build
```

## Verificación Final

Una vez desplegado, verifica esto:

```
Checklist de Verificación:
[ ] https://civer.online abre correctamente
[ ] Certificado SSL es válido (🔒 en navegador)
[ ] Puedo cargar un PDF con drag & drop
[ ] Los trabajos se actualizan automáticamente
[ ] Los status badges muestran colores correctos
[ ] Los tooltips aparecen al hover
[ ] No hay errores en consola del navegador
[ ] Los logs del servidor no muestran errores críticos
```

## Documentación Adicional

- **DEPLOYMENT_GUIDE.md** - Guía detallada de despliegue
- **ROADMAP.md** - Plan de futuras mejoras
- **TROUBLESHOOTING.md** - Solución de problemas detallada
- **UX_IMPROVEMENTS.md** - Cambios técnicos implementados

## Soporte

Si tienes problemas:

1. Revisa `TROUBLESHOOTING.md`
2. Verifica los logs: `docker logs <container>`
3. Abre un Issue en GitHub con logs y detalles

---

**¡Tu aplicación está lista para producción! 🚀**

Para cualquier pregunta, consulta la documentación o abre un issue en GitHub.
