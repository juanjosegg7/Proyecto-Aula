"""Genera, a partir de fuente/, una copia del repositorio por etapa (HU-01 … HU-16) y un paquete por historia.

Marcadores en el código fuente (se eliminan en la salida):
  JS/CSS:  /*<HU-07>*/ … /*</HU-07>*/          incluye el bloque desde la HU-07
           /*<hasta HU-06>*/ … /*</hasta HU-06>*/ incluye el bloque solo antes de la HU-06
  HTML/MD: <!--<HU-07>--> … <!--</HU-07>-->     (igual)

Salida:
  etapas/HU-NN/      repositorio completo tal como queda después de la HU-NN
  paquetes/HU-NN-…/  solo los archivos que la HU-NN crea o cambia, más COMMIT.txt
"""
import filecmp
import os
import re
import shutil
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
FUENTE = os.path.join(BASE, "fuente")
ETAPAS = os.path.join(BASE, "etapas")
PAQUETES = os.path.join(BASE, "paquetes")

IVAN = "Iván Santiago"
JJ = "Juan José"
MC = "María Camila"

# (número, slug, responsable, fecha, sprint, mensaje de commit, archivos que aparecen en esta HU)
HISTORIAS = [
    (1, "estructura-y-arquitectura", IVAN, "2026-10-27", 2,
     "feat(HU-01): estructura de la app, navegación y base de publicación en Apps Script",
     ["README.md", "Frontend/index.html", "Frontend/css/styles.css", "Frontend/js/app.js",
      "Backend/Code.gs", "Backend/appsscript.json", "Backend/construir_index.py",
      "Docs/Arquitectura.md", "Docs/Decisiones_Tecnicas.md"]),
    (2, "plantilla-y-diccionario", JJ, "2026-10-27", 2,
     "feat(HU-02): plantilla de Excel y diccionario de datos",
     ["Frontend/datos/Base_Panaderia_Indicadores_plantilla.xlsx", "Docs/Diccionario_Datos.md"]),
    (3, "datos-simulados", MC, "2026-10-27", 2,
     "feat(HU-03): simulación de Montecarlo de septiembre de 2026",
     ["Simulacion/simular_datos.py", "Simulacion/exportar_ejemplo.py",
      "Frontend/datos/Base_Panaderia_Indicadores_2026-09.xlsx", "Frontend/datos/ejemplo-panaderia.js"]),
    (4, "leer-excel", JJ, "2026-10-27", 2,
     "feat(HU-04): leer el libro de Excel en el navegador",
     ["Frontend/vendor/xlsx.full.min.js", "Frontend/js/lectura.js", "Tests/lectura.test.js", "package.json"]),
    (5, "reconocer-y-validar-tablas", IVAN, "2026-10-27", 2,
     "feat(HU-05): reconocer las tablas por sus columnas y validar filas",
     ["Frontend/js/modelo.js", "Tests/comun.js", "Tests/datos-base-oee-curso.js", "Tests/modelo.test.js"]),
    (6, "oee-horno-prototipo-v0", IVAN, "2026-10-27", 2,
     "feat(HU-06): OEE del horno — prototipo v0 publicado en Apps Script",
     ["Frontend/js/indicadores.js", "Tests/oee.test.js", "Backend/Index.html"]),
    (7, "sla-pedidos", JJ, "2026-10-28", 3,
     "feat(HU-07): SLA de pedidos (OTIF)", ["Tests/sla.test.js"]),
    (8, "porcentaje-no-vendido", JJ, "2026-10-28", 3,
     "feat(HU-08): % de producto no vendido", ["Tests/no-vendido.test.js"]),
    (9, "productividad-mano-obra", JJ, "2026-10-28", 3,
     "feat(HU-09): productividad de mano de obra", ["Tests/productividad.test.js"]),
    (10, "semaforos-y-metas", JJ, "2026-10-28", 3,
     "feat(HU-10): semáforos y metas de las fichas técnicas", ["Tests/semaforo.test.js"]),
    (11, "filtros", IVAN, "2026-10-28", 3,
     "feat(HU-11): filtros por fechas, turno y equipo", ["Tests/filtros.test.js"]),
    (12, "graficos", IVAN, "2026-10-29", 3,
     "feat(HU-12): gráficos del tablero", ["Frontend/vendor/chart.umd.min.js", "Tests/graficos.test.js"]),
    (13, "hallazgos", JJ, "2026-10-29", 3,
     "feat(HU-13): hallazgos automáticos", []),
    (14, "exportar-e-imprimir", JJ, "2026-10-29", 3,
     "feat(HU-14): exportar CSV e imprimir el tablero", []),
    (15, "pruebas-archivo-distinto", MC, "2026-10-29", 3,
     "test(HU-15): plan de pruebas y verificación con un archivo distinto (octubre)",
     ["Simulacion/Base_Panaderia_Indicadores_2026-10.xlsx", "Tests/archivo-distinto.test.js", "Docs/Plan_Pruebas.md"]),
    (16, "prototipo-final", IVAN, "2026-10-29", 3,
     "feat(HU-16): prototipo final publicado en Apps Script y GitHub Pages; manual de usuario",
     ["index.html", "Docs/Manual_Usuario.md", "Backend/Index.html"]),
]
GENERADOS = {"Backend/Index.html"}          # se producen con Backend/construir_index.py
REGENERAR_EN = {6, 16}                      # etapas en que se vuelve a generar Index.html

