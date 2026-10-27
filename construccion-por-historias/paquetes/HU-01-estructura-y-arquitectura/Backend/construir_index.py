"""Genera Backend/Index.html (un solo archivo) a partir de Frontend/.

Apps Script (HtmlService) sirve un archivo HTML por página, así que se juntan en Index.html
el CSS y el JavaScript propios; Chart.js y SheetJS se cargan desde cdnjs (misma versión que
Frontend/vendor/). Los enlaces de la plantilla y de los datos simulados apuntan al repositorio.

Uso (desde la raíz del repositorio):  python Backend/construir_index.py
"""
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONT = os.path.join(RAIZ, "Frontend")
REPO = "https://github.com/jpablovlsqz16/Proyecto-de-aula-gerencia-/raw/main/Frontend/"
CDN = {
    "vendor/chart.umd.min.js": "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js",
    "vendor/xlsx.full.min.js": "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
}


def leer(ruta):
    with open(os.path.join(FRONT, ruta), encoding="utf-8") as f:
        return f.read()


def script(m):
    src = m.group(1)
    if src in CDN:
        return '<script src="%s"></script>' % CDN[src]
    codigo = leer(src).replace("</script", "<\\/script")
    return "<script>\n%s\n</script>" % codigo


def main():
    html = leer("index.html")
    html = html.replace('<link rel="stylesheet" href="css/styles.css">', "<style>\n%s\n</style>" % leer("css/styles.css"))
    html = re.sub(r'<script src="([^"]+)"></script>', script, html)
    # Los archivos descargables viven en el repositorio (Apps Script no sirve archivos estáticos).
    for nombre in ("Base_Panaderia_Indicadores_plantilla.xlsx", "Base_Panaderia_Indicadores_2026-09.xlsx"):
        html = html.replace('href="datos/%s" download' % nombre, 'href="%sdatos/%s" target="_blank" rel="noopener"' % (REPO, nombre))
    salida = os.path.join(RAIZ, "Backend", "Index.html")
    with open(salida, "w", encoding="utf-8") as f:
        f.write(html)
    print("Escrito:", salida, "(%d KB)" % (len(html.encode("utf-8")) // 1024))


if __name__ == "__main__":
    main()
