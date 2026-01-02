# 🚀 Despliegue Rápido - ChatPDF en civer.online

## ⚡ Despliegue en 1 Comando

**En tu VPS, ejecuta:**

```bash
cd ~/ChatPDF && ./deploy_to_production.sh
```

Eso es todo! El script automáticamente:
- ✅ Descarga los últimos cambios
- ✅ Verifica la configuración
- ✅ Construye los servicios
- ✅ Despliega todo con Docker
- ✅ Verifica que funcione

---

## 📋 Primera Vez - Configuración Rápida

Si es tu primera vez desplegando:

### 1. Conéctate al VPS
```bash
ssh tu-usuario@tu-vps-ip
```

### 2. Clona el Repositorio (si no lo has hecho)
```bash
git clone https://github.com/PabloArboledai/ChatPDF.git
cd ChatPDF
git checkout copilot/vscode-mjwwofkj-u6qx
```

### 3. Configura las Variables
```bash
cd deploy
cp .env.prod.example .env.prod
nano .env.prod
```

Edita estos valores:
```env
DOMAIN=civer.online
ACME_EMAIL=tu-email@ejemplo.com
POSTGRES_PASSWORD=pon-una-contraseña-segura-aquí
```

### 4. Ejecuta el Script de Despliegue
```bash
cd ..
./deploy_to_production.sh
```

### 5. ¡Listo!
Abre https://civer.online en tu navegador

---

## 🔧 ¿Tienes Problemas?

### Problema: "Permission denied"
```bash
sudo usermod -aG docker $USER
newgrp docker
./deploy_to_production.sh
```

### Problema: "Port already in use"
```bash
sudo systemctl stop nginx
sudo systemctl disable nginx
./deploy_to_production.sh
```

### Problema: Otros errores
Lee la [Guía Completa de Troubleshooting](TROUBLESHOOTING.md) para soluciones detalladas.

---

## 📚 Documentación Completa

- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Solución de todos los errores posibles
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Guía detallada de despliegue manual
- **[VISUAL_TEST_GUIDE.md](VISUAL_TEST_GUIDE.md)** - Cómo probar las nuevas características

---

## 🎯 Verificar el Despliegue

Después de desplegar, verifica que funcione:

1. **Abre https://civer.online**
2. **Verifica estas características:**
   - ✅ Hero section con 3 tarjetas de características
   - ✅ Drag & drop de archivos PDF
   - ✅ Tooltips en campos del formulario
   - ✅ Auto-refresh en páginas de jobs
   - ✅ Animaciones de éxito cuando completa un job

---

## 🔄 Actualizar el Sitio

Para actualizar con nuevos cambios:

```bash
cd ~/ChatPDF
./deploy_to_production.sh
```

El script automáticamente descarga cambios nuevos y redespliega.

---

## 📊 Ver Logs

```bash
# Ver logs en tiempo real
cd ~/ChatPDF/deploy
docker compose -f docker-compose.prod.yml logs -f

# Ver solo logs del web
docker compose -f docker-compose.prod.yml logs -f web

# Ver últimas 100 líneas
docker compose -f docker-compose.prod.yml logs --tail=100
```

---

## 🛑 Detener el Sitio

```bash
cd ~/ChatPDF/deploy
docker compose -f docker-compose.prod.yml down
```

Para reiniciar:
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito instalar Node.js?**
R: No! Docker maneja todo automáticamente.

**P: ¿Cuánto tarda el despliegue?**
R: Primera vez: 5-10 minutos. Actualizaciones: 2-3 minutos.

**P: ¿Puedo ver el sitio durante el despliegue?**
R: Sí, pero puede estar caído brevemente durante la actualización.

**P: ¿Qué pasa con mis datos al actualizar?**
R: Los datos en la base de datos se mantienen. Solo se actualiza el código.

**P: ¿Cómo hago backup de la base de datos?**
R: 
```bash
cd ~/ChatPDF/deploy
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U chatpdf chatpdf > backup_$(date +%Y%m%d).sql
```

---

## 🎉 ¡Todo Listo!

Tu sitio ChatPDF está desplegado en **https://civer.online** con todas las mejoras UX implementadas.

**¿Necesitas ayuda?** Lee [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