TEXTO = (".js", ".html", ".css", ".md", ".py", ".json", ".gs")
MARCA = r"(?:/\*<(/?)(hasta )?HU-(\d\d)>\*/|<!--<(/?)(hasta )?HU-(\d\d)>-->)"
PATRON = re.compile(r"^[ \t]*" + MARCA + r"[ \t]*\n|" + MARCA, re.M)


def procesar(texto, etapa, nombre):
    salida, pila, pos = [], [], 0
    activo = lambda: all(c for _, c in pila)
    for m in PATRON.finditer(texto):
        if activo():
            salida.append(texto[pos:m.start()])
        pos = m.end()
        g = m.groups()
        cierre, hasta, num = (g[0], g[1], g[2]) if g[2] else (g[3], g[4], g[5]) if g[5] else \
            (g[6], g[7], g[8]) if g[8] else (g[9], g[10], g[11])
        clave = ("hasta " if hasta else "") + "HU-" + num
        if cierre:
            if not pila or pila[-1][0] != clave:
                sys.exit("%s: cierre %s sin apertura (pila %s)" % (nombre, clave, pila))
            pila.pop()
        else:
            pila.append((clave, etapa < int(num) if hasta else etapa >= int(num)))
    if pila:
        sys.exit("%s: marcadores sin cerrar %s" % (nombre, pila))
    if activo():
        salida.append(texto[pos:])
    return "".join(salida)


def construir_etapa(n):
    destino = os.path.join(ETAPAS, "HU-%02d" % n)
    anterior = os.path.join(ETAPAS, "HU-%02d" % (n - 1))
    shutil.rmtree(destino, ignore_errors=True)
    os.makedirs(destino)
    # Index.html generado en etapas anteriores se conserva tal cual (es lo que quedó en el repositorio).
    if n > 1 and os.path.exists(os.path.join(anterior, "Backend/Index.html")):
        os.makedirs(os.path.join(destino, "Backend"), exist_ok=True)
        shutil.copy2(os.path.join(anterior, "Backend/Index.html"), os.path.join(destino, "Backend/Index.html"))
    for h in HISTORIAS:
        if h[0] > n:
            break
        for ruta in h[6]:
            if ruta in GENERADOS:
                continue
            src, dst = os.path.join(FUENTE, ruta), os.path.join(destino, ruta)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            if ruta.endswith(TEXTO) and "/vendor/" not in ruta:
                with open(src, encoding="utf-8") as f:
                    out = procesar(f.read(), n, ruta)
                if re.search(MARCA, out):
                    sys.exit("%s: quedaron marcadores" % ruta)
                with open(dst, "w", encoding="utf-8", newline="") as f:
                    f.write(out)
            else:
                shutil.copy2(src, dst)
    if n in REGENERAR_EN:
        subprocess.run([sys.executable, os.path.join(destino, "Backend/construir_index.py")], check=True,
                       stdout=subprocess.DEVNULL)
    return destino


