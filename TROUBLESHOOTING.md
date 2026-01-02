# 🔧 Guía de Solución de Errores - ChatPDF

## ❌ Problema Común: "No puedo implementar los cambios"

### Síntoma
No puedes ver los cambios en tu sitio web o recibes errores al intentar desplegar.

---

## ✅ Solución Paso a Paso

### Opción 1: Despliegue con Docker (RECOMENDADO)

Este proyecto está diseñado para desplegarse con Docker. **No necesitas instalar Node.js ni las dependencias manualmente**.

#### Paso 1: Conectar al VPS

```bash
ssh tu-usuario@tu-vps-ip
```

#### Paso 2: Actualizar el Código

```bash
cd ChatPDF
git pull origin copilot/vscode-mjwwofkj-u6qx
```

Si recibes error de conflictos:
```bash
git stash  # Guarda cambios locales temporalmente
git pull origin copilot/vscode-mjwwofkj-u6qx
```

#### Paso 3: Verificar Variables de Entorno

```bash
cd deploy
cat .env.prod
```

Debe contener:
```env
DOMAIN=civer.online
ACME_EMAIL=tu-email@ejemplo.com
POSTGRES_PASSWORD=una-contraseña-segura-aquí
```

Si no existe, créalo:
```bash
cp .env.prod.example .env.prod
nano .env.prod  # Edita los valores
```

#### Paso 4: Desplegar con Docker

```bash
# Desde el directorio deploy/
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Este comando:
- ✅ Descarga las imágenes necesarias
- ✅ Instala todas las dependencias automáticamente
- ✅ Compila el código Next.js
- ✅ Inicia todos los servicios
- ✅ Configura HTTPS automáticamente

#### Paso 5: Verificar el Despliegue

```bash
# Ver el estado de los servicios
docker compose -f docker-compose.prod.yml ps

# Debe mostrar algo como:
# NAME     SERVICE   STATUS    PORTS
# web      web       running   3000/tcp
# api      api       running   8000/tcp
# caddy    caddy     running   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# ...
```

Ver logs si hay problemas:
```bash
# Logs de todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Logs solo del servicio web
docker compose -f docker-compose.prod.yml logs -f web

# Logs solo de Caddy (proxy/HTTPS)
docker compose -f docker-compose.prod.yml logs -f caddy
```

---

### Opción 2: Desarrollo Local (Solo para Testing)

Si quieres probar localmente **sin Docker**:

#### Paso 1: Instalar Dependencias

```bash
cd services/web
npm install
```

#### Paso 2: Compilar

```bash
npm run build
```

#### Paso 3: Ejecutar Localmente

```bash
npm run start
```

Abre http://localhost:3000

**NOTA**: Esta opción es solo para desarrollo. Para producción, usa Docker.

---

## 🐛 Errores Comunes y Soluciones

### Error: "Could not resolve host: civer.online"

**Causa**: El dominio no apunta al VPS o DNS no está configurado.

**Solución**:
1. Ve a tu panel de Cloudflare
2. Verifica que el registro A apunta a la IP del VPS
3. Temporalmente, pon el proxy en "DNS only" (nube gris)
4. Espera 5-10 minutos para propagación DNS
5. Intenta de nuevo

### Error: "Permission denied"

**Causa**: No tienes permisos en el VPS.

**Solución**:
```bash
# En el VPS
sudo usermod -aG docker $USER
newgrp docker

# Ahora intenta de nuevo
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Error: "Port 80 already in use"

**Causa**: Otro servicio está usando el puerto 80.

**Solución**:
```bash
# Ver qué está usando el puerto 80
sudo lsof -i :80

# Detener el servicio (ejemplo: nginx)
sudo systemctl stop nginx
sudo systemctl disable nginx

# Intentar de nuevo
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Error: "No space left on device"

**Causa**: Disco lleno en el VPS.

**Solución**:
```bash
# Ver espacio disponible
df -h

# Limpiar imágenes Docker antiguas
docker system prune -a --volumes

