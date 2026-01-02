# 🆘 GUÍA DE EMERGENCIA Y TROUBLESHOOTING

**Fecha**: 2 de Enero de 2026
**Versión**: 1.0

---

## 🚨 PROBLEMAS CRÍTICOS

### El sitio no responde (https://civer.online)

**Paso 1: Verificar conectividad SSH**
```bash
# Desde Codespaces
sshpass -p "+tP6WoFmTKwv8apN" ssh -o StrictHostKeyChecking=no root@108.61.86.180 "echo OK"

# Resultado esperado: OK
```

**Paso 2: Verificar que Caddy está corriendo**
```bash
ssh root@108.61.86.180
cd /root/ChatPDF/deploy
docker-compose -f docker-compose.prod.yml ps caddy

# Resultado esperado: caddy-1  caddy:2  Up
```

**Paso 3: Ver logs de Caddy**
```bash
docker-compose -f docker-compose.prod.yml logs caddy | tail -50
```

**Paso 4: Verificar puertos abiertos**
```bash
netstat -tlnp | grep -E ':(80|443)'

# Resultado esperado:
# 0.0.0.0:80 
# 0.0.0.0:443
```

**Paso 5: Reiniciar Caddy**
```bash
cd /root/ChatPDF/deploy
docker-compose -f docker-compose.prod.yml restart caddy
sleep 5
curl -I https://civer.online
```

**Si aún no funciona:**
```bash
# Ver toda la configuración de Caddy
docker-compose -f docker-compose.prod.yml exec caddy cat /etc/caddy/Caddyfile

# Reiniciar todo
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
sleep 10
curl -I https://civer.online
```

---

### API no responde (error 503 o timeout)

**Paso 1: Verificar que el contenedor API existe**
```bash
docker-compose -f docker-compose.prod.yml ps api

# Resultado esperado: deploy-api-1  deploy-api  Up (healthy)
```

**Paso 2: Ver logs del API**
```bash
docker-compose -f docker-compose.prod.yml logs api | tail -100
```

**Paso 3: Verificar conexión a base de datos**
```bash
# ¿PostgreSQL está corriendo?
docker-compose -f docker-compose.prod.yml ps postgres

# Resultado esperado: deploy-postgres-1  postgres:16  Up (healthy)

# ¿Es accesible?
docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U chatpdf
```

**Paso 4: Reiniciar API**
```bash
docker-compose -f docker-compose.prod.yml restart api
sleep 5
curl http://localhost:8000/health
```

**Si PostgreSQL está caído:**
```bash
# Reiniciar BD
docker-compose -f docker-compose.prod.yml restart postgres
sleep 10

# Ver si se recupera
docker-compose -f docker-compose.prod.yml ps postgres
docker-compose -f docker-compose.prod.yml logs postgres | tail -30
```

---

### Base de datos no responde

**Paso 1: Verificar estado**
```bash
docker-compose -f docker-compose.prod.yml ps postgres
docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready
```

**Paso 2: Ver logs**
```bash
docker-compose -f docker-compose.prod.yml logs postgres | tail -50
```

**Paso 3: Verificar espacio en disco**
```bash
df -h
# Si disk está al 100%, limpiar:
docker system prune -a
```

**Paso 4: Reiniciar con limpieza**
```bash
# ADVERTENCIA: Esto eliminará los datos si el volumen está corrupto
docker-compose -f docker-compose.prod.yml down
docker volume rm deploy_postgres_data  # CUIDADO
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10
```

---

### Certificado SSL expirado o error ACME

**Paso 1: Verificar certificado**
```bash
echo | openssl s_client -servername civer.online -connect civer.online:443 2>/dev/null | grep -A2 "Issuer"

# Resultado esperado: Let's Encrypt
```

**Paso 2: Ver logs de Caddy**
```bash
docker-compose -f docker-compose.prod.yml logs caddy | grep -i acme
```

**Paso 3: Forzar renovación**
```bash
# Entrar al contenedor de Caddy
docker-compose -f docker-compose.prod.yml exec caddy bash

# Dentro del contenedor:
caddy stop
caddy start

# Salir
exit
```

**Paso 4: Si sigue fallando**
```bash
# Limpiar certificatos y reintentar
docker volume rm deploy_caddy_data
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d caddy
sleep 30
curl -I https://civer.online
```

---

## ⚠️ ERRORES COMUNES

### Error: "Connection refused"
```
Causa: El servicio no está escuchando en el puerto
Solución:
  1. docker-compose -f docker-compose.prod.yml restart [servicio]
  2. Verificar logs: docker-compose logs [servicio]
  3. Reiniciar todo: docker-compose down && docker-compose up -d
```

### Error: "SQLSTATE[08006] could not connect to server"
```
Causa: API no puede conectar a PostgreSQL
Solución:
  1. Verificar que PostgreSQL está corriendo: docker-compose ps postgres
  2. Revisar variables de entorno: cat .env | grep POSTGRES
  3. Ver logs de BD: docker-compose logs postgres
  4. Reiniciar: docker-compose restart postgres api
```

