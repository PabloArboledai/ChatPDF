.PHONY: gui

# Ejecuta la GUI local (requiere dependencias instaladas en .venv)

gui:
	/workspaces/ChatPDF/.venv/bin/python -m streamlit run app.py
