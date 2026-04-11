# BIOHACK

> **Democratizando el acceso a la supercomputación: del código FASTA a la estructura 3D en un solo paso.**

---

## 1. Introducción

El conocimiento de la estructura tridimensional de una proteína es esencial en biología moderna: determina su función e impulsa el diseño de fármacos. AlphaFold2 revolucionó este campo prediciendo estructuras con precisión atómica en minutos; el supercomputador **CESGA FinisTerrae III** (GPUs A100, 80 GB VRAM) ofrece la infraestructura para ejecutarlo a escala. El problema es el acceso: utilizarlo exige dominar Linux, el gestor de colas **Slurm** (`sbatch`, `squeue`) y descifrar ficheros PDB y logs de error a mano, una barrera que excluye a la mayoría de investigadores biológicos.

**Antigravity** elimina esa barrera. Es una Single Page Application (SPA) que actúa como capa de abstracción sobre el clúster: el usuario pega una secuencia FASTA y recibe, en su navegador, la estructura 3D interactiva y un análisis completo. Toda la comunicación con el HPC —autenticación SSH, construcción del script de job, polling de Slurm, recuperación de ficheros y parseo de resultados— ocurre de forma transparente en segundo plano.

---

## 2. Propuesta de Valor

| Problema actual | Solución Antigravity |
|---|---|
| Terminal Linux obligatoria | Interfaz web, cero comandos |
| Estados Slurm crípticos (`PD`, `R`, `CG`) | Monitor visual en tiempo real: `PENDIENTE → EJECUTANDO → COMPLETADO` |
| Ficheros PDB ilegibles sin formación | Visor 3D interactivo con coloreado pLDDT automático |
| Resultados sin interpretación | Traductor IA (LLM) que explica métricas en lenguaje natural |
| Solo proteínas precomputadas (AlphaFold DB) | Envío de secuencias propias al clúster real |

> **PROPUESTA ÚNICA:** El único portal que lleva a un biólogo de secuencia a *insight* en minutos, sin abrir una terminal.

---

## 3. Características Técnicas

### Gestión de Experimentos y Jobs HPC

- **Wizard de envío con validación pre-vuelo:** antes de lanzar el job, Antigravity valida el formato FASTA (cabecera, caracteres IUPAC, longitud máxima) y comprueba la disponibilidad de GPUs y RAM en el clúster, evitando errores en cola.
- **Constructor de script Slurm dinámico:** genera automáticamente el `#SBATCH` con los parámetros óptimos (`--gres=gpu:a100`, `--mem`, `--time`) según la longitud de la secuencia.
- **JobMonitor asíncrono (polling):** consulta el estado del job vía API cada N segundos sin bloquear la UI; parsea la salida de `squeue` y `sacct` y emite eventos de estado al frontend.
- **Logs legibles:** el sistema intercepta los ficheros `.out` y `.err` de Slurm y los traduce a mensajes de error comprensibles, marcando la línea y el módulo que falló.
- **Historial persistente:** panel con el hilo completo de ejecuciones del usuario, incluyendo tiempos de cómputo, GPU hours consumidas y enlace directo a cada resultado.

### 🧬 Visualización Científica Avanzada

- **Visor 3D interactivo (Mol\*):** renderizado de la estructura proteica con soporte para rotación, zoom, selección de residuos y cambio de representación (cartoon, superficie, esferas).
- **Coloreado pLDDT dinámico:** mapeo automático de la métrica de confianza por residuo sobre la estructura 3D. Escala de color estándar:
  - 🔵 Azul oscuro (`pLDDT > 90`): región muy fiable
  - 🔵 Azul claro (`70–90`): fiable
  - 🟡 Amarillo (`50–70`): baja confianza
  - 🟠 Naranja (`< 50`): región probablemente desordenada
- **Anotaciones de residuos:** el investigador puede añadir notas numeradas sobre residuos concretos de la estructura, generando un registro científico exportable junto al PDB.
- **Biblioteca Academy (22 proteínas):** proteínas precargadas en caché (actina, ubiquitina, GFP, hemoglobina…) para demostración y docencia sin necesidad de lanzar jobs reales.

### Análisis e Inteligencia de Resultados

- **Bio-Score Card:** análisis automático post-procesado que evalúa solubilidad, estabilidad térmica y toxicidad potencial, presentados en formato semáforo visual.
- **Traductor IA (LLM integrado):** un asistente de lenguaje natural (Claude API) explica en contexto las métricas pLDDT y PAE, interpreta regiones críticas y sugiere pasos de validación experimental.
- **Exportación multiformato:** descarga del fichero `.pdb`, `.mmCIF`, JSON de confianza por residuo, y generación de informe PDF con la captura del visor y las métricas calculadas.

---

## 4. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React (SPA) + Vite |
| Visualización 3D | Mol* (RCSB) |
| Comunicación HPC | API Bridge → CESGA FinisTerrae III (Slurm REST API / SSH) |
| IA / Traductor | Claude API (Anthropic) |
| Hosting | Vercel (tier gratuito, CD automático desde GitHub) |
| Formatos de salida | `.pdb`, `.mmCIF`, `.json`, `.pdf` |

---

## 5. Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/antigravity.git
cd antigravity

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# → Editar .env con las credenciales CESGA y la API key de Claude

# 4. Iniciar servidor de desarrollo
npm run dev
```

> El modo **LocalFold / Academy** funciona sin credenciales HPC, sirviendo resultados en caché para las 22 proteínas precargadas. Ideal para demos y entornos docentes.

---

## 6. Métricas Clave

| Métrica | Descripción |
|---|---|
| Jobs/día | Secuencias enviadas al clúster |
| Tiempo al 3D | Desde pegado del FASTA hasta visor interactivo |
| Tasa de retención | Biólogos que repiten uso |
| % autonomía | Usuarios que completan el flujo sin asistencia |
| GPU-hours ahorradas | Hits en caché Academy vs jobs reales lanzados |

---

## 7. Créditos y Contexto Institucional

Desarrollado en el contexto de la **Cátedra CAMELIA / CiTIUS (Universidade de Santiago de Compostela)**.  
Infraestructura HPC: **CESGA FinisTerrae III**.

> *"Tu código hoy. La herramienta de la ciencia mañana."*  
> — Cátedra CAMELIA / USC