### Error: "Certificate required"
```
Causa: SSL no está configurado correctamente
Solución:
  1. Verificar DNS: nslookup civer.online
  2. Ver logs de Caddy: docker-compose logs caddy
  3. Forzar renovación: docker-compose restart caddy
```

### Error: "Disk full" / "No space left"
```
Causa: Servidor sin espacio disponible
Solución:
  1. Ver uso: df -h
  2. Limpiar Docker: docker system prune -a
  3. Revisar logs: du -sh /root/ChatPDF/*
  4. Si persiste: aumentar tamaño de VPS en Vultr
```

### Error: "No such file or directory" (.env)
```
Causa: Variables de entorno no cargadas
Solución:
  cd /root/ChatPDF/deploy
  cat > .env << 'EOF'
DOMAIN=civer.online
ENVIRONMENT=production
POSTGRES_USER=chatpdf
POSTGRES_DB=chatpdf_prod
POSTGRES_PASSWORD=ChatPDF2024Secure
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4
FRONTEND_PORT=3000
ACME_EMAIL=eduardo.ramirez.gob.mx@gmail.com
REDIS_PASSWORD=RedisSecure2024
LOG_LEVEL=info
EOF
  docker-compose up -d
```

---

## 🔧 DIAGNÓSTICO RÁPIDO

**Script para verificar todo:**
```bash
#!/bin/bash
echo "🏥 DIAGNÓSTICO RÁPIDO"
echo "====================="
echo ""
echo "1. Conectividad SSH:"
sshpass -p "+tP6WoFmTKwv8apN" ssh -o StrictHostKeyChecking=no root@108.61.86.180 "echo ✅ OK" || echo "❌ FALLO"

echo ""
echo "2. Sitio web:"
curl -s -I https://civer.online | head -1 || echo "❌ FALLO"

echo ""
echo "3. API:"
ssh root@108.61.86.180 "cd /root/ChatPDF/deploy && docker-compose exec -T api curl -s http://localhost:8000/health | head -1" || echo "❌ FALLO"

echo ""
echo "4. Base de datos:"
ssh root@108.61.86.180 "cd /root/ChatPDF/deploy && docker-compose exec -T postgres pg_isready -U chatpdf" || echo "❌ FALLO"

echo ""
echo "5. Almacenamiento:"
ssh root@108.61.86.180 "df -h | grep /dev/vda2"
```

---

## 🚀 RECUPERACIÓN DE DESASTRE

### Restaurar desde backup

**Si la base de datos se corrompió:**
```bash
# 1. Verificar que tienes el backup
ls -la /root/chatpdf_backup_*.sql

# 2. Detener servicios
docker-compose down

# 3. Limpiar volumen de BD (advertencia: elimina datos actuales)
docker volume rm deploy_postgres_data

# 4. Iniciar PostgreSQL
docker-compose up -d postgres
sleep 10

# 5. Restaurar backup
cat /root/chatpdf_backup_*.sql | docker-compose exec -T postgres psql -U chatpdf -d chatpdf_prod

# 6. Reiniciar todo
docker-compose up -d
```

### Redeploying completo

**Si todo está roto:**
```bash
# 1. Detener todo
docker-compose down -v  # CUIDADO: elimina volúmenes

# 2. Actualizar código
git fetch origin main
git reset --hard origin/main

# 3. Redeploying
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Monitorear
docker-compose logs -f
```

---

## 📞 ESCALAMIENTO

### Si necesitas ayuda remota

**Acceso SSH:**
```
IP: 108.61.86.180
Usuario: root
Contraseña: +tP6WoFmTKwv8apN
```

**Información para pasar:**
```bash
# Copiar para reportar problemas
echo "=== DIAGNÓSTICO ===" > /tmp/diag.txt
hostname >> /tmp/diag.txt
df -h | grep vda >> /tmp/diag.txt
docker-compose -f docker-compose.prod.yml ps >> /tmp/diag.txt
docker-compose logs --tail=50 >> /tmp/diag.txt
cat /tmp/diag.txt
```

---

## 🛡️ MEDIDAS PREVENTIVAS

### Monitoreo regular
```bash
# Cron para health check cada 5 minutos
*/5 * * * * curl -s https://civer.online > /dev/null && \
  echo "$(date) - OK" >> /root/health.log || \
  echo "$(date) - FALLO" >> /root/health.log
```

### Backups automáticos
```bash
# Backup diario a las 2 AM
0 2 * * * cd /root/ChatPDF/deploy && \
  docker-compose exec -T postgres pg_dump -U chatpdf chatpdf_prod > \
  /root/backups/chatpdf_$(date +\%Y\%m\%d_\%H\%M\%S).sql
```

### Verificación de logs
```bash
# Ver errores en logs
docker-compose logs --since 1h | grep -i error
```

---

## 📝 NOTAS IMPORTANTES

- **NO uses `docker-compose down -v`** a menos que quieras eliminar la base de datos
- **Siempre haz backup antes de cambios críticos**
- **Los certificados SSL se renuevan automáticamente**
- **PostgreSQL usa volumen persistente - datos se mantienen entre reinicios**
- **En caso de emergencia real, contacta soporte de Vultr**

---

**Última actualización**: 2 de Enero de 2026
**Versión**: Production 1.0
**Estado**: Activo y Monitoreado
