# Impacthon-2026-CAMELIA

# IMPACTHON 2026

Bienvenidos al repositorio oficial. Para mantener el orden y evitar conflictos de código (merge conflicts), seguiremos estas reglas de colaboración:

## 📂 Estructura de Ramas
- main: Es la rama general donde reside el proyecto. NO se debe trabajar directamente sobre esta rama.
- Ramas Personales: Cada colaborador tiene su propia rama de desarrollo. 

## 🛠️ Cómo interactuar con el Repositorio

### 1. Clonar el proyecto (SOLO LA PRIMERA VEZ)
En bash realizas lo siguiente:
git clone [https://github.com/usuario/nombre-del-repo.git](https://github.com/usuario/nombre-del-repo.git) (EJEMPLO, NO ES ESTA URL)
Creación de tu propia rama de trabajo (siguiente comando en bash): git checkout -b nombreDeTuRama
Para subir cambios a tu rama: git add .
							  git commit -m "Explicación breve de lo que hiciste"
							  git push origin nombreDeTuRama
							  
### 2. Integrar cambios a la General (Main)
1	Ir a la web de GitHub.
2	Hacer un Pull Request (PR) desde tu rama hacia main.
3	Esperar a que otro compañero revise que no hay errores antes de confirmar el "Merge".

### OJO A LAS SIGUIENTES COSAS:
Sincroniza siempre: Antes de empezar a trabajar, haz un git pull de la rama main para tener lo último que hayan subido tus compañeros.
Privacidad: Trabaja siempre en tu rama. Si necesitas algo de la rama de un compañero, pídele permiso antes de tocarla.

Para evitar conflictos graves, **actualizar tu rama personal con los cambios de main** al menos una vez al día usando:
1. `git checkout main`
2. `git pull origin main`
3. `git checkout dev-tu-nombre`
4. `git merge main` (Esto trae lo que otros han hecho a tu rama para que no te quedes atrás).
