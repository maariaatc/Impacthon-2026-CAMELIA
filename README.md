# Antigravity | LocalFold Edition

---

## 1. Introducción

El conocimiento de la estructura tridimensional de una proteína es esencial en biología moderna: determina su función e impulsa el diseño de fármacos. AlphaFold2 revolucionó este campo prediciendo estructuras con precisión atómica en minutos; el supercomputador **CESGA FinisTerrae III** (GPUs A100, 80 GB VRAM) ofrece la infraestructura para ejecutarlo a escala.

El problema es el acceso. Utilizarlo exige dominar Linux, el gestor de colas **Slurm** (`sbatch`, `squeue`) e interpretar ficheros PDB y logs de error a mano, una barrera técnica que excluye a la mayoría de investigadores biológicos. La potencia de cálculo existe, pero falta el puente que la conecte con el usuario final.

**Antigravity** construye ese puente. Es una Single Page Application (SPA) desarrollada en **React + Vite** que actúa como capa de abstracción sobre el clúster HPC: el investigador pega una secuencia FASTA y recibe en su navegador la estructura proteica en 3D, métricas de confianza interpretadas y un análisis asistido por IA. Toda la comunicación con el supercomputador - construcción del job Slurm, polling de estado, recuperación de ficheros y parseo de resultados - ocurre de forma transparente en segundo plano.

---
---

## 2. Propuesta de Valor

| Problema actual | Solución BioHack |
|---|---|
| Terminal Linux obligatoria | Interfaz web, cero comandos |
| Estados Slurm crípticos (`PD`, `R`, `CG`) | Monitor visual en tiempo real: `PENDIENTE → EJECUTANDO → COMPLETADO` |
| Ficheros PDB ilegibles sin formación | Visor 3D interactivo con coloreado pLDDT automático |
| Resultados sin interpretación | Traductor IA (LLM) que explica métricas en lenguaje natural |
| Solo proteínas precomputadas (AlphaFold DB) | Envío de secuencias propias al clúster real |

> **PROPUESTA ÚNICA:** El único portal que lleva a un biólogo de secuencia a *insight* en minutos, sin abrir una terminal.

---

## 3. Inicio rápido

### Requisitos previos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 18+ |
| npm | 9+ |
| Git | 2.0+ |

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/antigravity.git
cd antigravity

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con las credenciales CESGA y la API key de Claude

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR (Vite) |
| `npm run build` | Compilación optimizada para producción |
| `npm run preview` | Previsualización del build de producción |
| `npm run lint` | Anáisis estático con ESLint |

> **Modo Academy:** funciona sin credenciales HPC, sirviendo resultados en caché para las proteínas precargadas. Ideal para demos y entornos docentes.

---

## 4. Estructura del proyecto

```
.
|-- index.html                      # Punto de entrada HTML
|-- package.json                    # Dependencias y scripts npm
|-- vite.config.js                  # Configuracion del bundler Vite
|-- .env.example                    # Plantilla de variables de entorno
|-- src/
    |-- main.jsx                    # Bootstrap de React (ReactDOM.render)
    |-- App.jsx                     # Componente raiz y enrutado de vistas
    |-- App.css                     # Estilos globales de la aplicacion
    |-- index.css                   # Reset CSS base
    |
    |-- components/
    |   |-- Sidebar.jsx             # Navegacion lateral principal
    |   |-- Dashboard.jsx           # Vista de inicio con resumen general
    |   |-- NewPredictionView.jsx   # Formulario de nueva prediccion (FASTA)
    |   |-- SubmissionForm.jsx      # Logica del formulario con validacion Zod
    |   |-- JobStatusPanel.jsx      # Panel de estado del job Slurm en tiempo real
    |   |-- JobStatusLoader.jsx     # Componente de carga/polling del job
    |   |-- MolecularViewer.jsx     # Visor 3D interactivo de la proteina
    |   |-- ProteinStatsCard.jsx    # Estadisticas basicas de la secuencia
    |   |-- DrugScoreCard.jsx       # Bio-Score Card: solubilidad, toxicidad, estabilidad
    |   |-- AIReport.jsx            # Informe generado por IA (Claude) sobre resultados
    |   |-- DownloadPanel.jsx       # Exportacion de resultados (PDB, JSON, PDF)
    |   |-- HistorialView.jsx       # Historial de predicciones anteriores
    |   |-- EjecucionesView.jsx     # Monitor de jobs activos en el cluster
    |   |-- InfoPublicaView.jsx     # Biblioteca de proteinas precargadas (modo Academy)
    |   |-- InstruccionesView.jsx   # Guia de uso para el investigador
    |   |-- Toast.jsx               # Notificaciones emergentes de estado
    |
    |-- hooks/
    |   |-- useJobStatus.js         # Hook de polling asincrono al estado Slurm
    |
    |-- services/
    |   |-- api.js                  # Cliente HTTP hacia la API bridge del CESGA
    |   |-- aiService.js            # Integracion con Claude API (Anthropic)
    |   |-- browserNotifications.js # Notificaciones del navegador al completar job
    |   |-- syntheticStructure.js   # Parseo y generacion de estructuras PDB
    |
    |-- styles/
        |-- main.css                # Estilos principales por componente
        |-- variables.css           # Tokens de diseno (colores, tipografia, espaciado)
```
---