# Limpiar logs antiguos
sudo journalctl --vacuum-time=7d
```

### Error: "Cannot connect to database"

**Causa**: PostgreSQL no está listo o la contraseña es incorrecta.

**Solución**:
```bash
# Verificar que PostgreSQL está corriendo
docker compose -f docker-compose.prod.yml ps postgres

# Ver logs de PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres

# Si hay error de contraseña, verifica .env.prod
cat deploy/.env.prod | grep POSTGRES_PASSWORD
```

### Error: "next: not found" (al correr npm run build)

**Causa**: Intentas compilar sin Docker y las dependencias no están instaladas.

**Solución**:
```bash
# Opción A: Usa Docker (recomendado)
docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d --build

# Opción B: Instala dependencias localmente
cd services/web
npm install
npm run build
```

---

## 🔍 Verificar que Todo Funciona

### 1. Verificar Servicios Docker

```bash
docker compose -f deploy/docker-compose.prod.yml ps
```

Todos los servicios deben estar "running".

### 2. Probar el API

```bash
curl -I http://localhost:8000/health
# Debe responder: HTTP/1.1 200 OK
```

### 3. Probar el Web

```bash
curl -I https://civer.online
# Debe responder: HTTP/2 200
```

### 4. Verificar en el Navegador

Abre https://civer.online y verifica:
- ✅ La página carga
- ✅ Ves el hero section con 3 tarjetas
- ✅ Puedes arrastrar un archivo PDF
- ✅ Los tooltips aparecen al hacer hover

---

## 🚨 Si Nada Funciona

### Reinicio Completo

```bash
# Detener todos los servicios
docker compose -f deploy/docker-compose.prod.yml down

# Eliminar volúmenes (CUIDADO: borra la base de datos)
docker compose -f deploy/docker-compose.prod.yml down -v

# Limpiar todo
docker system prune -a

# Volver a desplegar desde cero
cd ChatPDF
git pull origin copilot/vscode-mjwwofkj-u6qx
cd deploy
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Verificar Logs Detallados

```bash
# Ver logs de los últimos 5 minutos
docker compose -f deploy/docker-compose.prod.yml logs --tail=200 --since=5m

# Ver logs en tiempo real
docker compose -f deploy/docker-compose.prod.yml logs -f
```

---

## 📞 Información de Debug

Si necesitas más ayuda, proporciona esta información:

```bash
# 1. Estado de los servicios
docker compose -f deploy/docker-compose.prod.yml ps

# 2. Versión de Docker
docker --version
docker compose version

# 3. Espacio en disco
df -h

# 4. Últimos logs del servicio web
docker compose -f deploy/docker-compose.prod.yml logs --tail=50 web

# 5. Verificar DNS
nslookup civer.online

# 6. Verificar puertos
sudo netstat -tulpn | grep -E ':(80|443|3000|8000)'
```

---

## ✅ Checklist de Verificación

Antes de reportar un error, verifica:

- [ ] Estoy en el VPS correcto
- [ ] He hecho `git pull` de la rama correcta
- [ ] El archivo `.env.prod` existe y tiene los valores correctos
- [ ] Docker está instalado y corriendo
- [ ] Los puertos 80 y 443 están libres
- [ ] El dominio apunta a la IP del VPS
- [ ] He esperado 5-10 minutos después de cambiar el DNS
- [ ] He probado con `docker compose up -d --build`
- [ ] He revisado los logs con `docker compose logs`

---

## 🎯 Comando de Despliegue Final

Si todo lo anterior está bien, este comando único debe funcionar:

```bash
cd ~/ChatPDF && \
git pull origin copilot/vscode-mjwwofkj-u6qx && \
cd deploy && \
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build && \
echo "✅ Despliegue completado. Verifica en https://civer.online"
```

---

## 📚 Recursos Adicionales

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Guía completa de despliegue
- [VISUAL_TEST_GUIDE.md](VISUAL_TEST_GUIDE.md) - Guía visual de las mejoras
- [Docker Compose Docs](https://docs.docker.com/compose/) - Documentación oficial

---

**¿Aún tienes problemas?** Copia y pega el output de estos comandos:

```bash
cd ~/ChatPDF/deploy
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 web
docker compose -f docker-compose.prod.yml logs --tail=100 caddy
```
