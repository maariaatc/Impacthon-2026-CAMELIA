# Antigravity | LocalFold Edition

---

## 1. Introducción

El conocimiento de la estructura tridimensional de una prote铆na es esencial en biolog铆a moderna: determina su funci贸n e impulsa el dise帽o de f谩rmacos. AlphaFold2 revolucion贸 este campo prediciendo estructuras con precisi贸n at贸mica en minutos; el supercomputador **CESGA FinisTerrae III** (GPUs A100, 80 GB VRAM) ofrece la infraestructura para ejecutarlo a escala.

El problema es el acceso. Utilizarlo exige dominar Linux, el gestor de colas **Slurm** (`sbatch`, `squeue`) e interpretar ficheros PDB y logs de error a mano, una barrera t茅cnica que excluye a la mayor铆a de investigadores biol贸gicos. La potencia de c谩lculo existe, pero falta el puente que la conecte con el usuario final.

**Antigravity** construye ese puente. Es una Single Page Application (SPA) desarrollada en **React + Vite** que act煤a como capa de abstracci贸n sobre el cl煤ster HPC: el investigador pega una secuencia FASTA y recibe en su navegador la estructura proteica en 3D, m茅tricas de confianza interpretadas y un an谩lisis asistido por IA. Toda la comunicaci贸n con el supercomputador 鈥攃onstrucci贸n del job Slurm, polling de estado, recuperaci贸n de ficheros y parseo de resultados鈥?ocurre de forma transparente en segundo plano.

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
| `npm run lint` | An谩isis est谩tico con ESLint |

> **Modo Academy:** funciona sin credenciales HPC, sirviendo resultados en cach茅 para las prote铆nas precargadas. Ideal para demos y entornos docentes.

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

## 5. Descripci贸n t茅cnica de los ficheros clave

### `src/App.jsx`
Componente ra铆z de la aplicaci贸n. Gestiona el estado global de navegaci贸n y renderiza condicionalmente las vistas seg煤n la secci贸n activa seleccionada en el `Sidebar`. Act煤a como enrutador ligero sin dependencia de React Router.

### `src/components/NewPredictionView.jsx` + `SubmissionForm.jsx`
Flujo completo de env铆o de una nueva predicci贸n. `SubmissionForm` usa **react-hook-form** con esquema de validaci贸n **Zod** para verificar el formato FASTA (cabecera, caracteres IUPAC, longitud) antes de llamar a la API. Si la validaci贸n pasa, construye el payload y lo env铆a al bridge del CESGA.

### `src/hooks/useJobStatus.js`
Custom hook que implementa el polling as铆ncrono al endpoint de estado del job. Consulta el estado cada N segundos, parsea la respuesta de Slurm (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`) y actualiza el estado local de React. Cuando el job termina, dispara la notificaci贸n del navegador v铆a `browserNotifications.js`.

### `src/components/JobStatusPanel.jsx` + `JobStatusLoader.jsx`
Interfaz visual del monitor de jobs. Transforma los estados cr铆pticos de Slurm en indicadores visuales claros con animaciones de progreso. `JobStatusLoader` maneja los estados de carga intermedios mientras el hook realiza el polling.

### `src/components/MolecularViewer.jsx`
Visor 3D interactivo de la estructura proteica. Consume el fichero PDB generado por AlphaFold2 y lo renderiza con soporte para rotaci贸n, zoom y selecci贸n de residuos. Aplica el coloreado est谩ndar por m茅trica **pLDDT** para identificar visualmente las regiones de alta y baja confianza:

| Color | pLDDT | Interpretaci贸n |
|---|---|---|
| 馃數 Azul oscuro | > 90 | Regi贸n muy fiable |
| 馃數 Azul claro | 70 鈥?90 | Fiable |
| 馃煛 Amarillo | 50 鈥?70 | Baja confianza |
| 馃煚 Naranja | < 50 | Regi贸n probablemente desordenada |

### `src/components/DrugScoreCard.jsx`
Analiza los datos de salida de AlphaFold2 y calcula m茅tricas de viabilidad farmacol贸gica: solubilidad estimada, estabilidad t茅rmica y toxicidad potencial, presentadas en formato sem谩foro visual. Permite evaluar de un vistazo si la prote铆na es candidata a estudios de *drug discovery*.

### `src/components/AIReport.jsx`
Genera un informe interpretado en lenguaje natural llamando a `aiService.js`. Env铆a las m茅tricas pLDDT, PAE y Bio-Score a la **Claude API**, que devuelve una explicaci贸n contextualizada de los resultados y sugerencias de validaci贸n experimental.

### `src/services/api.js`
Cliente HTTP centralizado que abstrae todas las llamadas al backend bridge del CESGA. Gestiona autenticaci贸n, construcci贸n de endpoints, manejo de errores y reintentos. Es el 煤nico punto de contacto entre el frontend y la infraestructura HPC.

### `src/services/syntheticStructure.js`
M贸dulo de parseo y generaci贸n de estructuras moleculares. Transforma los ficheros PDB devueltos por el cl煤ster en el formato que consume `MolecularViewer`. En modo Academy, genera estructuras en cach茅 para las prote铆nas precargadas sin necesidad de lanzar un job real.

### `src/styles/variables.css`
Define todos los tokens de dise帽o del sistema: paleta de colores, escala tipogr谩fica, espaciado y breakpoints. Centraliza la identidad visual de la aplicaci贸n.

---

## 6. Dependencias principales

| Paquete | Versi贸n | Uso |
|---|---|---|
| `react` + `react-dom` | 18.3 | Framework de UI |
| `vite` | 5.4 | Bundler y servidor de desarrollo |
| `react-hook-form` | 7.72 | Gesti贸n de formularios con validaci贸n |
| `zod` | 4.3 | Esquemas de validaci贸n de datos (FASTA) |
| `jspdf` + `jspdf-autotable` | 4.2 / 5.0 | Generaci贸n de informes PDF exportables |
| `lucide-react` | 1.8 | Iconograf铆a SVG del sistema de dise帽o |

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

Desarrollado en el contexto del **Impacthon 2026** organizado por la **C谩tedra CAMELIA / CiTIUS (Universidade de Santiago de Compostela)**.
Infraestructura HPC: **CESGA FinisTerrae III**.

> *"Tu c贸digo hoy. La herramienta de la ciencia ma帽ana."*
> 鈥?C谩tedra CAMELIA / USC
