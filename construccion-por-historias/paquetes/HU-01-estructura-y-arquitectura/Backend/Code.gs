/**
 * Publicación del Tablero de Indicadores · Panadería San Nicolás en Google Apps Script.
 *
 * Apps Script solo sirve la página: todo el cálculo sigue corriendo en el navegador
 * (Frontend/js/*.js del repositorio). Index.html se genera con Backend/construir_index.py
 * a partir de Frontend/ y no se edita a mano.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Tablero Pan Trenza · Panadería San Nicolás')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
