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
  estado.archivo = leer('pt.base', null);
  if (estado.archivo) {
    try { estado.modelo = M.construirModelo(estado.archivo.hojas); } catch (e) { estado.archivo = null; }
  }


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


  function cargar(nombre, hojas) {
    var modelo = M.construirModelo(hojas);
    renderCarga(nombre, modelo);
    if (!modelo.produccion.length) {
      irA('cargar');
      avisar('No se encontraron registros válidos de producción. Revise las tablas reconocidas.', 'error');
      return;
    }
    // Solo se guardan las hojas que la app usa.
    var usadas = {};
    Object.keys(modelo.tablas).forEach(function (rol) { var h = modelo.tablas[rol].hoja; usadas[h] = hojas[h]; });
    estado.archivo = { nombre: nombre, cargado: new Date().toISOString(), hojas: usadas };
    estado.modelo = modelo;
    guardar('pt.base', estado.archivo);
    actualizarCabecera();
    avisar('Archivo validado: ' + Object.keys(modelo.tablas).length + ' tablas reconocidas y ' + modelo.errores.length + ' fila(s) con errores.');
  }

  function renderCarga(nombre, m) {
    $('#carga-detalle').hidden = false;
    $('#carga-titulo').textContent = nombre;
    $('#carga-estado').innerHTML = '<div class="estado-carga">' +
      '<div><b class="ok">' + m.produccion.length + '</b>tandas o registros de producción</div>' +
      '<div><b>' + m.paros.length + '</b>paros</div>' +
      '<div><b>' + m.pedidos.length + '</b>pedidos</div>' +
      '<div><b>' + m.manoObra.length + '</b>registros de mano de obra</div>' +
      '<div><b class="' + (m.errores.length ? 'mal' : 'ok') + '">' + m.errores.length + '</b>filas con errores</div></div>' +
      (m.faltantes && m.faltantes.length ? '<p class="mal">Falta: ' + esc(m.faltantes.join(', ')) + '.</p>' : '');
    var uso = { pedidos: ' · necesaria para el SLA', ventas: ' · necesaria para el % no vendido', manoObra: ' · necesaria para la productividad' };
    $('#carga-tablas').innerHTML = '<tr><th class="txt">Tabla</th><th class="txt">Hoja del archivo</th><th class="txt">Columnas reconocidas</th></tr>' +
      M.TABLAS.map(function (def) {
        var t = m.tablas[def.rol];
        if (!t) return '<tr><td class="txt">' + esc(def.nombre) + '</td><td class="txt nota" colspan="2">No encontrada' + esc(uso[def.rol] || '') + '</td></tr>';
        var cols = Object.keys(t.mapa).map(function (k) { return '«' + t.encabezados[t.mapa[k]] + '»'; });
        return '<tr><td class="txt">' + esc(def.nombre) + '</td><td class="txt"><b>' + esc(t.hoja) + '</b></td><td class="txt envolver">' + esc(cols.join(' · ')) + '</td></tr>';
      }).join('');
    $('#carga-errores-panel').hidden = !m.errores.length && !m.advertencias.length;
    $('#carga-errores').innerHTML = m.errores.slice(0, 200).map(function (e) {
      return '<li class="mal">' + esc(e.hoja) + ', fila ' + e.fila + ': ' + esc(e.mensaje) + '</li>';
    }).concat(m.advertencias.map(function (a) { return '<li>' + esc(a) + '</li>'; })).join('');
  }

  $('#btn-borrar').addEventListener('click', function () {
    if (!estado.archivo) { avisar('No hay datos cargados.'); return; }
    if (!confirm('¿Quitar los datos de «' + estado.archivo.nombre + '»?')) return;
    estado.archivo = null; estado.modelo = null; borrar('pt.base');
    $('#carga-detalle').hidden = true;
    actualizarCabecera(); avisar('Datos quitados.');
  });

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