def archivos(raiz):
    for d, _, fs in os.walk(raiz):
        for f in fs:
            yield os.path.relpath(os.path.join(d, f), raiz).replace(os.sep, "/")


def igual(a, b):
    return os.path.exists(b) and filecmp.cmp(a, b, shallow=False)


def commit_txt(h, cambiados):
    n, slug, autor, fecha, sprint, mensaje, _ = h
    rama = "hu-%02d-%s" % (n, slug)
    lista = "\n".join("  " + c for c in cambiados)
    prueba = ("npm test                     # deben pasar todas las pruebas" if n >= 4 else
              "(abrir Frontend/index.html con doble clic y revisar; las pruebas automáticas empiezan en HU-04)")
    extra = ""
    if n in REGENERAR_EN:
        extra = """
Publicación en Google Apps Script (después del merge; ver Guía 3):
  → Backend/Index.html ya viene generado en este paquete (python Backend/construir_index.py).
  → script.google.com → proyecto «Tablero Pan Trenza» → pegar Code.gs e Index.html → Implementar.
  → %s
""" % ("Primera vez: Nueva implementación → Aplicación web → Cualquier usuario. Copiar la URL /exec en el informe."
       if n == 6 else "Gestionar implementaciones → editar → Nueva versión (la URL /exec no cambia). Pegar la URL en el README.")
    return f"""HU-{n:02d} · {mensaje.split(': ', 1)[1]}
Responsable: {autor} · Sprint {sprint} · fecha del commit: {fecha} (el día real en que se sube; no se cambia la fecha)

Archivos de esta historia (copiar en la raíz del repositorio, respetando las carpetas; reemplazan a los anteriores):
{lista}

Pasos (en la terminal de Cursor, dentro del repositorio):
  git checkout main
  git pull origin main
  git checkout -b {rama}
  (copiar aquí el contenido de esta carpeta, menos COMMIT.txt)
  {prueba}
  git add -A
  git commit -m "{mensaje}"
  git push -u origin {rama}
  → En GitHub: Compare & pull request → base: main → Create pull request.
  → Juan Pablo (Scrum Master, dueño del repositorio) revisa y hace Merge.
  → María Camila (QA) prueba la historia y mueve la tarjeta en Trello.
{extra}
IMPORTANTE: los paquetes se aplican EN ORDEN (HU-01, HU-02, …). Antes de aplicar el suyo,
el paquete anterior ya debe estar en main (git pull origin main).
"""


def main():
    shutil.rmtree(ETAPAS, ignore_errors=True)
    shutil.rmtree(PAQUETES, ignore_errors=True)
    previa, manifiesto = None, []
    for h in HISTORIAS:
        n = h[0]
        etapa = construir_etapa(n)
        cambiados = sorted(r for r in archivos(etapa) if previa is None or not igual(os.path.join(etapa, r), os.path.join(previa, r)))
        borrados = sorted(r for r in (archivos(previa) if previa else []) if not os.path.exists(os.path.join(etapa, r)))
        if borrados:
            sys.exit("HU-%02d borra archivos: %s" % (n, borrados))
        paquete = os.path.join(PAQUETES, "HU-%02d-%s" % (n, h[1]))
        for r in cambiados:
            os.makedirs(os.path.dirname(os.path.join(paquete, r)), exist_ok=True)
            shutil.copy2(os.path.join(etapa, r), os.path.join(paquete, r))
        with open(os.path.join(paquete, "COMMIT.txt"), "w", encoding="utf-8") as f:
            f.write(commit_txt(h, cambiados))
        manifiesto.append({"n": n, "slug": h[1], "autor": h[2], "fecha": h[3], "sprint": h[4], "mensaje": h[5],
                           "rama": "hu-%02d-%s" % (n, h[1]), "archivos": cambiados})
        print("HU-%02d  %-16s %2d archivo(s): %s" % (n, h[2], len(cambiados), ", ".join(cambiados)))
        previa = etapa
    import json
    with open(os.path.join(PAQUETES, "manifiesto.json"), "w", encoding="utf-8") as f:
        json.dump(manifiesto, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
