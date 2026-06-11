# NEUMO-AI: Sistema de Detección Asistida de Neumonía

Clínica Los Andes - Unidad de Radiología e Imagenología Diagnóstica
Desarrollo a la Medida - Informática Médica (Semestre 2026-1)

NEUMO-AI es una aplicación web monolítica integrada con un modelo de Inteligencia Artificial (Deep Learning) diseñado para clasificar radiografías de tórax en dos categorías: **NORMAL** o **NEUMONÍA**. Su objetivo principal es reducir el tiempo de diagnóstico preliminar de horas a menos de 30 segundos, apoyando al personal médico y mitigando la fatiga diagnóstica.

---

## 🚀 Requisitos Previos

- **Node.js**: v24.16.0 (recomendado) o superior.
- **pnpm**: Administrador de paquetes de Node.js.
- **Python**: v3.9+ (con `venv` y soporte para instalar `tensorflow`, `h5py`, `numpy` y `Pillow`).

---

## 🛠️ Estructura del Proyecto

```
lotu/
├── client/                  # Frontend en React + Vite + TypeScript (Puerto 5173)
├── server/                  # Backend en Flask + SQLite (Puerto 5001)
├── neumo_ai_mobilenetv2.h5  # Modelo clasificador pre-entrenado (MobileNetV2)
├── neumo_ai_mean.npy        # Constante de normalización (Media)
├── neumo_ai_std.npy         # Constante de normalización (Desviación Estándar)
└── README.md                # Instrucciones de configuración
```

---

## 🖥️ Configuración del Backend (Servidor Flask)

1. Diríjase a la carpeta del servidor:
   ```bash
   cd server
   ```

2. Cree un entorno virtual de Python:
   ```bash
   python3 -m venv .venv
   ```

3. Active el entorno virtual:
   - **macOS / Linux:**
     ```bash
     source .venv/bin/activate
     ```
   - **Windows:**
     ```cmd
     .venv\Scripts\activate
     ```

4. Instale las dependencias necesarias:
   ```bash
   pip install -r requirements.txt
   ```

5. Inicie el servidor de desarrollo:
   ```bash
   python app.py
   ```
   *El servidor se ejecutará en: `http://localhost:5001` y creará automáticamente la base de datos SQLite `neumo_ai.db` si no existe.*

---

## 🎨 Configuración del Frontend (React + Vite)

1. Abra una nueva terminal y diríjase a la carpeta del cliente:
   ```bash
   cd client
   ```

2. Instale las dependencias del proyecto usando **pnpm**:
   ```bash
   pnpm install
   ```

3. Inicie el servidor de desarrollo de Vite:
   ```bash
   pnpm run dev
   ```
   *La aplicación estará accesible en: `http://localhost:5173`.*

---

## 🤖 Integración del Modelo de IA

El sistema utiliza un pipeline de preprocesamiento matemático para garantizar que la radiografía se cargue con el formato correcto requerido por el clasificador binario:
1. **Redimensionamiento:** La imagen se redimensiona automáticamente a una resolución de **224x224 píxeles** con 3 canales de color (RGB).
2. **Normalización:** Los píxeles de la imagen se normalizan utilizando la media y desviación estándar de entrenamiento:
   $$\text{Imagen Normalizada} = \frac{\text{Imagen Original} - 122.88847}{60.521103}$$
3. **Inferencia:** El modelo MobileNetV2 predice un valor probabilístico. Un umbral de `0.5` determina la clasificación final:
   - Probabilidad $> 0.5$ $\rightarrow$ **NEUMONÍA** (Confianza: $\text{probabilidad} \times 100$)
   - Probabilidad $\le 0.5$ $\rightarrow$ **NORMAL** (Confianza: $(1 - \text{probabilidad}) \times 100$)

---

## 🔒 Base de Datos y Trazabilidad

El sistema utiliza **SQLite** para el almacenamiento local de diagnósticos con fines de auditoría (RF-05). La tabla `diagnoses` almacena:
- Datos del paciente (nombres, apellidos, identificación única, edad, sexo).
- Síntomas y descripción adicionales.
- Resultado predictivo de la IA (NORMAL o NEUMONÍA) con el porcentaje de certeza.
- Nombre del archivo de imagen analizada.
- Fecha y hora del registro (`created_at`).
