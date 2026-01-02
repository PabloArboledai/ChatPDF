# ChatPDF

Una aplicación web para chatear con archivos PDF con capacidad de delegar tareas al agente en la nube.

## Características

- 📄 **Carga de archivos PDF**: Sube tus documentos PDF para analizarlos
- 💬 **Interfaz de chat**: Interfaz amigable para interactuar con tus documentos
- ☁️ **Delegación al agente en la nube**: Delega tareas complejas a un agente en la nube
- ✅ **Confirmación de cambios**: Sistema de confirmación para aprobar o rechazar cambios pendientes

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/PabloArboledai/ChatPDF.git
cd ChatPDF
```

2. Instala las dependencias:
```bash
pip install -r requirements.txt
```

3. Ejecuta la aplicación:
```bash
python app.py
```

4. Abre tu navegador en `http://localhost:5000`

## Uso

### Subir un PDF
1. Haz clic en el botón "📁 Seleccionar PDF" en la barra lateral
2. Selecciona un archivo PDF de tu computadora
3. El archivo se cargará y estarás listo para chatear

### Delegar al Agente en la Nube
1. Haz clic en el botón "☁️ Delegar al Agente en la Nube"
2. Ingresa la tarea que deseas delegar (por ejemplo, "Analizar el contenido del PDF y generar un resumen")
3. La tarea se agregará a la lista de cambios pendientes

### Confirmar Cambios
1. Revisa los cambios pendientes en la sección "Cambios Pendientes"
2. Haz clic en "✓ Confirmar" para aprobar y ejecutar la delegación
3. O haz clic en "✗ Rechazar" para cancelar la tarea

## API Endpoints

### `POST /upload`
Sube un archivo PDF al servidor.

### `POST /api/chat`
Envía un mensaje de chat.

### `POST /api/delegate-to-cloud`
Crea una solicitud de delegación al agente en la nube.

### `POST /api/confirm-changes`
Confirma o rechaza cambios pendientes.

### `GET /api/pending-changes`
Obtiene la lista de cambios pendientes de confirmación.

## Tecnologías

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript vanilla
- **Estilos**: CSS moderno con gradientes y animaciones

## Licencia

MIT