/*
 * app.js — Interfaz del tablero de indicadores del pan trenza (Panadería San Nicolás).
 * Lee el libro de Excel (SheetJS), arma el modelo (modelo.js), calcula los indicadores
 * (indicadores.js) y dibuja tarjetas, gráficos y hallazgos (Chart.js).
 */
(function () {
  'use strict';

  var L = window.Lectura, M = window.Modelo, K = window.Indicadores;
  var $ = function (sel) { return document.querySelector(sel); };

  // ---------- Persistencia local (solo en este navegador) ----------
  function leer(clave, porDefecto) {
    try { var v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; } catch (e) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* almacenamiento no disponible */ }
  }
  function borrar(clave) { try { localStorage.removeItem(clave); } catch (e) { /* sin almacenamiento */ } }


  var estado = {
    archivo: null,                               // { nombre, cargado, hojas }
    modelo: null,
    graficos: {}
  };


  // ---------- Formato ----------
  var fmt = {
    num: function (v, d) {
      if (v == null || isNaN(v)) return 'N/D';
      return Number(v).toLocaleString('es-CO', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    },
    pct: function (v) { return v == null ? 'N/D' : fmt.num(v, 1) + ' %'; },
    frac: function (v) { return v == null ? 'N/D' : fmt.num(v * 100, 1) + ' %'; }
  };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fechaCorta(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] : iso; }
  var temporizador;
  function avisar(texto, tipo) {
    var a = $('#aviso');
    a.textContent = texto; a.className = 'aviso' + (tipo === 'error' ? ' error' : ''); a.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(function () { a.hidden = true; }, 6000);
  }

  // ---------- Navegación ----------
  function irA(vista) {
    document.querySelectorAll('.vista').forEach(function (v) { v.classList.toggle('activa', v.id === 'vista-' + vista); });
    document.querySelectorAll('#menu button').forEach(function (b) { b.classList.toggle('activo', b.dataset.vista === vista); });
    if (vista === 'tablero') renderTablero();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('#menu button').forEach(function (b) { b.addEventListener('click', function () { irA(b.dataset.vista); }); });
  document.querySelectorAll('[data-ir]').forEach(function (b) { b.addEventListener('click', function () { irA(b.dataset.ir); }); });

  function actualizarCabecera() {
    $('#fuente-actual').textContent = estado.archivo
      ? 'Panadería San Nicolás · ' + estado.archivo.nombre
      : 'Panadería San Nicolás · sin datos cargados';
  }

  // ---------- Carga del archivo ----------
  var zona = $('#zona'), input = $('#archivo');
  input.addEventListener('change', function () { if (input.files[0]) leerArchivo(input.files[0]); input.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('encima'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('encima'); }); });
  zona.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0]); });
  document.addEventListener('dragover', function (e) { e.preventDefault(); });
  document.addEventListener('drop', function (e) {
    e.preventDefault();
    if (!zona.contains(e.target) && e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0]);
  });

  function leerArchivo(archivo) {
    if (!/\.(xlsx|xlsm|xls|ods)$/i.test(archivo.name)) { avisar('Use un libro de Excel (.xlsx) con la estructura de la plantilla.', 'error'); return; }
    var lector = new FileReader();
    lector.onerror = function () { avisar('No se pudo leer el archivo.', 'error'); };
    lector.onload = function () {
      try {
        if (!window.XLSX) throw new Error('no se cargó la librería de Excel');
        var libro = XLSX.read(new Uint8Array(lector.result), { type: 'array' });
        var hojas = {};
        libro.SheetNames.forEach(function (n) {
          hojas[n] = XLSX.utils.sheet_to_json(libro.Sheets[n], { header: 1, raw: true, defval: null, blankrows: false });
        });
        cargar(archivo.name, hojas);
      } catch (err) {
        avisar('El archivo no se pudo interpretar: ' + err.message, 'error');
      }
    };
    lector.readAsArrayBuffer(archivo);
  }

  // Primera versión: muestra las hojas leídas y cuántas filas tiene cada una.
  function cargar(nombre, hojas) {
    estado.archivo = { nombre: nombre, hojas: hojas };
    $('#carga-detalle').hidden = false;
    $('#carga-titulo').textContent = nombre;
    $('#carga-estado').innerHTML = '<p class="nota">El archivo se leyó en el navegador. Hojas encontradas:</p>';
    $('#carga-tablas').innerHTML = '<tr><th class="txt">Hoja</th><th>Filas</th><th class="txt">Encabezados</th></tr>' +
      Object.keys(hojas).map(function (n) {
        var f = hojas[n];
        return '<tr><td class="txt"><b>' + esc(n) + '</b></td><td>' + f.length + '</td><td class="txt envolver">' + esc((f[0] || []).join(' · ')) + '</td></tr>';
      }).join('');
    actualizarCabecera();
    avisar('Archivo leído: ' + Object.keys(hojas).length + ' hojas.');
  }


  function usarEjemplo() {
    if (!window.DATOS_EJEMPLO) { avisar('No se encontraron los datos de ejemplo.', 'error'); return; }
    cargar(DATOS_EJEMPLO.nombre, DATOS_EJEMPLO.hojas);
  }
  $('#btn-ejemplo').addEventListener('click', usarEjemplo);

  function filtros() {
    return {};
  }
  function nombreEquipo(id) {
    var q = estado.modelo && estado.modelo.maquinas[id];
    return q && q.nombre !== id ? q.nombre + ' (' + id + ')' : id;
  }


  // ---------- Tablero ----------
  function tarjeta(etiqueta, valor, unidad, detalle, clave, valorNum) {
    var sem = 'sin-meta', meta = '';
    var textos = { verde: '● Cumple la meta', amarillo: '● En alerta', rojo: '● Fuera de meta', 'sin-meta': '' };
    return '<div class="kpi ' + sem + '"><div class="etiqueta">' + esc(etiqueta) + '</div>' +
      '<div class="valor">' + valor + (unidad ? ' <span class="unidad">' + unidad + '</span>' : '') + '</div>' +
      '<div class="detalle">' + esc(detalle || '') + meta + '</div>' +
      (textos[sem] ? '<div class="estado">' + textos[sem] + '</div>' : '') + '</div>';
  }

  function renderTablero() {
    return;
  }




  // ---------- Inicio ----------
  actualizarCabecera();
  renderTablero();
})();
