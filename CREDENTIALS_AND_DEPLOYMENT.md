# 🔐 Credenciales y Configuración de Despliegue en Producción

## Estado: 2 de Enero de 2026

---

## 📍 Información del Servidor VPS (Vultr)

### IP y Acceso
- **IP Pública**: `108.61.86.180`
- **Hostname**: `chatpdf-prod`
- **Región**: `ewr` (New Jersey)
- **Plan**: `vc2-1c-1gb` (1 vCPU, 1 GB RAM, 25 GB SSD)
- **OS**: Ubuntu 24.04.3 LTS x64
- **Estado**: `active` (Servidor activo y en línea)

### Credenciales SSH
```
Usuario: root
Contraseña: +tP6WoFmTKwv8apN
Puerto: 22
```

**Comando de acceso directo:**
```bash
sshpass -p "+tP6WoFmTKwv8apN" ssh -o StrictHostKeyChecking=no root@108.61.86.180
```

### Instance ID Vultr
```
7699437a-91d9-418d-9b44-d95a6489fc8e
```

---

## 🔑 APIs y Keys Externas

### Vultr API
```
Token: TO5MI6UX2KIIMWIBIWBSS5XKFXO5YFDJGOAQ
Base URL: https://api.vultr.com/v2
```

**Comando para obtener detalles del servidor:**
```bash
curl -H 'Authorization: Bearer TO5MI6UX2KIIMWIBIWBSS5XKFXO5YFDJGOAQ' \
  https://api.vultr.com/v2/instances/7699437a-91d9-418d-9b44-d95a6489fc8e
```

### Cloudflare DNS
```
Email: eduardo.ramirez.gob.mx@gmail.com
Global API Key: 3bc055261e648805ddf1f41304a304476e5e9
Origin CA Key: v1.0-b62bf5f8cefbfab31b3b48c0-47357b75527da10fae093cb0dba7fc1e8942ca136654a6d983a52930a3ba94b360b2c3bcfb4605ef56952fdcb9999bbdc100866861f31b7e64a90afa392736de7fa5a2bfa20e21b80d
Dominio: civer.online
```

---

## 📦 Configuración de Despliegue (.env.prod)

```env
# Base
DOMAIN=civer.online
ENVIRONMENT=production

# Database
POSTGRES_USER=chatpdf
POSTGRES_DB=chatpdf_prod
POSTGRES_PASSWORD=ChatPDF@Secure2024!

# API
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# Frontend
FRONTEND_PORT=3000

# Caddy (Reverse Proxy)
ACME_EMAIL=eduardo.ramirez.gob.mx@gmail.com

# Redis
REDIS_PASSWORD=RedisSecure2024!

# Logging
LOG_LEVEL=info
```

**Ubicación en servidor:**
```
/root/ChatPDF/deploy/.env.prod
```

---

## 🐳 Stack de Contenedores (Docker Compose)

Archivo: `/root/ChatPDF/deploy/docker-compose.prod.yml`

### Contenedores previstos:
1. **caddy** - Reverse proxy + ACME/SSL (puertos 80, 443)
2. **postgres** - Base de datos (puerto 5432, interno)
3. **redis** - Cache (puerto 6379, interno)
4. **api** - Backend Flask (puerto 8000, interno)
5. **web** - Frontend Next.js (puerto 3000, interno)

### Volúmenes:
- `caddy_data` - Certificados SSL
- `postgres_data` - Base de datos
- `redis_data` - Cache

---

## 🚀 Proceso de Despliegue

### 1. Bootstrap del Servidor (Primera vez)
```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. Clonar Repositorio
```bash
cd /root
git clone https://github.com/PabloArboledai/ChatPDF.git
cd ChatPDF
```

### 3. Crear .env.prod
```bash
cp deploy/.env.prod.example deploy/.env.prod
# Editar con valores reales (ver sección anterior)
```

### 4. Desplegar con Docker Compose
```bash
cd /root/ChatPDF
docker-compose -f deploy/docker-compose.prod.yml up -d --build
```

### 5. Verificar Despliegue
```bash
docker-compose -f deploy/docker-compose.prod.yml ps
docker-compose -f deploy/docker-compose.prod.yml logs -f
```

---

## 🔍 Comandos Útiles en el Servidor

### Verificar servicios
```bash
docker ps
docker ps -a
docker logs <container_id>
```

### Reiniciar servicios
```bash
cd /root/ChatPDF
docker-compose -f deploy/docker-compose.prod.yml restart
```

### Ver logs en tiempo real
```bash
docker-compose -f deploy/docker-compose.prod.yml logs -f api
docker-compose -f deploy/docker-compose.prod.yml logs -f web
```

### Detener todo
```bash
docker-compose -f deploy/docker-compose.prod.yml down
```

---

## 📋 Configuración DNS en Cloudflare

El script `deploy/cloudflare/set_dns.sh` configura:
- Registro A: `civer.online` → `108.61.86.180`
- Certificado SSL automático via Caddy + ACME

**Uso:**
```bash
CF_RECORD_CONTENT=108.61.86.180 bash deploy/cloudflare/set_dns.sh
```

---

## ✅ Checklist de Estado Actual

- [x] VPS creada en Vultr
- [x] IP asignada: 108.61.86.180
- [x] SSH accesible
- [ ] Docker instalado
- [ ] Docker Compose instalado
- [ ] Repositorio clonado
- [ ] .env.prod creado
- [ ] Contenedores ejecutándose
- [ ] DNS configurado en Cloudflare
- [ ] SSL certificado activo
- [ ] Sitio accesible en https://civer.online

---

## 📚 Scripts de Utilidad

### Script de Conexión SSH
```bash
#!/bin/bash
sshpass -p "+tP6WoFmTKwv8apN" ssh -o StrictHostKeyChecking=no root@108.61.86.180
```

### Script de Deployment
Ubicado en: `/workspaces/ChatPDF/deploy_to_production.sh`

### Script de Limpieza de Branches
Ubicado en: `/workspaces/ChatPDF/cleanup_branches.sh`

---

## 🐛 Troubleshooting

### El servidor no responde al SSH
- Verificar que el servidor está activo: `curl -H 'Authorization: Bearer TO5MI6UX2KIIMWIBIWBSS5XKFXO5YFDJGOAQ' https://api.vultr.com/v2/instances/7699437a-91d9-418d-9b44-d95a6489fc8e`
- Esperar 2-3 minutos después de crear la instancia
- Verificar el puerto 22: `timeout 5 bash -c "echo > /dev/tcp/108.61.86.180/22"`

### Docker no inicia
- Verificar instalación: `docker --version`
- Reiniciar Docker: `systemctl restart docker`
- Ver logs: `journalctl -u docker -n 50`

### Certificado SSL no se genera
- Verificar que el DNS apunta correctamente a 108.61.86.180
- Ver logs de Caddy: `docker logs caddy`
- Verificar email de ACME es válido

### Base de datos no conecta
- Verificar que PostgreSQL está corriendo: `docker ps | grep postgres`
- Verificar contraseña en .env.prod
- Ver logs: `docker logs chatpdf-postgres`

---

## 📞 Contacto y Soporte

- **Email ACME/Let's Encrypt**: eduardo.ramirez.gob.mx@gmail.com
- **Email Cloudflare**: eduardo.ramirez.gob.mx@gmail.com
- **Repositorio**: https://github.com/PabloArboledai/ChatPDF

---

**Última actualización**: 2 de Enero de 2026 16:40 UTC
**Estado del sistema**: En configuración inicial
