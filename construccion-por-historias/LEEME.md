# Construcción de la app por historias de usuario

Material para reconstruir el Tablero Pan Trenza en el repositorio del equipo
(`jpablovlsqz16/Proyecto-de-aula-gerencia-`, estructura Frontend / Backend / Docs),
una historia de usuario por commit, del 27 al 29 de octubre de 2026.

| Carpeta | Contenido |
|---|---|
| `fuente/` | Código completo con marcadores `/*<HU-NN>*/` que indican en qué historia aparece cada parte |
| `generador.py` | Produce `etapas/HU-NN/` (repositorio después de cada historia) y `paquetes/HU-NN-…/` (archivos que agrega cada historia + COMMIT.txt) |
| `paquetes/` | Los 16 paquetes listos para subir en orden |
| `word/` | Word de historias de usuario (construcción desde cero) y su generador |
| `guias/` | Guías 1, 2 y 3 en HTML y PDF |

Regenerar: `python3 generador.py`. Verificado: las pruebas pasan en cada etapa (3 → 33) y cada etapa abre sin errores en el navegador.
