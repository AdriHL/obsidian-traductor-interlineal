# Interlinear Translator Pro 📚✨

![Banner o Captura Principal](https://via.placeholder.com/800x200?text=Interlinear+Translator+Pro+Banner)


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
# 🚀 Quick Start Guide: Interlinear Translator Pro
This guide covers everything you need to know to master the plugin in 60 seconds.

## 1. No Configuration Mode (Default)
If you just want to see the plugin in action, you don't need to configure anything beforehand.

By default, the plugin is ready to process text using a basic internal logic or cached translations if available.

You can install it and run the command immediately to see the interface.
![Basic](https://github.com/user-attachments/assets/b512e171-fa09-49f9-aa30-644bdc9c8fb9)

# 🎬 Demo

![Obsidian_kwyriMa8Lw](https://github.com/user-attachments/assets/679d403b-9d59-4316-8bdc-a140236cc5b3)

## 2. Advanced Setup (Translation Engines)
To get actual translations, you must choose one of these two paths in the Plugin Settings:

**☁️ Option A**: Google Translate (Fastest)
Best for: High speed and support for 100+ languages.

Go to Settings > Interlinear Translator Pro.

Select Google Translate as the provider.

Paste your Google Cloud API Key.

Tip: You can get this key from the Google Cloud Console under "Credentials".

![API](https://github.com/user-attachments/assets/77b22f57-e802-458d-be67-72378460fbfc)

**🏠 Option B**: Ollama (100% Private & Offline)
Best for: Privacy and users with powerful computers.

Install Ollama from ollama.com.

Open your terminal and download a model (e.g., ollama pull mistral).

In Obsidian Settings, select Ollama as the provider.

Ensure the Model Name matches exactly (e.g., mistral).

![IA](https://github.com/user-attachments/assets/dd20e401-514b-42bf-8249-d902eb6dc1f9)

# 3. Technical Requirements
To ensure the plugin runs smoothly, check your hardware:

Standard Mode (Google Cloud):

Any PC/Mac with an internet connection.

Low RAM usage.

AI Mode (Ollama):

RAM: 8GB (Minimum) | 16GB (Recommended).

GPU: An NVIDIA graphics card will make translations up to 10x faster.

Disk Space: 4GB to 10GB for storing AI models.

# 4. How to Use (The "Master" Workflow)
Control the plugin like a pro with these steps:

Highlight: Select any text in your note.

Execute: Press Ctrl + P (or Cmd + P) and type: Interlinear Translator: Translate selection.

Enjoy: The translation appears instantly below the original lines.

Persistent: Feel free to close the note; the translations are saved and will be there when you return.
