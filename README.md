# Interlinear Translator Pro 📚✨

![Banner o Captura Principal](https://via.placeholder.com/800x200?text=Interlinear+Translator+Pro+Banner)
*(Reemplaza este enlace con una imagen o GIF de tu plugin en acción)*

**Interlinear Translator Pro** es un asistente de lectura bilingüe para Obsidian. A diferencia de los traductores tradicionales que reemplazan el texto, este plugin **añade la traducción línea por línea** debajo de tu texto original, permitiéndote aprender idiomas, comparar estructuras y leer sin perder el contexto original.

Ideal para estudiantes de idiomas, traductores y lectura de textos complejos.

## ✨ Características Principales

* **🔍 Traducción Interlineal:** Visualiza la traducción justo debajo de cada párrafo original.
* **🧠 Modo Híbrido Inteligente:**
    * **Nube (Google Translate):** Rápido, ligero y para cualquier idioma.
    * **Local (Ollama AI):** Privacidad total, sin internet y con la potencia de LLMs (Llama 3, Mistral, Gemma).
* **💾 Memoria Persistente:** Las traducciones se guardan en tu nota. Si cierras Obsidian, siguen ahí.
* **🎨 Estilos Personalizables:** Diferenciación visual clara entre el texto original y la traducción.
* **⚡ Caché Inteligente:** No vuelve a traducir lo que ya ha traducido para ahorrar recursos.

---

## 💻 Requisitos del Sistema

El plugin es muy ligero, pero si decides usar el **Modo Local (Ollama)**, tu PC necesitará cumplir ciertos requisitos.

### Para uso con Google Translate (Nube)
* **Procesador:** Cualquiera.
* **RAM:** Mínimo 4GB.
* **Internet:** Conexión activa requerida.

### Para uso con Ollama (IA Local) 🏠
Este modo ejecuta un modelo de inteligencia artificial en tu propio ordenador.
* **Procesador:** Se recomienda un procesador moderno (Intel i5/Ryzen 5 o superior).
* **RAM:**
    * Mínimo: **8 GB** (para modelos pequeños como `gemma:2b` o `qwen:4b`).
    * Recomendado: **16 GB** o más (para modelos estándar como `llama3` o `mistral`).
* **Espacio en Disco:** Al menos **10 GB** libres para descargar los modelos de IA.
* **GPU (Gráfica):** No es obligatoria, pero una tarjeta NVIDIA acelerará mucho la traducción.

---

## ⚙️ Instalación y Configuración

### 1. Instalación del Plugin
1.  Abre Obsidian > **Settings** > **Community Plugins**.
2.  Desactiva el "Safe Mode".
3.  Busca `Interlinear Translator Pro`.
4.  Dale a **Install** y luego a **Enable**.

### 2. Configuración del Proveedor de Traducción

Ve a las opciones del plugin para elegir tu motor:

#### 🅰️ Opción A: Google Translate (Fácil y Rápido)
1.  Selecciona **Google Translate** en el desplegable.
2.  Introduce tu **Google Cloud Translation API Key**.
    * *Nota: Si no tienes una, debes crear un proyecto en Google Cloud Platform y habilitar la "Cloud Translation API".*

#### 🅱️ Opción B: Ollama (Privado y Offline)
Para usar IA local, necesitas instalar Ollama en tu equipo:

1.  **Descargar Ollama:** Ve a [ollama.com](https://ollama.com) y descarga el instalador para Windows, Mac o Linux.
2.  **Instalar un Modelo:** Abre tu terminal (CMD o PowerShell) y escribe:
    ```bash
    ollama run mistral
    ```
    *(Puedes usar `llama3`, `gemma`, etc. Asegúrate de que termine de descargarse).*
3.  **Conectar con Obsidian:**
    * En la configuración del plugin, selecciona **Ollama**.
    * **Ollama URL:** Normalmente es `http://127.0.0.1:11434` (viene por defecto).
    * **Model Name:** Escribe el nombre exacto del modelo que descargaste (ej: `mistral` o `llama3`).

---

## 🚀 Cómo Usar

![GIF demostrativo](https://via.placeholder.com/600x300?text=GIF+Demostrativo)

1.  Abre cualquier nota en Obsidian.
2.  **Selecciona el texto** que quieres traducir.
3.  Abre la paleta de comandos (`Ctrl + P` o `Cmd + P`).
4.  Busca y ejecuta: `Interlinear Translator: Traducir selección`.
5.  ¡Listo! La traducción aparecerá debajo del texto.

> **Tip:** Puedes asignar un atajo de teclado (Hotkeys) a este comando para traducir más rápido.

---

## 🎨 Personalización (CSS)

El plugin añade clases CSS para que puedas personalizar el aspecto.
* `.interlinear-original`: El texto original.
* `.interlinear-translation`: El texto traducido.

Puedes modificar `styles.css` o usar un snippet de Obsidian para cambiar colores, cursivas o márgenes.

---

## ❓ Preguntas Frecuentes (FAQ)

**¿Por qué Ollama va lento?**
La velocidad depende totalmente de la potencia de tu ordenador. Si no tienes tarjeta gráfica dedicada, la CPU hará todo el trabajo, lo cual es más lento pero funciona.

**¿Necesito pagar por la API de Google?**
Google ofrece una cuota gratuita mensual generosa, pero requiere configurar una cuenta de facturación en Google Cloud.

**¿Puedo traducir una nota entera?**
Sí, selecciona todo el texto (`Ctrl + A`) y ejecuta el comando. Ten en cuenta que con Ollama esto puede tardar unos minutos.

---

## ❤️ Contribuir

Si encuentras errores o tienes ideas para mejorar el plugin:
1.  Abre un [Issue](https://github.com/AdriHL/obsidian-traductor-interlineal/issues) en GitHub.
2.  Haz un Fork y envía un Pull Request.

**Creado por [AdriHL](https://github.com/AdriHL)**
Licencia MITg