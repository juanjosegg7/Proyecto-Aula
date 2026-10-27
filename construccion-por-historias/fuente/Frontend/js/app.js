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

  /*<HU-10>*/
  // ---------- Metas y semáforos de las fichas técnicas ----------
  // sentido 'min': verde si valor ≥ verde, rojo si valor < rojo. 'max': verde si valor ≤ verde, rojo si valor > rojo.
  var INDICADORES = [
    { clave: 'oee', nombre: 'OEE del horno', unidad: '%', sentido: 'min', verde: 65, rojo: 55 },
    { clave: 'disponibilidad', nombre: 'Disponibilidad', unidad: '%', sentido: 'min', verde: 90, rojo: 80 },
    { clave: 'rendimiento', nombre: 'Rendimiento', unidad: '%', sentido: 'min', verde: 80, rojo: 70 },
    { clave: 'calidad', nombre: 'Calidad', unidad: '%', sentido: 'min', verde: 95, rojo: 90 },
    { clave: 'sla', nombre: 'SLA de pedidos (OTIF)', unidad: '%', sentido: 'min', verde: 95, rojo: 90 },
    { clave: 'noVendido', nombre: '% de producto no vendido', unidad: '%', sentido: 'max', verde: 10, rojo: 15 },
    { clave: 'productividad', nombre: 'Productividad de mano de obra', unidad: 'trenzas/h-h', sentido: 'min', lineaBase: '' }
  ];
  function metasDefecto() {
    var m = {};
    INDICADORES.forEach(function (i) { m[i.clave] = { verde: i.verde, rojo: i.rojo, lineaBase: i.lineaBase }; });
    return m;
  }
  /*</HU-10>*/

  var estado = {
    archivo: null,                               // { nombre, cargado, hojas }
    modelo: null,
    /*<HU-10>*/
    metas: Object.assign(metasDefecto(), leer('pt.metas.fichas', {})),
    /*</HU-10>*/
    graficos: {}
  };
  /*<HU-05>*/
  estado.archivo = leer('pt.base', null);
  if (estado.archivo) {
    try { estado.modelo = M.construirModelo(estado.archivo.hojas); } catch (e) { estado.archivo = null; }
  }
  /*</HU-05>*/

  /*<HU-10>*/
  // Límites del semáforo. La productividad usa línea base (verde ≥ línea base + 5 %, rojo < línea base).
  function limites(clave) {
    var m = estado.metas[clave] || {};
    if (clave === 'productividad') {
      var lb = Number(m.lineaBase);
      return m.lineaBase === '' || m.lineaBase == null || !(lb > 0) ? null : { verde: lb * 1.05, rojo: lb };
    }
    return { verde: m.verde, rojo: m.rojo };
  }
  function semaforo(clave, valor) {
    var ind = INDICADORES.filter(function (i) { return i.clave === clave; })[0], l = limites(clave);
    return l ? K.semaforo(valor, l.verde, l.rojo, ind.sentido) : 'sin-meta';
  }
  /*</HU-10>*/

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
    var nombre = estado.archivo ? estado.archivo.nombre : 'sin datos cargados';
    $('#fuente-actual').textContent = /^Panadería San Nicolás/.test(nombre) ? nombre : 'Panadería San Nicolás · ' + nombre;
  }

  /*<HU-04>*/
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

  /*<hasta HU-05>*/
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
  /*</hasta HU-05>*/
  /*</HU-04>*/

  /*<HU-05>*/
  function cargar(nombre, hojas) {
    var modelo = M.construirModelo(hojas);
    /*<HU-06>*/
    modelo.registros = K.calcularRegistros(modelo);
    /*</HU-06>*/
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
    /*<hasta HU-06>*/
    avisar('Archivo validado: ' + Object.keys(modelo.tablas).length + ' tablas reconocidas y ' + modelo.errores.length + ' fila(s) con errores.');
    /*</hasta HU-06>*/
    /*<HU-06>*/
    /*<HU-11>*/
    ['#f-desde', '#f-hasta', '#f-turno', '#f-maquina', '#f-linea'].forEach(function (s) { $(s).value = ''; });
    /*</HU-11>*/
    irA('tablero');
    avisar('Tablero generado: ' + modelo.registros.length + ' turnos, ' + modelo.produccion.length + ' registros de producción y ' +
      modelo.paros.length + ' paros' + (modelo.errores.length ? '; ' + modelo.errores.length + ' fila(s) con errores (ver «Cargar datos»)' : '') + '.');
    /*</HU-06>*/
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
  /*</HU-05>*/

  /*<HU-04>*/
  function usarEjemplo() {
    if (!window.DATOS_EJEMPLO) { avisar('No se encontraron los datos de ejemplo.', 'error'); return; }
    cargar(DATOS_EJEMPLO.nombre, DATOS_EJEMPLO.hojas);
  }
  $('#btn-ejemplo').addEventListener('click', usarEjemplo);
  /*<HU-06>*/
  $('#btn-ejemplo-vacio').addEventListener('click', usarEjemplo);
  /*</HU-06>*/
  /*</HU-04>*/

  /*<HU-11>*/
  // ---------- Filtros ----------
  function llenarSelect(sel, valores, etiquetaTodos, etiqueta) {
    var actual = sel.value;
    sel.innerHTML = '<option value="">' + etiquetaTodos + '</option>' + valores.map(function (v) {
      return '<option value="' + esc(v) + '">' + esc(etiqueta ? etiqueta(v) : v) + '</option>';
    }).join('');
    sel.value = valores.indexOf(actual) !== -1 ? actual : '';
  }
  function actualizarFiltros() {
    var m = estado.modelo, unicos = function (campo) {
      var v = {}; m.registros.forEach(function (r) { if (r[campo]) v[r[campo]] = true; });
      return Object.keys(v).sort();
    };
    var fechas = unicos('fecha');
    llenarSelect($('#f-desde'), fechas, 'Inicio');
    llenarSelect($('#f-hasta'), fechas, 'Fin');
    llenarSelect($('#f-turno'), unicos('turno'), 'Todos');
    llenarSelect($('#f-maquina'), unicos('maquina'), 'Todos', nombreEquipo);
    llenarSelect($('#f-linea'), unicos('linea'), 'Todas');
    $('#f-maquina-label').hidden = unicos('maquina').length < 2;
    $('#f-linea-label').hidden = unicos('linea').length < 1;
  }
  ['#f-desde', '#f-hasta', '#f-turno', '#f-maquina', '#f-linea'].forEach(function (s) { $(s).addEventListener('change', renderTablero); });
  $('#btn-limpiar').addEventListener('click', function () {
    ['#f-desde', '#f-hasta', '#f-turno', '#f-maquina', '#f-linea'].forEach(function (s) { $(s).value = ''; });
    renderTablero();
  });
  /*</HU-11>*/
  function filtros() {
    /*<HU-11>*/
    return { desde: $('#f-desde').value, hasta: $('#f-hasta').value, turno: $('#f-turno').value,
      maquina: $('#f-maquina').value, linea: $('#f-linea').value };
    /*</HU-11>*/
    /*<hasta HU-11>*/
    return {};
    /*</hasta HU-11>*/
  }
  function nombreEquipo(id) {
    var q = estado.modelo && estado.modelo.maquinas[id];
    return q && q.nombre !== id ? q.nombre + ' (' + id + ')' : id;
  }

  /*<HU-10>*/
  // ---------- Metas ----------
  function renderMetas() {
    $('#metas-tabla').innerHTML = INDICADORES.map(function (i) {
      var m = estado.metas[i.clave] || {};
      if (i.clave === 'productividad') {
        return '<div class="meta-fila"><span>' + esc(i.nombre) + '</span><label>Línea base (' + esc(i.unidad) + ')' +
          '<input type="number" step="0.1" min="0" data-meta="productividad" data-campo="lineaBase" value="' + esc(m.lineaBase) + '"></label>' +
          '<span class="nota">Verde ≥ línea base + 5 % · rojo &lt; línea base</span></div>';
      }
      var signo = i.sentido === 'max' ? ['≤', '&gt;'] : ['≥', '&lt;'];
      return '<div class="meta-fila"><span>' + esc(i.nombre) + '</span>' +
        '<label>Verde ' + signo[0] + ' <input type="number" step="0.1" data-meta="' + i.clave + '" data-campo="verde" value="' + esc(m.verde) + '"></label>' +
        '<label>Rojo ' + signo[1] + ' <input type="number" step="0.1" data-meta="' + i.clave + '" data-campo="rojo" value="' + esc(m.rojo) + '"></label></div>';
    }).join('');
    document.querySelectorAll('#metas-tabla input').forEach(function (inp) {
      inp.addEventListener('input', function () {
        estado.metas[inp.dataset.meta][inp.dataset.campo] = inp.value === '' ? '' : Number(inp.value);
        guardar('pt.metas.fichas', estado.metas);
        renderTablero();
      });
    });
  }
  $('#btn-metas').addEventListener('click', function () { $('#panel-metas').hidden = !$('#panel-metas').hidden; });
  $('#btn-metas-defecto').addEventListener('click', function () {
    estado.metas = metasDefecto(); guardar('pt.metas.fichas', estado.metas); renderMetas(); renderTablero();
  });
  /*</HU-10>*/

  // ---------- Tablero ----------
  /*<HU-12>*/
  var C = { oee: '#b45309', A: '#2563eb', R: '#0f766e', Q: '#7c3aed', paro: '#dc2626', meta: '#6b7280', sla: '#2563eb', nv: '#d97706' };
  if (window.Chart) {
    var css = getComputedStyle(document.documentElement);
    Chart.defaults.font.family = css.fontFamily;
    Chart.defaults.color = css.getPropertyValue('--texto-suave').trim() || '#6d645a';
    Chart.defaults.borderColor = css.getPropertyValue('--borde').trim() || '#e4ded4';
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.animation = false;
  }
  function grafico(id, config) {
    if (estado.graficos[id]) estado.graficos[id].destroy();
    if (window.Chart) estado.graficos[id] = new Chart(document.getElementById(id), config);
  }
  function lineaMeta(etiqueta, valor, n, color) {
    return { type: 'line', label: etiqueta, data: new Array(n).fill(Number(valor)), borderColor: color || C.meta,
      borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false };
  }
  /*</HU-12>*/
  function tarjeta(etiqueta, valor, unidad, detalle, clave, valorNum) {
    var sem = 'sin-meta', meta = '';
    /*<HU-10>*/
    sem = clave ? semaforo(clave, valorNum) : 'sin-meta';
    var l = clave ? limites(clave) : null, ind = INDICADORES.filter(function (i) { return i.clave === clave; })[0];
    meta = l && valorNum != null ? ' · meta ' + (ind.sentido === 'max' ? '≤ ' : '≥ ') + fmt.num(l.verde, 1) : '';
    /*</HU-10>*/
    var textos = { verde: '● Cumple la meta', amarillo: '● En alerta', rojo: '● Fuera de meta', 'sin-meta': '' };
    return '<div class="kpi ' + sem + '"><div class="etiqueta">' + esc(etiqueta) + '</div>' +
      '<div class="valor">' + valor + (unidad ? ' <span class="unidad">' + unidad + '</span>' : '') + '</div>' +
      '<div class="detalle">' + esc(detalle || '') + meta + '</div>' +
      (textos[sem] ? '<div class="estado">' + textos[sem] + '</div>' : '') + '</div>';
  }

  function renderTablero() {
    /*<hasta HU-06>*/
    return;
    /*</hasta HU-06>*/
    /*<HU-06>*/
    var hay = !!estado.modelo;
    $('#tablero-vacio').hidden = hay;
    $('#tablero').hidden = !hay;
    if (!hay) return;
    if (!estado.modelo.registros) estado.modelo.registros = K.calcularRegistros(estado.modelo);
    /*<HU-11>*/
    actualizarFiltros();
    /*</HU-11>*/
    var a = K.analizar(estado.modelo, filtros()), t = a.total;
    var p100 = function (v) { return v == null ? null : v * 100; };

    $('#resumen').textContent = t.registros
      ? t.registros + ' turnos · ' + a.porFecha.length + ' día(s)' +
        (a.porFecha.length ? ' (' + a.porFecha[0].clave + ' a ' + a.porFecha[a.porFecha.length - 1].clave + ')' : '') +
        ' · ' + fmt.num(t.programado / 60, 1) + ' h programadas de horno'
      : 'Ningún registro cumple los filtros seleccionados.';

    var tarjetas = [
      tarjeta('OEE del horno', fmt.frac(t.oee), '', 'disponibilidad × rendimiento × calidad', 'oee', p100(t.oee)),
      tarjeta('Disponibilidad', fmt.frac(t.A), '', fmt.num(t.paros / 60, 1) + ' h de paros no planeados de ' + fmt.num(t.programado / 60, 1) + ' h', 'disponibilidad', p100(t.A)),
      tarjeta('Rendimiento', fmt.frac(t.R), '', fmt.num(t.idealMin / 60, 1) + ' h ideales de ' + fmt.num(t.producido / 60, 1) + ' h operativas', 'rendimiento', p100(t.R)),
      tarjeta('Calidad', fmt.frac(t.Q), '', fmt.num(t.defectuosas) + ' defectuosas de ' + fmt.num(t.unidades) + ' producidas', 'calidad', p100(t.Q))
    ];
    /*<HU-07>*/
    var sla = a.sla;
    tarjetas.push(tarjeta('SLA de pedidos (OTIF)', sla ? fmt.pct(sla.valor) : 'N/D', '',
      sla ? sla.aTiempo + ' de ' + sla.total + ' pedidos a tiempo y completos' + (filtros().turno ? ' (los pedidos no dependen del turno)' : '')
        : 'el archivo no trae pedidos', 'sla', sla && sla.valor));
    /*</HU-07>*/
    /*<HU-08>*/
    var nv = a.noVendido;
    tarjetas.push(tarjeta('% no vendido', nv && nv.valor != null ? fmt.pct(nv.valor) : 'N/D', '',
      nv ? (nv.valor == null ? nv.motivo : fmt.num(nv.unidades) + ' trenzas buenas sin vender') : 'el archivo no trae ventas', 'noVendido', nv && nv.valor));
    /*</HU-08>*/
    /*<HU-09>*/
    var pr = a.productividad;
    tarjetas.push(tarjeta('Productividad de mano de obra', fmt.num(pr.valor, 2), 'trenzas/h-h', fmt.num(pr.horas, 1) + ' horas-hombre' +
      /*<HU-10>*/
      (limites('productividad') ? '' : ' · defina la línea base en Metas') +
      /*</HU-10>*/
      '', 'productividad', pr.valor));
    /*</HU-09>*/
    tarjetas.push(tarjeta('Trenzas buenas', fmt.num(t.buenas), '', fmt.num(t.unidades) + ' producidas en ' + fmt.num(a.datos.produccion.length) + ' tandas'));
    $('#kpis').innerHTML = tarjetas.join('');
    /*<HU-12>*/
    renderGraficos(a);
    /*</HU-12>*/
    /*<HU-13>*/
    renderHallazgos(a);
    /*</HU-13>*/
    /*</HU-06>*/
  }

  /*<HU-12>*/
  function renderGraficos(a) {
    var t = a.total, Mt = estado.metas, pr = a.productividad;
    var fechas = a.porFecha.map(function (g) { return fechaCorta(g.clave); }), n = fechas.length;
    var serie = function (arr, k) { return arr.map(function (g) { return g[k] == null ? null : g[k] * 100; }); };
    var ejePct = { y: { min: 0, max: 100, title: { display: true, text: '%' } } };
    var dsDia = [
      { label: 'OEE', data: serie(a.porFecha, 'oee'), borderColor: C.oee, backgroundColor: C.oee, borderWidth: 3, tension: .2 },
      { label: 'Disponibilidad', data: serie(a.porFecha, 'A'), borderColor: C.A, backgroundColor: C.A, borderWidth: 1.5, pointRadius: 1.5, tension: .2 },
      { label: 'Rendimiento', data: serie(a.porFecha, 'R'), borderColor: C.R, backgroundColor: C.R, borderWidth: 1.5, pointRadius: 1.5, tension: .2 },
      { label: 'Calidad', data: serie(a.porFecha, 'Q'), borderColor: C.Q, backgroundColor: C.Q, borderWidth: 1.5, pointRadius: 1.5, tension: .2 }
    ];
    if (Mt.oee.verde !== '') dsDia.push(lineaMeta('Meta OEE', Mt.oee.verde, n));
    grafico('g-oee-dia', { type: 'line', data: { labels: fechas, datasets: dsDia },
      options: { scales: ejePct, plugins: { tooltip: { mode: 'index', intersect: false } } } });

    // Cascada: tiempo programado → paros → pérdida de velocidad → pérdida de calidad → tiempo efectivo.
    var h = function (v) { return v / 60; }, efectivo = t.Q == null ? t.idealMin : t.idealMin * t.Q;
    grafico('g-cascada', { type: 'bar', data: {
      labels: ['Tiempo programado', 'Paros no planeados', 'Pérdida de velocidad', 'Pérdida de calidad', 'Tiempo efectivo'],
      datasets: [{ label: 'horas', data: [[0, h(t.programado)], [h(t.producido), h(t.programado)], [h(t.idealMin), h(t.producido)], [h(efectivo), h(t.idealMin)], [0, h(efectivo)]],
        backgroundColor: [C.A, C.paro, '#d97706', C.Q, C.oee] }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { return fmt.num(c.raw[1] - c.raw[0], 1) + ' h'; } } } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'horas' } } } } });

    var par = a.pareto.slice(0, 10);
    grafico('g-pareto', { type: 'bar', data: { labels: par.map(function (x) { return x.motivo; }), datasets: [
      { type: 'line', label: '% acumulado', data: par.map(function (x) { return x.acumulado; }), borderColor: C.oee, backgroundColor: C.oee, yAxisID: 'y1', tension: .1 },
      { label: 'Minutos', data: par.map(function (x) { return x.minutos; }), backgroundColor: C.paro, yAxisID: 'y' }
    ] }, options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'min' } },
      y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: '% acumulado' } },
      x: { ticks: { callback: function (v) { var l = this.getLabelForValue(v); return l.length > 18 ? l.slice(0, 17) + '…' : l; } } } } } });

    var cd = a.clientePorDia, nc = cd.length;
    var dsCli = [
      { label: 'SLA', data: cd.map(function (x) { return x.sla; }), borderColor: C.sla, backgroundColor: C.sla, tension: .2, spanGaps: true },
      { label: '% no vendido', data: cd.map(function (x) { return x.noVendido; }), borderColor: C.nv, backgroundColor: C.nv, tension: .2, spanGaps: true }
    ];
    if (Mt.sla.verde !== '') dsCli.push(lineaMeta('Meta SLA', Mt.sla.verde, nc, C.sla));
    if (Mt.noVendido.verde !== '') dsCli.push(lineaMeta('Máximo % no vendido', Mt.noVendido.verde, nc, C.nv));
    grafico('g-cliente', { type: 'line', data: { labels: cd.map(function (x) { return fechaCorta(x.clave); }), datasets: dsCli },
      options: { scales: ejePct, plugins: { tooltip: { mode: 'index', intersect: false } } } });

    var lb = limites('productividad');
    if (pr.porFecha) {
      var dsP = [{ label: 'Trenzas/h-h', data: pr.porFecha.map(function (x) { return x.valor; }), borderColor: C.R, backgroundColor: C.R, tension: .2 }];
      if (lb) dsP.push(lineaMeta('Línea base + 5 %', lb.verde, pr.porFecha.length));
      grafico('g-productividad', { type: 'line', data: { labels: pr.porFecha.map(function (x) { return fechaCorta(x.clave); }), datasets: dsP },
        options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'trenzas/h-h' } } } } });
    } else {
      grafico('g-productividad', { type: 'bar', data: { labels: pr.operadores.map(function (o) { return o.nombre; }),
        datasets: [{ label: 'unid./h-h', data: pr.operadores.map(function (o) { return o.valor; }), backgroundColor: C.R }] },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
    }

    var barras = function (grupos, etiqueta) {
      return { type: 'bar', data: { labels: grupos.map(etiqueta), datasets: [
        { label: 'Disponibilidad', data: serie(grupos, 'A'), backgroundColor: C.A },
        { label: 'Rendimiento', data: serie(grupos, 'R'), backgroundColor: C.R },
        { label: 'Calidad', data: serie(grupos, 'Q'), backgroundColor: C.Q },
        { label: 'OEE', data: serie(grupos, 'oee'), backgroundColor: C.oee }
      ] }, options: { scales: ejePct } };
    };
    var variosEquipos = a.porMaquina.length > 1;
    $('#fig-maquina').hidden = !variosEquipos;
    $('#fig-turno').classList.toggle('ancho', !variosEquipos);
    grafico('g-turno', barras(a.porTurno, function (g) { return 'Turno ' + g.clave; }));
    if (variosEquipos) grafico('g-maquina', barras(a.porMaquina, function (g) { return nombreEquipo(g.clave); }));
  }
  /*</HU-12>*/

  /*<HU-13>*/
  function renderHallazgos(a) {
    var t = a.total, Mt = estado.metas, items = [];
    if (!t.registros) { $('#alertas').innerHTML = '<h3>Hallazgos</h3><p class="nota">Sin registros en el filtro.</p>'; return; }
    var clase = function (s) { return s === 'verde' ? 'bien' : s === 'sin-meta' ? '' : 'mal'; };
    if (t.oee != null) {
      items.push({ c: clase(semaforo('oee', t.oee * 100)), t: 'OEE del horno de ' + fmt.frac(t.oee) + ' frente a la meta de ' + fmt.num(Mt.oee.verde, 0) + ' %.' });
    }
    var factores = [{ n: 'disponibilidad', v: t.A }, { n: 'rendimiento', v: t.R }, { n: 'calidad', v: t.Q }]
      .filter(function (f) { return f.v != null; }).sort(function (x, y) { return x.v - y.v; });
    if (factores.length) {
      var f = factores[0], detalle = '';
      if (f.n === 'disponibilidad') detalle = ': ' + fmt.num(t.paros / 60, 1) + ' h de paros no planeados (' + fmt.pct(t.paros / t.programado * 100) + ' del tiempo programado).';
      if (f.n === 'rendimiento') detalle = ': ' + fmt.num((t.producido - t.idealMin) / 60, 1) + ' h del horno operando sin hornear al ritmo ideal (carga y descarga, tiempo entre tandas).';
      if (f.n === 'calidad') detalle = ': ' + fmt.num(t.defectuosas) + ' trenzas defectuosas.';
      items.push({ c: '', t: 'El factor del OEE más bajo es el ' + f.n + ' (' + fmt.frac(f.v) + ')' + detalle });
    }
    if (a.pareto.length) {
      var top = [], acum = 0;
      a.pareto.forEach(function (p) { if (acum < 80) { top.push(p.motivo + ' (' + fmt.pct(p.pct) + ')'); acum = p.acumulado; } });
      items.push({ c: '', t: 'Pareto de paros no planeados: ' + top.join(', ') + ' explican el ' + fmt.pct(acum) + ' del tiempo perdido.' });
    }
    if (a.sla) {
      items.push({ c: clase(semaforo('sla', a.sla.valor)), t: 'SLA de ' + fmt.pct(a.sla.valor) + ': ' + a.sla.tarde + ' pedido(s) tarde y ' +
        a.sla.incompletos + ' incompleto(s) de ' + a.sla.total + '.' });
    } else items.push({ c: '', t: 'SLA: el archivo no trae la tabla de pedidos.' });
    if (a.noVendido && a.noVendido.valor != null) {
      items.push({ c: clase(semaforo('noVendido', a.noVendido.valor)), t: '% no vendido de ' + fmt.pct(a.noVendido.valor) + ' (' +
        fmt.num(a.noVendido.unidades) + ' trenzas buenas sin vender) frente a un máximo de ' + fmt.num(Mt.noVendido.verde, 0) + ' %.' });
    }
    var pr = a.productividad;
    if (pr.porTurno && pr.porTurno.length > 1) {
      items.push({ c: '', t: 'Productividad de mano de obra: ' + fmt.num(pr.valor, 2) + ' trenzas/h-h; ' +
        pr.porTurno.map(function (x) { return 'turno ' + x.clave + ' ' + fmt.num(x.valor, 2); }).join(' · ') + '.' });
    }
    if (a.porTurno.length > 1) {
      items.push({ c: '', t: 'OEE por turno: ' + a.porTurno.map(function (g) { return 'turno ' + g.clave + ' ' + fmt.frac(g.oee); }).join(' · ') + '.' });
    }
    var dias = a.porFecha.filter(function (g) { return g.oee != null; });
    if (dias.length > 1) {
      var pd = dias.reduce(function (x, y) { return y.oee < x.oee ? y : x; });
      items.push({ c: '', t: 'Día con menor OEE: ' + pd.clave + ' (' + fmt.frac(pd.oee) + ').' });
    }
    $('#alertas').innerHTML = '<h3>Hallazgos</h3><ul>' + items.map(function (x) { return '<li class="' + x.c + '">' + esc(x.t) + '</li>'; }).join('') + '</ul>';
  }
  /*</HU-13>*/

  /*<HU-14>*/
  // ---------- Exportar e imprimir ----------
  function descargar(nombre, contenido) {
    var url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    var a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  $('#btn-exportar').addEventListener('click', function () {
    var d = function (v, n) { return v == null ? '' : Number(v).toFixed(n).replace('.', ','); };
    var filas = [['Fecha', 'Turno', 'Equipo', 'Tiempo base (min)', 'Paros planeados excluidos (min)', 'Tiempo programado (min)',
      'Paros no planeados (min)', 'Tiempo operativo (min)', 'Disponibilidad', 'Unidades producidas', 'Defectuosas', 'Buenas', 'Calidad',
      'Tiempo ideal (min)', 'Rendimiento', 'OEE']].concat(K.filtrar(estado.modelo, filtros()).registros.map(function (r) {
      return [r.fecha, r.turno, r.maquina, d(r.base, 2), d(r.excluidos, 2), d(r.programado, 2), d(r.paros, 2), d(r.producido, 2), d(r.A, 4),
        r.unidades, r.defectuosas, r.buenas, d(r.Q, 4), d(r.idealMin, 2), d(r.R, 4), d(r.oee, 4)];
    }));
    descargar('indicadores-pan-trenza.csv', '﻿' + filas.map(function (f) { return f.join(';'); }).join('\r\n'));
  });
  $('#btn-imprimir').addEventListener('click', function () { window.print(); });
  /*</HU-14>*/

  // ---------- Inicio ----------
  /*<HU-10>*/
  renderMetas();
  /*</HU-10>*/
  actualizarCabecera();
  renderTablero();
})();