## 5. Descripción técnica de los ficheros clave

### `src/App.jsx`
Componente raíz de la aplicación. Gestiona el estado global de navegación y renderiza condicionalmente las vistas según la sección activa seleccionada en el `Sidebar`. Actúa como enrutador ligero sin dependencia de React Router.

### `src/components/NewPredictionView.jsx` + `SubmissionForm.jsx`
Flujo completo de envío de una nueva predicción. `SubmissionForm` usa **react-hook-form** con esquema de validación **Zod** para verificar el formato FASTA (cabecera, caracteres IUPAC, longitud) antes de llamar a la API. Si la validación pasa, construye el payload y lo envía al bridge del CESGA.

### `src/hooks/useJobStatus.js`
Custom hook que implementa el polling asíncrono al endpoint de estado del job. Consulta el estado cada N segundos, parsea la respuesta de Slurm (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`) y actualiza el estado local de React. Cuando el job termina, dispara la notificación del navegador vía `browserNotifications.js`.

### `src/components/JobStatusPanel.jsx` + `JobStatusLoader.jsx`
Interfaz visual del monitor de jobs. Transforma los estados crípticos de Slurm en indicadores visuales claros con animaciones de progreso. `JobStatusLoader` maneja los estados de carga intermedios mientras el hook realiza el polling.

### `src/components/MolecularViewer.jsx`
Visor 3D interactivo de la estructura proteica. Consume el fichero PDB generado por AlphaFold2 y lo renderiza con soporte para rotación, zoom y selección de residuos. Aplica el coloreado estándar por métrica **pLDDT** para identificar visualmente las regiones de alta y baja confianza:

| Color | pLDDT | Interpretación |
|---|---|---|
| -> Azul oscuro | > 90 | Región muy fiable |
| -> Azul claro | 70 - 90 | Fiable |
| -> Amarillo | 50 - 70 | Baja confianza |
| -> Naranja | < 50 | Región probablemente desordenada |

### `src/components/DrugScoreCard.jsx`
Analiza los datos de salida de AlphaFold2 y calcula métricas de viabilidad farmacológica: solubilidad estimada, estabilidad térmica y toxicidad potencial, presentadas en formato semáforo visual. Permite evaluar de un vistazo si la proteína es candidata a estudios de *drug discovery*.

### `src/components/AIReport.jsx`
Genera un informe interpretado en lenguaje natural llamando a `aiService.js`. Envía las métricas pLDDT, PAE y Bio-Score a la **Claude API**, que devuelve una explicación contextualizada de los resultados y sugerencias de validación experimental.

### `src/services/api.js`
Cliente HTTP centralizado que abstrae todas las llamadas al backend bridge del CESGA. Gestiona autenticación, construcción de endpoints, manejo de errores y reintentos. Es el único punto de contacto entre el frontend y la infraestructura HPC.

### `src/services/syntheticStructure.js`
Módulo de parseo y generación de estructuras moleculares. Transforma los ficheros PDB devueltos por el clúster en el formato que consume `MolecularViewer`. En modo Academy, genera estructuras en caché para las proteínas precargadas sin necesidad de lanzar un job real.

### `src/styles/variables.css`
Define todos los tokens de diseño del sistema: paleta de colores, escala tipográfica, espaciado y breakpoints. Centraliza la identidad visual de la aplicación.

---

## 6. Dependencias principales

| Paquete | Versión | Uso |
|---|---|---|
| `react` + `react-dom` | 18.3 | Framework de UI |
| `vite` | 5.4 | Bundler y servidor de desarrollo |
| `react-hook-form` | 7.72 | Gestión de formularios con validación |
| `zod` | 4.3 | Esquemas de validación de datos (FASTA) |
| `jspdf` + `jspdf-autotable` | 4.2 / 5.0 | Generación de informes PDF exportables |
| `lucide-react` | 1.8 | Iconografía SVG del sistema de diseño |

---

---

## 7. Métricas Clave

| Métrica | Descripción |
|---|---|
| Jobs/día | Secuencias enviadas al clúster |
| Tiempo al 3D | Desde pegado del FASTA hasta visor interactivo |
| Tasa de retención | Biólogos que repiten uso |
| % autonomía | Usuarios que completan el flujo sin asistencia |
| GPU-hours ahorradas | Hits en caché Academy vs jobs reales lanzados |

---


## 8. Equipo

Desarrollado en el contexto del **Impacthon 2026** organizado por la **Cátedra CAMELIA / CiTIUS (Universidade de Santiago de Compostela)**.
Infraestructura HPC: **CESGA FinisTerrae III**.

> *"Tu código hoy. La herramienta de la ciencia mañana."*
> - Cátedra CAMELIA / USC
