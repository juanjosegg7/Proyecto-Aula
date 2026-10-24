/*
 * app.js — Interfaz del tablero de control del proceso de pan trenza.
 * Une la carga de archivos (Importador), los cálculos (Indicadores) y los gráficos (Chart.js).
 */
(function () {
  'use strict';

  var I = window.Importador, K = window.Indicadores, O = window.OEE, C = window.Contenido;
  var $ = function (sel) { return document.querySelector(sel); };

  // ---------- Persistencia local (todo se guarda solo en este navegador) ----------
  function leer(clave, porDefecto) {
    try { var v = localStorage.getItem(clave); return v ? JSON.parse(v) : porDefecto; } catch (e) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* almacenamiento no disponible */ }
  }

  var METAS_DEFECTO = { pctDefectos: 5, pctAprobados: 95, pctDesperdicio: 5, productividadHora: '', tiempoPromedio: '',
    oee: 85, disponibilidad: 90, rendimiento: 95, calidad: 99.9, sla: 95, noVendido: 5, productividadMO: '' };
  var estado = {
    archivo: leer('pt.archivo', null),          // { tipo: 'lotes', nombre, cargado, lotes } o { tipo: 'oee', nombre, cargado, hojas }
    manuales: leer('pt.manuales', []),
    metas: Object.assign({}, METAS_DEFECTO, leer('pt.metas', {})),
    backlog: leer('pt.backlog', null) || C.backlog.map(function (h) { return Object.assign({}, h); }),
    carga: null,                                 // archivo en proceso de mapeo
    modelo: null,                                // modelo relacional OEE (si el archivo es una base relacional)
    graficos: {}
  };
  if (estado.archivo && estado.archivo.tipo === 'oee') {
    try { estado.modelo = O.construirModelo(estado.archivo.hojas); } catch (e) { estado.archivo = null; }
  }
  function modoOEE() { return !!estado.modelo; }

  // ---------- Utilidades de formato ----------
  var fmt = {
    num: function (v, d) {
      if (v == null || isNaN(v)) return 'N/D';
      return Number(v).toLocaleString('es-CO', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
    },
    pct: function (v) { return v == null ? 'N/D' : fmt.num(v, 2) + ' %'; },
    frac: function (v) { return v == null ? 'N/D' : fmt.num(v * 100, 1) + ' %'; }
  };
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var temporizadorAviso;
  function avisar(texto, tipo) {
    var a = $('#aviso');
    a.textContent = texto; a.className = 'aviso' + (tipo === 'error' ? ' error' : ''); a.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(function () { a.hidden = true; }, 5000);
  }
  function descargar(nombre, contenido, tipo) {
    var blob = new Blob([contenido], { type: tipo || 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  // ---------- Navegación ----------
  function irA(vista) {
    document.querySelectorAll('.vista').forEach(function (v) { v.classList.toggle('activa', v.id === 'vista-' + vista); });
    document.querySelectorAll('#menu button').forEach(function (b) { b.classList.toggle('activo', b.dataset.vista === vista); });
    if (vista === 'tablero') renderTablero();
    if (vista === 'datos') renderDatos();
    if (vista === 'fichas') renderFichas();
    if (vista === 'registrar') renderManuales();
    if (vista === 'backlog') renderBacklog();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('#menu button').forEach(function (b) { b.addEventListener('click', function () { irA(b.dataset.vista); }); });
  document.querySelectorAll('[data-ir]').forEach(function (b) { b.addEventListener('click', function () { irA(b.dataset.ir); }); });

  // ---------- Conjunto de datos y filtros ----------
  function todosLosLotes() {
    var a = (estado.archivo && estado.archivo.tipo !== 'oee' && estado.archivo.lotes) || [];
    return a.concat(estado.manuales);
  }
  function periodosOrdenados(lotes) {
    return K.agruparPorPeriodo(lotes).map(function (g) { return g.clave; });
  }
  function lotesFiltrados() {
    var lotes = todosLosLotes();
    var periodos = periodosOrdenados(lotes);
    var desde = $('#f-desde').value, hasta = $('#f-hasta').value;
    var iDesde = desde ? periodos.indexOf(desde) : 0, iHasta = hasta ? periodos.indexOf(hasta) : periodos.length - 1;
    var lote = $('#f-lote').value, resp = $('#f-responsable').value, origen = $('#f-origen').value;
    return lotes.filter(function (l) {
      var ip = periodos.indexOf(K.clavePeriodo(l));
      return ip >= iDesde && ip <= iHasta &&
        (!lote || l.lote === lote) && (!resp || l.responsable === resp) && (!origen || l.origen === origen);
    });
  }
  function llenarSelect(sel, valores, etiquetaTodos) {
    var actual = sel.value;
    sel.innerHTML = (etiquetaTodos ? '<option value="">' + etiquetaTodos + '</option>' : '') +
      valores.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');
    if (valores.indexOf(actual) !== -1 || actual === '') sel.value = actual;
  }
  function actualizarFiltros() {
    var lotes = todosLosLotes();
    var periodos = periodosOrdenados(lotes);
    llenarSelect($('#f-desde'), periodos, 'Inicio');
    llenarSelect($('#f-hasta'), periodos, 'Fin');
    var unicos = function (campo) {
      var vistos = {};
      lotes.forEach(function (l) { if (l[campo]) vistos[l[campo]] = true; });
      return Object.keys(vistos).sort(function (a, b) { return a.localeCompare(b, 'es', { numeric: true }); });
    };
    llenarSelect($('#f-lote'), unicos('lote'), 'Todos');
    llenarSelect($('#f-responsable'), unicos('responsable'), 'Todos');
    $('#f-responsable').disabled = unicos('responsable').length === 0;
  }
  ['#f-desde', '#f-hasta', '#f-lote', '#f-responsable', '#f-origen'].forEach(function (s) {
    $(s).addEventListener('change', function () { renderTablero(); });
  });
  $('#btn-limpiar-filtros').addEventListener('click', function () {
    ['#f-desde', '#f-hasta', '#f-lote', '#f-responsable', '#f-origen'].forEach(function (s) { $(s).value = ''; });
    renderTablero();
  });

  function actualizarCabecera() {
    var partes = [];
    if (modoOEE()) partes.push(estado.archivo.nombre + ' (OEE: ' + estado.modelo.registros.length + ' turnos-máquina)');
    else if (estado.archivo) partes.push(estado.archivo.nombre + ' (' + estado.archivo.lotes.length + ' lotes)');
    if (estado.manuales.length) partes.push(estado.manuales.length + ' lotes registrados');
    $('#fuente-actual').textContent = partes.length ? partes.join(' + ') : 'Sin datos cargados';
  }

  // ---------- Tablero ----------
  var COLORES = {
    aprobados: '#2563eb', defectuosos: '#dc2626', desperdicio: '#d97706', productividad: '#0f766e',
    meta: '#6b7280', etapa: '#a8a29e', cuello: '#b45309'
  };
  if (window.Chart) {
    Chart.defaults.font.family = getComputedStyle(document.documentElement).fontFamily;
    var css = getComputedStyle(document.documentElement);
    Chart.defaults.color = css.getPropertyValue('--texto-suave').trim() || '#6d645a';
    Chart.defaults.borderColor = css.getPropertyValue('--borde').trim() || '#e4ded4';
    Chart.defaults.maintainAspectRatio = false;
    Chart.defaults.animation = false;
  }
  function grafico(id, config) {
    if (estado.graficos[id]) estado.graficos[id].destroy();
    if (!window.Chart) return;
    estado.graficos[id] = new Chart(document.getElementById(id), config);
  }
  function lineaMeta(etiqueta, valor, n) {
    return { type: 'line', label: etiqueta, data: new Array(n).fill(Number(valor)), borderColor: COLORES.meta,
      borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, fill: false };
  }
  function tieneMeta(clave) { var m = estado.metas[clave]; return m !== '' && m != null && !isNaN(m); }

  function tarjeta(etiqueta, valor, unidad, detalle, clave, sentido, valorNum) {
    var sem = clave ? K.semaforo(valorNum, tieneMeta(clave) ? estado.metas[clave] : null, sentido) : 'sin-meta';
    var textoEstado = { verde: '● Cumple la meta', amarillo: '● Cerca de la meta', rojo: '● No cumple la meta', 'sin-meta': '' }[sem];
    var meta = clave && tieneMeta(clave) ? ' · meta ' + (sentido === 'max' ? '≤ ' : '≥ ') + fmt.num(estado.metas[clave], 1) : '';
    return '<div class="kpi ' + sem + '"><div class="etiqueta">' + etiqueta + '</div>' +
      '<div class="valor">' + valor + (unidad ? ' <span class="unidad">' + unidad + '</span>' : '') + '</div>' +
      '<div class="detalle">' + (detalle || '') + meta + '</div>' +
      (textoEstado ? '<div class="estado">' + textoEstado + '</div>' : '') + '</div>';
  }

  function renderTablero() {
    $('#tablero-oee').hidden = !modoOEE();
    if (modoOEE()) { $('#tablero-vacio').hidden = true; $('#tablero-contenido').hidden = true; renderTableroOEE(); return; }
    var hay = todosLosLotes().length > 0;
    $('#tablero-vacio').hidden = hay;
    $('#tablero-contenido').hidden = !hay;
    if (!hay) return;
    actualizarFiltros();
    var lotes = lotesFiltrados();
    var r = K.resumen(lotes);
    var grupos = K.agruparPorPeriodo(lotes);

    $('#resumen-filtro').textContent = lotes.length
      ? r.lotes + ' lotes en ' + r.periodos + ' periodo(s)' + (grupos.length ? ': ' + grupos[0].clave + ' a ' + grupos[grupos.length - 1].clave : '')
      : 'Ningún lote cumple los filtros seleccionados.';

    var M = estado.metas;
    $('#kpis').innerHTML = [
      tarjeta('Producción total', fmt.num(r.producidos), 'panes', r.lotes + ' lotes'),
      tarjeta('Panes aprobados', fmt.num(r.aprobados), 'panes', 'producidos − defectuosos'),
      tarjeta('Panes defectuosos', fmt.num(r.defectuosos), 'panes', 'registro por lote'),
      tarjeta('% defectos', fmt.pct(r.pctDefectos), '', 'defectuosos / producidos', 'pctDefectos', 'max', r.pctDefectos),
      tarjeta('% producción aprobada', fmt.pct(r.pctAprobados), '', 'aprobados / producidos', 'pctAprobados', 'min', r.pctAprobados),
      tarjeta('Productividad', fmt.num(r.productividadHora, 1), 'panes/h', fmt.num(r.productividad, 3) + ' panes/min', 'productividadHora', 'min', r.productividadHora),
      tarjeta('% desperdicio', fmt.pct(r.pctDesperdicio), '', r.desperdicio == null ? 'sin datos de materia prima' : fmt.num(r.desperdicio, 1) + ' de ' + fmt.num(r.materia, 1) + ' kg', 'pctDesperdicio', 'max', r.pctDesperdicio),
      tarjeta('Tiempo promedio por lote', fmt.num(r.tiempoPromedio, 1), 'min', r.tiempoTotal == null ? 'sin datos de tiempo' : 'total ' + fmt.num(r.tiempoTotal / 60, 1) + ' h', 'tiempoPromedio', 'max', r.tiempoPromedio)
    ].join('');

    var etiquetas = grupos.map(function (g) { return g.clave; });
    var n = etiquetas.length;

    grafico('g-produccion', {
      type: 'bar',
      data: { labels: etiquetas, datasets: [
        { label: 'Aprobados', data: grupos.map(function (g) { return g.aprobados; }), backgroundColor: COLORES.aprobados, stack: 'p' },
        { label: 'Defectuosos', data: grupos.map(function (g) { return g.defectuosos; }), backgroundColor: COLORES.defectuosos, stack: 'p' }
      ] },
      options: { scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'panes' } } },
        plugins: { tooltip: { mode: 'index', intersect: false } } }
    });

    var dsCalidad = [
      { label: '% defectos', data: grupos.map(function (g) { return g.pctDefectos; }), borderColor: COLORES.defectuosos, backgroundColor: COLORES.defectuosos, tension: .2 },
      { label: '% desperdicio', data: grupos.map(function (g) { return g.pctDesperdicio; }), borderColor: COLORES.desperdicio, backgroundColor: COLORES.desperdicio, tension: .2 }
    ];
    if (tieneMeta('pctDefectos')) dsCalidad.push(lineaMeta('Meta % defectos', M.pctDefectos, n));
    if (tieneMeta('pctDesperdicio') && M.pctDesperdicio !== M.pctDefectos) dsCalidad.push(lineaMeta('Meta % desperdicio', M.pctDesperdicio, n));
    grafico('g-calidad', { type: 'line', data: { labels: etiquetas, datasets: dsCalidad },
      options: { scales: { y: { beginAtZero: true, title: { display: true, text: '%' } } }, plugins: { tooltip: { mode: 'index', intersect: false } } } });

    var dsProd = [{ label: 'Productividad (panes/h)', data: grupos.map(function (g) { return g.productividad == null ? null : g.productividad * 60; }),
      borderColor: COLORES.productividad, backgroundColor: COLORES.productividad, tension: .2 }];
    if (tieneMeta('productividadHora')) dsProd.push(lineaMeta('Meta', M.productividadHora, n));
    grafico('g-productividad', { type: 'line', data: { labels: etiquetas, datasets: dsProd },
      options: { scales: { y: { title: { display: true, text: 'panes/h' } } } } });

    var cp = K.cartaP(lotes);
    var etiquetasLote = lotes.map(function (l) {
      if (K.clavePeriodo(l) === 'Lote ' + l.lote) return l.lote;
      return K.clavePeriodo(l) + ' · ' + (/^\d+$/.test(l.lote) ? 'L' + l.lote : l.lote);
    });
    grafico('g-cartap', {
      type: 'line',
      data: { labels: etiquetasLote, datasets: [
        { label: 'p (fracción defectuosa)', data: cp.puntos.map(function (x) { return x.p; }), borderColor: COLORES.aprobados,
          pointBackgroundColor: cp.puntos.map(function (x) { return x.fuera ? COLORES.defectuosos : COLORES.aprobados; }),
          pointRadius: cp.puntos.map(function (x) { return x.fuera ? 5 : 2.5; }), borderWidth: 1.5 },
        { label: 'LC (p̄)', data: cp.puntos.map(function () { return cp.pBar; }), borderColor: COLORES.meta, pointRadius: 0, borderWidth: 1.5 },
        { label: 'LSC', data: cp.puntos.map(function (x) { return x.lsc; }), borderColor: COLORES.defectuosos, borderDash: [5, 4], pointRadius: 0, borderWidth: 1, stepped: true },
        { label: 'LIC', data: cp.puntos.map(function (x) { return x.lic; }), borderColor: COLORES.defectuosos, borderDash: [5, 4], pointRadius: 0, borderWidth: 1, stepped: true }
      ] },
      options: { scales: { y: { beginAtZero: true } }, plugins: { tooltip: { mode: 'index', intersect: false } } }
    });

    var te = K.tiemposPorEtapa(lotes);
    $('#fig-etapas').hidden = te.etapas.length === 0;
    if (te.etapas.length) {
      grafico('g-etapas', {
        type: 'bar',
        data: { labels: te.etapas.map(function (e) { return e.etapa; }), datasets: [{ label: 'min promedio',
          data: te.etapas.map(function (e) { return e.promedio; }),
          backgroundColor: te.etapas.map(function (e) { return e.etapa === te.cuelloDeBotella ? COLORES.cuello : COLORES.etapa; }) }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, title: { display: true, text: 'min' } } } }
      });
    }

    renderAlertas(lotes, r, grupos, cp, te);
  }

  function renderAlertas(lotes, r, grupos, cp, te) {
    var M = estado.metas, items = [];
    if (!lotes.length) { $('#alertas').innerHTML = '<h3>Hallazgos</h3><p class="nota">Sin lotes en el filtro.</p>'; return; }
    function contraMeta(nombre, valor, clave, sentido, formato) {
      if (!tieneMeta(clave) || valor == null) return;
      var s = K.semaforo(valor, M[clave], sentido);
      items.push({ c: s === 'verde' ? 'bien' : 'mal', t: nombre + ': ' + formato(valor) + ' frente a una meta ' + (sentido === 'max' ? '≤ ' : '≥ ') + formato(Number(M[clave])) + '.' });
    }
    contraMeta('% defectos del periodo', r.pctDefectos, 'pctDefectos', 'max', fmt.pct);
    contraMeta('% desperdicio del periodo', r.pctDesperdicio, 'pctDesperdicio', 'max', fmt.pct);
    contraMeta('% aprobación', r.pctAprobados, 'pctAprobados', 'min', fmt.pct);
    contraMeta('Productividad', r.productividadHora, 'productividadHora', 'min', function (v) { return fmt.num(v, 1) + ' panes/h'; });

    function periodosFuera(campo, clave, nombre) {
      if (!tieneMeta(clave) || grupos.length < 2) return;
      var fuera = grupos.filter(function (g) { return g[campo] != null && g[campo] > Number(M[clave]); })
        .sort(function (a, b) { return b[campo] - a[campo]; });
      if (fuera.length) items.push({ c: 'mal', t: fuera.length + ' de ' + grupos.length + ' periodos superan la meta de ' + nombre +
        '. Peores: ' + fuera.slice(0, 3).map(function (g) { return g.clave + ' (' + fmt.pct(g[campo]) + ')'; }).join(', ') + '.' });
    }
    periodosFuera('pctDefectos', 'pctDefectos', 'defectos');
    periodosFuera('pctDesperdicio', 'pctDesperdicio', 'desperdicio');

    if (cp.fueraDeControl) {
      var ids = [];
      cp.puntos.forEach(function (x, i) { if (x.fuera) ids.push(K.clavePeriodo(lotes[i]) + ' lote ' + lotes[i].lote); });
      items.push({ c: 'mal', t: 'Carta p: ' + cp.fueraDeControl + ' lote(s) fuera de los límites de control (' + ids.slice(0, 4).join(', ') + '). Investigar causas asignables.' });
    } else if (lotes.length >= 2) {
      items.push({ c: 'bien', t: 'Carta p: todos los lotes dentro de los límites de control (p̄ = ' + fmt.pct(cp.pBar * 100) + ').' });
    }
    if (te.cuelloDeBotella) {
      var c = te.etapas.filter(function (e) { return e.etapa === te.cuelloDeBotella; })[0];
      items.push({ c: '', t: 'Etapa de mayor duración: ' + c.etapa + ' (' + fmt.num(c.promedio, 1) + ' min, ' + fmt.num(c.participacion, 1) + ' % del tiempo del lote).' });
    }
    var conProd = grupos.filter(function (g) { return g.productividad != null; });
    if (conProd.length >= 2) {
      var mejor = conProd.reduce(function (a, b) { return b.productividad > a.productividad ? b : a; });
      var peor = conProd.reduce(function (a, b) { return b.productividad < a.productividad ? b : a; });
      items.push({ c: '', t: 'Mayor productividad: ' + mejor.clave + ' (' + fmt.num(mejor.productividad * 60, 1) + ' panes/h); menor: ' +
        peor.clave + ' (' + fmt.num(peor.productividad * 60, 1) + ' panes/h).' });
    }
    if (r.tiempoTotal == null) items.push({ c: '', t: 'Los datos no incluyen tiempo de producción: la productividad no se puede calcular.' });
    if (r.pctDesperdicio == null) items.push({ c: '', t: 'Los datos no incluyen materia prima y desperdicio: el % de desperdicio no se puede calcular.' });

    $('#alertas').innerHTML = '<h3>Hallazgos</h3><ul>' + items.map(function (x) {
      return '<li class="' + x.c + '">' + esc(x.t) + '</li>';
    }).join('') + '</ul>';
  }

  // Metas
  $('#btn-metas').addEventListener('click', function () { $('#panel-metas').hidden = !$('#panel-metas').hidden; });
  $('#o-btn-metas').addEventListener('click', function () { $('#o-panel-metas').hidden = !$('#o-panel-metas').hidden; });
  Object.keys(METAS_DEFECTO).forEach(function (k) {
    var input = $('#m-' + k);
    if (!input) return;
    input.value = estado.metas[k];
    input.addEventListener('input', function () {
      estado.metas[k] = input.value === '' ? '' : Number(input.value);
      guardar('pt.metas', estado.metas);
      renderTablero();
    });
  });

  // Exportar e imprimir
  function filasExportables(lotes) {
    var d = function (v, n) { return v == null ? '' : Number(v).toFixed(n).replace('.', ','); };
    var enc = ['Periodo', 'Fecha', 'Día', 'Lote', 'Responsable', 'Origen', 'Panes producidos', 'Panes defectuosos', 'Panes aprobados',
      'Tiempo (min)', 'Materia prima (kg)', 'Desperdicio (kg)', '% defectos', '% aprobados', 'Productividad (panes/min)', '% desperdicio'];
    var filas = lotes.map(function (l) {
      var x = K.porLote(l);
      return [K.clavePeriodo(l), l.fecha || '', l.dia == null ? '' : l.dia, l.lote, l.responsable, l.origen, l.producidos, l.defectuosos, l.aprobados,
        d(l.tiempo, 2), d(l.materia, 2), d(l.desperdicio, 3), d(x.pctDefectos, 2), d(x.pctAprobados, 2), d(x.productividad, 4), d(x.pctDesperdicio, 2)];
    });
    return [enc].concat(filas).map(function (f) {
      return f.map(function (c) { c = String(c == null ? '' : c); return /[;"\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';');
    }).join('\r\n');
  }
  $('#btn-exportar').addEventListener('click', function () {
    descargar('indicadores-pan-trenza.csv', '﻿' + filasExportables(lotesFiltrados()));
  });
  $('#btn-imprimir').addEventListener('click', function () { window.print(); });

  // ---------- Carga de archivos ----------
  var zona = $('#zona'), inputArchivo = $('#archivo');
  inputArchivo.addEventListener('change', function () { if (inputArchivo.files[0]) leerArchivo(inputArchivo.files[0]); inputArchivo.value = ''; });
  ['dragenter', 'dragover'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('encima'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('encima'); }); });
  zona.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0]); });
  // Permite soltar el archivo en cualquier parte de la página.
  document.addEventListener('dragover', function (e) { e.preventDefault(); });
  document.addEventListener('drop', function (e) {
    e.preventDefault();
    if (!zona.contains(e.target) && e.dataTransfer.files[0]) leerArchivo(e.dataTransfer.files[0]);
  });

  function leerArchivo(archivo) {
    var nombre = archivo.name, esTexto = /\.(csv|txt)$/i.test(nombre);
    var lector = new FileReader();
    lector.onerror = function () { avisar('No se pudo leer el archivo.', 'error'); };
    lector.onload = function () {
      try {
        var hojas = {};
        if (esTexto) {
          var texto = lector.result;
          if (texto.indexOf('\uFFFD') !== -1) { // no era UTF-8: se vuelve a leer como Windows-1252 (Excel en español)
            var l2 = new FileReader();
            l2.onload = function () { iniciarCarga(nombre, { CSV: I.leerCSV(l2.result) }); };
            l2.readAsText(archivo, 'windows-1252');
            return;
          }
          hojas.CSV = I.leerCSV(texto);
        } else {
          if (!window.XLSX) throw new Error('No se cargó la librería de Excel.');
          var libro = XLSX.read(new Uint8Array(lector.result), { type: 'array' });
          libro.SheetNames.forEach(function (n) {
            hojas[n] = XLSX.utils.sheet_to_json(libro.Sheets[n], { header: 1, raw: true, defval: null, blankrows: false });
          });
        }
        iniciarCarga(nombre, hojas);
      } catch (err) {
        avisar('El archivo no se pudo interpretar: ' + err.message, 'error');
      }
    };
    if (esTexto) lector.readAsText(archivo, 'utf-8'); else lector.readAsArrayBuffer(archivo);
  }

  function iniciarCarga(nombre, hojas) {
    var nombres = Object.keys(hojas).filter(function (n) { return hojas[n].length; });
    if (!nombres.length) { avisar('El archivo está vacío.', 'error'); return; }
    if (O.esRelacional(hojas)) { cargarOEE(nombre, hojas); return; }
    var hoja = I.elegirHoja(hojas) || nombres[0];
    estado.carga = { nombre: nombre, hojas: hojas, hoja: hoja, resultado: I.procesarTabla(hojas[hoja]) };
    renderCarga();
    var r = estado.carga.resultado;
    if (!r.faltantes.length && r.lotes.length) {
      aplicarCarga();
    } else {
      irA('cargar');
      avisar('Revise la correspondencia de columnas: falta ' + (r.faltantes.join(', ') || 'información válida') + '.', 'error');
    }
  }

  function aplicarCarga() {
    var c = estado.carga, r = c.resultado;
    if (r.faltantes.length) { avisar('Asigne las columnas obligatorias: ' + r.faltantes.join(', ') + '.', 'error'); return; }
    if (!r.lotes.length) { avisar('No hay filas válidas para generar el tablero.', 'error'); return; }
    estado.archivo = { tipo: 'lotes', nombre: c.nombre + (Object.keys(c.hojas).length > 1 ? ' › ' + c.hoja : ''), cargado: new Date().toISOString(), lotes: r.lotes };
    estado.modelo = null;
    guardar('pt.archivo', estado.archivo);
    ['#f-desde', '#f-hasta', '#f-lote', '#f-responsable', '#f-origen'].forEach(function (s) { $(s).value = ''; });
    actualizarCabecera();
    irA('tablero');
    avisar('Tablero generado: ' + r.lotes.length + ' lotes cargados' + (r.errores.length ? ', ' + r.errores.length + ' fila(s) con errores (ver «Cargar datos»)' : '') + '.');
  }
  $('#btn-aplicar').addEventListener('click', aplicarCarga);

  function renderCarga() {
    var c = estado.carga;
    $('#carga-detalle').hidden = !c;
    if (!c) return;
    var esOEE = c.tipo === 'oee';
    $('#carga-tablas-panel').hidden = !esOEE;
    $('#carga-mapeo-panel').hidden = esOEE;
    $('#carga-previa-panel').hidden = esOEE;
    if (esOEE) { renderCargaOEE(c); return; }
    var r = c.resultado;
    $('#carga-titulo').textContent = c.nombre;
    var nombres = Object.keys(c.hojas);
    $('#carga-hoja-label').hidden = nombres.length < 2;
    $('#carga-hoja').innerHTML = nombres.map(function (n) { return '<option' + (n === c.hoja ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('');

    $('#carga-estado').innerHTML = '<div class="estado-carga">' +
      '<div><b class="ok">' + r.lotes.length + '</b>lotes válidos</div>' +
      '<div><b class="' + (r.errores.length ? 'mal' : 'ok') + '">' + r.errores.length + '</b>filas con errores</div>' +
      '<div><b>' + r.advertencias.length + '</b>advertencias</div>' +
      '<div><b>' + (r.filaEncabezados + 1) + '</b>fila de encabezados</div></div>' +
      (r.faltantes.length ? '<p class="mal">Faltan columnas obligatorias: ' + esc(r.faltantes.join(', ')) + '.</p>' : '');

    var opciones = ['<option value="">(no usar)</option>'].concat(r.encabezados.map(function (h, i) {
      return '<option value="' + i + '">' + esc(columnaLetra(i) + ' · ' + (h || '(sin nombre)')) + '</option>';
    })).join('');
    $('#mapeo').innerHTML = I.CAMPOS.map(function (campo) {
      var oblig = campo.id === 'producidos' || campo.id === 'defectuosos';
      var asignado = r.mapa.campos[campo.id];
      return '<label class="' + (oblig ? 'obligatorio' : '') + (asignado === undefined ? ' sin' : '') + '"><span>' + esc(campo.nombre) + '</span>' +
        '<select data-campo="' + campo.id + '">' + opciones + '</select></label>';
    }).join('');
    document.querySelectorAll('#mapeo select').forEach(function (s) {
      var v = r.mapa.campos[s.dataset.campo];
      s.value = v === undefined ? '' : String(v);
      s.addEventListener('change', remapear);
    });
    var etapas = Object.keys(r.mapa.etapas || {});
    $('#mapeo-etapas').innerHTML = etapas.length
      ? '<p class="nota">Columnas de tiempo por etapa reconocidas (para el análisis de etapas):</p><div class="chips">' +
        etapas.map(function (e) { return '<span class="chip">' + esc(e) + '</span>'; }).join('') + '</div>'
      : '<p class="nota">No se reconocieron columnas de tiempo por etapa (opcionales).</p>';

    var filas = c.hojas[c.hoja];
    var desde = r.filaEncabezados;
    $('#vista-previa').innerHTML = filas.slice(desde, desde + 8).map(function (f, i) {
      var tag = i === 0 ? 'th' : 'td';
      return '<tr>' + r.encabezados.map(function (_, j) {
        var v = f[j];
        if (i > 0 && j === r.mapa.campos.fecha) v = I.aFecha(v) || v;
        else if (typeof v === 'number' && !Number.isInteger(v)) v = Math.round(v * 1000) / 1000;
        return '<' + tag + ' class="txt">' + esc(v) + '</' + tag + '>';
      }).join('') + '</tr>';
    }).join('');

    $('#carga-errores-panel').hidden = !r.errores.length && !r.advertencias.length;
    $('#carga-errores').innerHTML = r.errores.map(function (e) {
      return '<li class="mal">Fila ' + e.fila + ': ' + esc(e.mensajes.join('; ')) + '</li>';
    }).concat(r.advertencias.map(function (a) { return '<li>' + esc(a) + '</li>'; })).join('');
  }
  function columnaLetra(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function remapear() {
    var c = estado.carga, campos = {};
    document.querySelectorAll('#mapeo select').forEach(function (s) { if (s.value !== '') campos[s.dataset.campo] = Number(s.value); });
    c.resultado = I.procesarTabla(c.hojas[c.hoja], { campos: campos, etapas: c.resultado.mapa.etapas });
    renderCarga();
  }
  $('#carga-hoja').addEventListener('change', function () {
    var c = estado.carga; c.hoja = $('#carga-hoja').value;
    c.resultado = I.procesarTabla(c.hojas[c.hoja]);
    renderCarga();
  });

  function usarEjemplo() {
    if (!window.DATOS_EJEMPLO) { avisar('No se encontraron los datos de ejemplo.', 'error'); return; }
    iniciarCarga('Ejemplo: ' + DATOS_EJEMPLO.nombre, { Simulacion_Mensual: DATOS_EJEMPLO.filas });
  }
  $('#btn-ejemplo').addEventListener('click', usarEjemplo);
  $('#btn-ejemplo-vacio').addEventListener('click', usarEjemplo);
  $('#btn-plantilla').addEventListener('click', function () {
    descargar('plantilla-produccion-pan-trenza.csv', '﻿' + ['Fecha', 'Lote', 'Responsable', 'Masa preparada (kg)', 'Panes producidos', 'Panes defectuosos',
      'Panes aprobados', 'Tiempo de producción (min)', 'Materia prima utilizada (kg)', 'Materia prima desperdiciada (kg)'].join(';') + '\r\n');
  });
  $('#btn-borrar-archivo').addEventListener('click', function () {
    if (!estado.archivo) { avisar('No hay datos de archivo cargados.'); return; }
    if (!confirm('¿Quitar los datos del archivo «' + estado.archivo.nombre + '»? Los lotes registrados manualmente se conservan.')) return;
    estado.archivo = null; estado.carga = null; estado.modelo = null;
    try { localStorage.removeItem('pt.archivo'); } catch (e) { /* sin almacenamiento */ }
    renderCarga(); actualizarCabecera(); avisar('Datos del archivo eliminados.');
  });

  // ---------- Registro manual de lotes (HU-09) ----------
  var form = $('#form-lote');
  function calcularAprobados() {
    var p = I.aNumero(form.producidos.value), d = I.aNumero(form.defectuosos.value);
    form.aprobados.value = p != null && d != null ? p - d : '';
  }
  form.producidos.addEventListener('input', calcularAprobados);
  form.defectuosos.addEventListener('input', calcularAprobados);
  form.addEventListener('reset', function () { setTimeout(function () { $('#form-errores').textContent = ''; form.querySelectorAll('.invalido').forEach(function (x) { x.classList.remove('invalido'); }); }, 0); });

  function validarLote(v) {
    var errores = [], marcar = [];
    ['fecha', 'lote', 'responsable', 'masa', 'producidos', 'defectuosos', 'tiempo', 'materia', 'desperdicio'].forEach(function (k) {
      if (v[k] === '' || v[k] == null) { errores.push('El campo «' + k + '» es obligatorio.'); marcar.push(k); }
    });
    if (errores.length) return { errores: ['Complete todos los campos obligatorios (*).'], marcar: marcar };
    var n = {};
    ['masa', 'producidos', 'defectuosos', 'tiempo', 'materia', 'desperdicio'].forEach(function (k) { n[k] = I.aNumero(v[k]); });
    ['masa', 'producidos', 'tiempo', 'materia'].forEach(function (k) { if (!(n[k] > 0)) { marcar.push(k); } });
    if (marcar.length) errores.push('Masa, panes producidos, tiempo y materia prima deben ser mayores que cero.');
    if (!(n.defectuosos >= 0) || !(n.desperdicio >= 0)) { errores.push('Defectuosos y desperdicio no pueden ser negativos.'); marcar.push('defectuosos', 'desperdicio'); }
    if (!Number.isInteger(n.producidos) || !Number.isInteger(n.defectuosos)) { errores.push('Los panes deben ser cantidades enteras.'); marcar.push('producidos', 'defectuosos'); }
    if (n.defectuosos > n.producidos) { errores.push('Los defectuosos no pueden superar a los producidos (aprobados ≤ producidos).'); marcar.push('defectuosos'); }
    if (n.desperdicio > n.materia) { errores.push('El desperdicio no puede superar la materia prima utilizada.'); marcar.push('desperdicio'); }
    var repetido = estado.manuales.some(function (l) { return l.lote.toLowerCase() === String(v.lote).trim().toLowerCase(); });
    if (repetido) { errores.push('Ya existe un lote registrado con el código «' + v.lote + '».'); marcar.push('lote'); }
    return { errores: errores, marcar: marcar, numeros: n };
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = {};
    Array.prototype.forEach.call(form.elements, function (el) { if (el.name) v[el.name] = el.value.trim(); });
    var r = validarLote(v);
    form.querySelectorAll('input').forEach(function (x) { x.classList.toggle('invalido', r.marcar.indexOf(x.name) !== -1); });
    if (r.errores.length) { $('#form-errores').innerHTML = r.errores.map(esc).join('<br>'); return; }
    $('#form-errores').textContent = '';
    var n = r.numeros;
    estado.manuales.push({
      fecha: v.fecha, dia: null, lote: v.lote, responsable: v.responsable, masa: n.masa,
      producidos: n.producidos, defectuosos: n.defectuosos, aprobados: n.producidos - n.defectuosos,
      tiempo: n.tiempo, materia: n.materia, desperdicio: n.desperdicio, etapas: {}, origen: 'manual',
      registrado: new Date().toISOString()
    });
    guardar('pt.manuales', estado.manuales);
    form.reset();
    actualizarCabecera(); renderManuales();
    avisar('Lote «' + v.lote + '» guardado correctamente. Ya aparece en el tablero.');
  });

  function renderManuales() {
    var t = $('#tabla-manuales');
    if (!estado.manuales.length) { t.innerHTML = '<tr><td class="txt nota">Aún no hay lotes registrados manualmente.</td></tr>'; return; }
    t.innerHTML = '<tr><th class="txt">Fecha</th><th class="txt">Lote</th><th class="txt">Responsable</th><th>Masa (kg)</th><th>Producidos</th><th>Defectuosos</th><th>Aprobados</th><th>Tiempo (min)</th><th>Materia (kg)</th><th>Desperdicio (kg)</th><th></th></tr>' +
      estado.manuales.map(function (l, i) {
        return '<tr><td class="txt">' + esc(l.fecha) + '</td><td class="txt">' + esc(l.lote) + '</td><td class="txt">' + esc(l.responsable) + '</td><td>' +
          fmt.num(l.masa, 2) + '</td><td>' + l.producidos + '</td><td>' + l.defectuosos + '</td><td>' + l.aprobados + '</td><td>' + fmt.num(l.tiempo, 1) + '</td><td>' +
          fmt.num(l.materia, 2) + '</td><td>' + fmt.num(l.desperdicio, 2) + '</td><td><button class="btn mini peligro" data-borrar="' + i + '">Eliminar</button></td></tr>';
      }).join('');
    t.querySelectorAll('[data-borrar]').forEach(function (b) {
      b.addEventListener('click', function () {
        var l = estado.manuales[Number(b.dataset.borrar)];
        if (!confirm('¿Eliminar el lote «' + l.lote + '»?')) return;
        estado.manuales.splice(Number(b.dataset.borrar), 1);
        guardar('pt.manuales', estado.manuales);
        renderManuales(); actualizarCabecera();
      });
    });
  }

  // ---------- Tabla de datos ----------
  $('#buscar').addEventListener('input', renderDatos);
  function renderDatos() {
    var t = $('#tabla-datos');
    $('#datos-titulo').textContent = modoOEE() ? 'Datos OEE por máquina, fecha y turno' : 'Datos e indicadores por lote';
    $('#datos-nota').textContent = modoOEE()
      ? 'Se aplican los mismos filtros del tablero. Cada fila reproduce las columnas de la hoja OEE de referencia (tiempos en minutos).'
      : 'Se aplican los mismos filtros del tablero. Cada indicador se calcula a partir de los datos del lote en la misma fila.';
    if (modoOEE()) { renderDatosOEE(t); return; }
    if (!todosLosLotes().length) { t.innerHTML = '<tr><td class="txt nota">No hay datos cargados.</td></tr>'; return; }
    actualizarFiltros();
    var q = I.normalizar($('#buscar').value);
    var lotes = lotesFiltrados().filter(function (l) {
      return !q || I.normalizar([K.clavePeriodo(l), l.lote, l.responsable].join(' ')).indexOf(q) !== -1;
    });
    var cp = K.cartaP(lotesFiltrados());
    var fueraPorLote = new Map();
    lotesFiltrados().forEach(function (l, i) { fueraPorLote.set(l, cp.puntos[i].fuera); });
    t.innerHTML = '<tr><th class="txt">Periodo</th><th class="txt">Lote</th><th class="txt">Responsable</th><th class="txt">Origen</th><th>Producidos</th><th>Defectuosos</th><th>Aprobados</th>' +
      '<th>Tiempo (min)</th><th>Materia (kg)</th><th>Desperdicio (kg)</th><th>% defectos</th><th>% aprobados</th><th>Productividad (panes/min)</th><th>% desperdicio</th></tr>' +
      lotes.map(function (l) {
        var x = K.porLote(l);
        return '<tr' + (fueraPorLote.get(l) ? ' class="fuera" title="Fuera de control en la carta p"' : '') + '><td class="txt">' + esc(K.clavePeriodo(l)) + '</td><td class="txt">' + esc(l.lote) + '</td><td class="txt">' + esc(l.responsable) +
          '</td><td class="txt">' + esc(l.origen) + '</td><td>' + fmt.num(l.producidos) + '</td><td>' + fmt.num(l.defectuosos) + '</td><td>' + fmt.num(l.aprobados) +
          '</td><td>' + fmt.num(l.tiempo, 1) + '</td><td>' + fmt.num(l.materia, 2) + '</td><td>' + fmt.num(l.desperdicio, 2) + '</td><td>' + fmt.pct(x.pctDefectos) +
          '</td><td>' + fmt.pct(x.pctAprobados) + '</td><td>' + fmt.num(x.productividad, 3) + '</td><td>' + fmt.pct(x.pctDesperdicio) + '</td></tr>';
      }).join('');
  }

  // ---------- Fichas técnicas (HU-11) ----------
  function renderFichas() {
    var hay = todosLosLotes().length > 0;
    if (hay) actualizarFiltros();
    var r = hay ? K.resumen(lotesFiltrados()) : null;
    var actual = function (clave) {
      if (!r) return 'Sin datos';
      if (clave === 'productividad') return r.productividad == null ? 'N/D' : fmt.num(r.productividad, 3) + ' panes/min (' + fmt.num(r.productividadHora, 1) + ' panes/h)';
      return fmt.pct(r[clave]);
    };
    var htmlOEE = '';
    if (modoOEE()) {
      actualizarFiltrosOEE();
      var a = O.analizar(estado.modelo, filtrosOEE());
      var valOEE = { oee: fmt.frac(a.total.oee), disponibilidad: fmt.frac(a.total.A), rendimiento: fmt.frac(a.total.R), calidad: fmt.frac(a.total.Q),
        sla: a.sla ? fmt.pct(a.sla.valor) : 'N/D (sin pedidos en el archivo)', noVendido: a.noVendido ? fmt.pct(a.noVendido.valor) : 'N/D (sin ventas en el archivo)',
        productividadMO: a.productividad.valor == null ? 'N/D' : fmt.num(a.productividad.valor, 1) + ' unid./h-h' };
      htmlOEE = C.fichasOEE.map(function (f) { return fichaHTML(f, valOEE[f.clave]); }).join('');
    } else {
      htmlOEE = C.fichasOEE.map(function (f) { return fichaHTML(f, 'Cargue una base relacional OEE'); }).join('');
    }
    var htmlLotes = C.fichas.map(function (f) { return fichaHTML(f, actual(f.clave)); }).join('');
    $('#fichas').innerHTML = modoOEE() ? htmlOEE + htmlLotes : htmlLotes + htmlOEE;
  }
  function fichaHTML(f, valor) {
    var filas = [['Objetivo', f.objetivo], ['Fórmula', f.formula], ['Unidad', f.unidad], ['Frecuencia', f.frecuencia], ['Responsable', f.responsable],
      ['Fuente', f.fuente], ['Meta', f.meta], ['Tipo', f.tipo], ['Interpretación', f.interpretacion], ['Ejemplo', f.ejemplo]];
    return '<article class="panel ficha"><h3>' + esc(f.nombre) + '</h3><p>Valor actual (filtro del tablero): <span class="actual">' + esc(valor) + '</span></p><dl>' +
      filas.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl></article>';
  }
  // ---------- Empresa y proceso ----------
  function tablaInfo(filas) {
    return '<table class="tabla tabla-info">' + filas.map(function (f) { return '<tr><td>' + esc(f[0]) + '</td><td>' + esc(f[1]) + '</td></tr>'; }).join('') + '</table>';
  }
  function renderProceso() {
    var s = C.sipoc, nombres = { S: 'Proveedores', I: 'Entradas', P: 'Proceso', O: 'Salidas', C: 'Clientes' };
    $('#proceso').innerHTML =
      '<div class="panel"><h3>Empresa</h3>' + tablaInfo(C.empresa) + '</div>' +
      '<div class="panel"><h3>SIPOC del proceso de fabricación de pan trenza</h3><div class="sipoc">' +
      Object.keys(nombres).map(function (k) {
        return '<div><h4>' + k + ' · ' + nombres[k] + '</h4><ul>' + s[k].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
      }).join('') + '</div></div>' +
      '<div class="panel"><h3>Flujo del proceso</h3><div class="flujo">' + s.P.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join(' → ') + '</div></div>' +
      '<div class="panel"><h3>Estrategia y ubicación del proyecto</h3>' + tablaInfo(C.estrategia) + '</div>' +
      '<div class="panel"><h3>Arquitectura de la aplicación</h3><div class="flujo"><span>Archivo Excel/CSV o formulario</span> → <span>Importador (mapeo y validación)</span> → ' +
      '<span>Cálculo de indicadores</span> → <span>Tablero, alertas y exportación</span></div>' +
      '<p class="nota">Aplicación web estática (HTML, CSS y JavaScript) sin servidor: los datos se procesan en el navegador y los registros manuales se guardan en el almacenamiento local. ' +
      'Librerías libres: Chart.js (MIT) para gráficos y SheetJS (Apache 2.0) para leer Excel.</p></div>';
  }

  // ---------- Backlog y tablero Scrum (HU-07, HU-08) ----------
  function renderBacklog() {
    var sprints = {};
    estado.backlog.forEach(function (h) { sprints[h.sprint] = true; });
    var selS = $('#b-sprint'), actual = selS.value;
    selS.innerHTML = '<option value="">Todos</option>' + Object.keys(sprints).sort(function (a, b) { return a - b; })
      .map(function (s) { return '<option value="' + s + '">Sprint ' + s + '</option>'; }).join('');
    selS.value = actual;
    var hs = estado.backlog.filter(function (h) { return !selS.value || String(h.sprint) === selS.value; });
    $('#kanban').innerHTML = C.estadosBacklog.map(function (est) {
      var col = hs.filter(function (h) { return h.estado === est; });
      var puntos = col.reduce(function (s, h) { return s + Number(h.puntos || 0); }, 0);
      return '<div class="columna"><h4><span>' + est + '</span><span>' + col.length + ' · ' + puntos + ' pts</span></h4>' +
        col.map(function (h) {
          return '<div class="tarjeta' + (est === 'Terminado' ? ' terminado' : '') + '"><b>' + esc(h.id) + '</b> ' + esc(h.nombre) +
            '<div class="meta"><span class="prioridad-' + esc(h.prioridad) + '">● ' + esc(h.prioridad) + '</span><span>Sprint ' + esc(h.sprint) + ' · ' + esc(h.puntos) + ' pts</span></div>' +
            '<div class="meta"><span>' + esc(h.responsable || '') + '</span></div>' +
            '<select data-hu="' + esc(h.id) + '" aria-label="Estado de ' + esc(h.id) + '">' + C.estadosBacklog.map(function (e) {
              return '<option' + (e === h.estado ? ' selected' : '') + '>' + e + '</option>';
            }).join('') + '</select></div>';
        }).join('') + '</div>';
    }).join('');
    document.querySelectorAll('#kanban select').forEach(function (s) {
      s.addEventListener('change', function () {
        var h = estado.backlog.filter(function (x) { return x.id === s.dataset.hu; })[0];
        h.estado = s.value; h.actualizado = new Date().toISOString();
        guardar('pt.backlog', estado.backlog);
        renderBacklog();
      });
    });
  }
  $('#b-sprint').addEventListener('change', renderBacklog);
  $('#form-hu').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target.elements, id = f.namedItem('id').value.trim().toUpperCase(), nombre = f.namedItem('nombre').value.trim();
    if (!id || !nombre) { $('#hu-errores').textContent = 'El ID y el nombre son obligatorios.'; return; }
    if (estado.backlog.some(function (h) { return h.id.toUpperCase() === id; })) { $('#hu-errores').textContent = 'Ya existe una historia con el ID ' + id + '.'; return; }
    $('#hu-errores').textContent = '';
    estado.backlog.push({ id: id, nombre: nombre, prioridad: f.prioridad.value, sprint: Number(f.sprint.value) || 1,
      puntos: Number(f.puntos.value) || 0, responsable: f.responsable.value.trim(), estado: 'Backlog' });
    guardar('pt.backlog', estado.backlog);
    e.target.reset(); renderBacklog(); avisar('Historia ' + id + ' agregada al backlog.');
  });
  $('#btn-reset-backlog').addEventListener('click', function () {
    if (!confirm('¿Restaurar el backlog original? Se perderán los cambios de estado hechos en este navegador.')) return;
    estado.backlog = C.backlog.map(function (h) { return Object.assign({}, h); });
    guardar('pt.backlog', estado.backlog); renderBacklog();
  });

  // ---------- Tablero OEE (base relacional) ----------
  function cargarOEE(nombre, hojas) {
    var modelo = O.construirModelo(hojas);
    // Solo se guardan las hojas que la app usa.
    var usadas = {};
    Object.keys(modelo.tablas).forEach(function (rol) { var h = modelo.tablas[rol].hoja; usadas[h] = hojas[h]; });
    estado.carga = { tipo: 'oee', nombre: nombre, modelo: modelo };
    renderCarga();
    if (!modelo.registros || !modelo.registros.length) {
      irA('cargar');
      avisar('No se encontraron registros válidos de producción para calcular el OEE.', 'error');
      return;
    }
    estado.archivo = { tipo: 'oee', nombre: nombre, cargado: new Date().toISOString(), hojas: usadas };
    estado.modelo = modelo;
    guardar('pt.archivo', estado.archivo);
    ['#o-desde', '#o-hasta', '#o-maquina', '#o-linea', '#o-turno'].forEach(function (s) { $(s).value = ''; });
    actualizarCabecera();
    irA('tablero');
    avisar('Tablero OEE generado: ' + modelo.registros.length + ' turnos-máquina, ' + modelo.produccion.length + ' registros de producción y ' +
      modelo.paros.length + ' paros' + (modelo.errores.length ? '; ' + modelo.errores.length + ' fila(s) con errores (ver «Cargar datos»)' : '') + '.');
  }

  function renderCargaOEE(c) {
    var m = c.modelo;
    $('#carga-titulo').textContent = c.nombre + ' · base relacional OEE';
    $('#carga-hoja-label').hidden = true;
    $('#carga-estado').innerHTML = '<div class="estado-carga">' +
      '<div><b class="ok">' + (m.registros ? m.registros.length : 0) + '</b>turnos-máquina</div>' +
      '<div><b>' + m.produccion.length + '</b>registros de producción</div>' +
      '<div><b>' + m.paros.length + '</b>paros</div>' +
      '<div><b class="' + (m.errores.length ? 'mal' : 'ok') + '">' + m.errores.length + '</b>filas con errores</div>' +
      '<div><b>' + m.advertencias.length + '</b>advertencias</div></div>' +
      (m.faltantes && m.faltantes.length ? '<p class="mal">Falta: ' + esc(m.faltantes.join(', ')) + '.</p>' : '');
    var nombresCampo = {};
    Object.keys(O.CAMPOS).forEach(function (k) { nombresCampo[k] = k; });
    $('#carga-tablas').innerHTML = '<tr><th class="txt">Tabla</th><th class="txt">Hoja del archivo</th><th class="txt">Columnas reconocidas</th></tr>' +
      O.TABLAS.map(function (def) {
        var t = m.tablas[def.rol];
        if (!t) return '<tr><td class="txt">' + esc(def.nombre) + '</td><td class="txt nota" colspan="2">No encontrada' +
          (def.rol === 'pedidos' ? ' (necesaria para el SLA)' : def.rol === 'ventas' ? ' (necesaria para el % no vendido)' : '') + '</td></tr>';
        var cols = Object.keys(t.mapa).map(function (k) { return k + ' ← «' + t.encabezados[t.mapa[k]] + '»'; });
        return '<tr><td class="txt">' + esc(def.nombre) + '</td><td class="txt"><b>' + esc(t.hoja) + '</b></td><td class="txt" style="white-space:normal">' + esc(cols.join(' · ')) + '</td></tr>';
      }).join('');
    $('#carga-errores-panel').hidden = !m.errores.length && !m.advertencias.length;
    $('#carga-errores').innerHTML = m.errores.slice(0, 200).map(function (e) {
      return '<li class="mal">' + esc(e.hoja) + ', fila ' + e.fila + ': ' + esc(e.mensaje) + '</li>';
    }).concat(m.advertencias.map(function (a) { return '<li>' + esc(a) + '</li>'; })).join('');
  }

  function fechaCorta(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + '/' + p[1] : iso; }
  function nombreMaquina(id) { var q = estado.modelo.maquinas[id]; return q && q.nombre !== id ? q.nombre + ' (' + id + ')' : id; }

  function filtrosOEE() {
    return { desde: $('#o-desde').value, hasta: $('#o-hasta').value, maquina: $('#o-maquina').value, linea: $('#o-linea').value, turno: $('#o-turno').value };
  }
  function actualizarFiltrosOEE() {
    var m = estado.modelo, unicos = function (campo) {
      var v = {}; m.registros.forEach(function (r) { if (r[campo]) v[r[campo]] = true; });
      return Object.keys(v).sort();
    };
    var fechas = unicos('fecha');
    llenarSelect($('#o-desde'), fechas, 'Inicio');
    llenarSelect($('#o-hasta'), fechas, 'Fin');
    llenarSelect($('#o-maquina'), unicos('maquina'), 'Todas');
    llenarSelect($('#o-linea'), unicos('linea'), 'Todas');
    llenarSelect($('#o-turno'), unicos('turno'), 'Todos');
    $('#o-linea').disabled = unicos('linea').length === 0;
  }
  ['#o-desde', '#o-hasta', '#o-maquina', '#o-linea', '#o-turno'].forEach(function (s) { $(s).addEventListener('change', renderTablero); });
  $('#o-limpiar').addEventListener('click', function () {
    ['#o-desde', '#o-hasta', '#o-maquina', '#o-linea', '#o-turno'].forEach(function (s) { $(s).value = ''; });
    renderTablero();
  });

  var COLORES_OEE = { oee: '#b45309', A: '#2563eb', R: '#0f766e', Q: '#7c3aed', paro: '#dc2626', meta: '#6b7280' };

  function renderTableroOEE() {
    actualizarFiltrosOEE();
    var m = estado.modelo, a = O.analizar(m, filtrosOEE()), t = a.total, M = estado.metas;
    var pctM = function (k) { return tieneMeta(k) ? Number(M[k]) : null; };
    $('#o-resumen').textContent = t.registros
      ? t.registros + ' turnos-máquina · ' + a.porFecha.length + ' día(s)' + (a.porFecha.length ? ' (' + a.porFecha[0].clave + ' a ' + a.porFecha[a.porFecha.length - 1].clave + ')' : '') +
        ' · ' + a.porMaquina.length + ' máquina(s) · ' + fmt.num(t.programado / 60, 1) + ' h programadas'
      : 'Ningún registro cumple los filtros seleccionados.';
    var p100 = function (v) { return v == null ? null : v * 100; };
    $('#o-kpis').innerHTML = [
      tarjeta('OEE', fmt.frac(t.oee), '', 'disponibilidad × rendimiento × calidad', 'oee', 'min', p100(t.oee)),
      tarjeta('Disponibilidad', fmt.frac(t.A), '', fmt.num(t.paros / 60, 1) + ' h de paros de ' + fmt.num(t.programado / 60, 1) + ' h', 'disponibilidad', 'min', p100(t.A)),
      tarjeta('Rendimiento', fmt.frac(t.R), '', fmt.num(t.idealMin / 60, 1) + ' h ideales de ' + fmt.num(t.producido / 60, 1) + ' h', 'rendimiento', 'min', p100(t.R)),
      tarjeta('Calidad', fmt.frac(t.Q), '', fmt.num(t.defectuosas) + ' defectuosas de ' + fmt.num(t.unidades), 'calidad', 'min', p100(t.Q)),
      tarjeta('Unidades buenas', fmt.num(t.buenas), 'unid.', fmt.num(t.unidades) + ' producidas'),
      tarjeta('Productividad de mano de obra', fmt.num(a.productividad.valor, 1), 'unid./h-h', fmt.num(a.productividad.horas, 1) + ' horas-hombre', 'productividadMO', 'min', a.productividad.valor),
      tarjeta('SLA (cliente)', a.sla ? fmt.pct(a.sla.valor) : 'N/D', '', a.sla ? a.sla.aTiempo + ' de ' + a.sla.total + ' pedidos a tiempo' : 'el archivo no trae pedidos con fecha compromiso y entrega', 'sla', 'min', a.sla && a.sla.valor),
      tarjeta('% no vendido', a.noVendido ? fmt.pct(a.noVendido.valor) : 'N/D', '', a.noVendido ? fmt.num(a.noVendido.unidades) + ' unidades sin vender' : 'el archivo no trae ventas', 'noVendido', 'max', a.noVendido && a.noVendido.valor)
    ].join('');

    var fechas = a.porFecha.map(function (g) { return fechaCorta(g.clave); }), n = fechas.length;
    var serie = function (arr, k) { return arr.map(function (g) { return g[k] == null ? null : g[k] * 100; }); };
    var dsDia = [
      { label: 'OEE', data: serie(a.porFecha, 'oee'), borderColor: COLORES_OEE.oee, backgroundColor: COLORES_OEE.oee, borderWidth: 3, tension: .2 },
      { label: 'Disponibilidad', data: serie(a.porFecha, 'A'), borderColor: COLORES_OEE.A, backgroundColor: COLORES_OEE.A, borderWidth: 1.5, pointRadius: 1.5, tension: .2 },
      { label: 'Rendimiento', data: serie(a.porFecha, 'R'), borderColor: COLORES_OEE.R, backgroundColor: COLORES_OEE.R, borderWidth: 1.5, pointRadius: 1.5, tension: .2 },
      { label: 'Calidad', data: serie(a.porFecha, 'Q'), borderColor: COLORES_OEE.Q, backgroundColor: COLORES_OEE.Q, borderWidth: 1.5, pointRadius: 1.5, tension: .2 }
    ];
    if (pctM('oee') !== null) dsDia.push(lineaMeta('Meta OEE', M.oee, n));
    var ejePct = { y: { min: 0, max: 100, title: { display: true, text: '%' } } };
    grafico('g-oee-dia', { type: 'line', data: { labels: fechas, datasets: dsDia },
      options: { scales: ejePct, plugins: { tooltip: { mode: 'index', intersect: false } } } });

    var maqs = a.porMaquina.map(function (g) { return nombreMaquina(g.clave); });
    grafico('g-oee-maquina', { type: 'bar', data: { labels: maqs, datasets: [
      { label: 'Disponibilidad', data: serie(a.porMaquina, 'A'), backgroundColor: COLORES_OEE.A },
      { label: 'Rendimiento', data: serie(a.porMaquina, 'R'), backgroundColor: COLORES_OEE.R },
      { label: 'Calidad', data: serie(a.porMaquina, 'Q'), backgroundColor: COLORES_OEE.Q },
      { label: 'OEE', data: serie(a.porMaquina, 'oee'), backgroundColor: COLORES_OEE.oee }
    ] }, options: { scales: ejePct, plugins: { tooltip: { mode: 'index', intersect: false } } } });

    // Cascada: tiempo programado → paros → pérdida de velocidad → pérdida de calidad → tiempo efectivo.
    var h = function (v) { return v / 60; };
    var efectivo = t.Q == null ? t.idealMin : t.idealMin * t.Q;
    grafico('g-cascada', { type: 'bar', data: {
      labels: ['Tiempo programado', 'Paros', 'Pérdida de velocidad', 'Pérdida de calidad', 'Tiempo efectivo'],
      datasets: [{ label: 'horas', data: [[0, h(t.programado)], [h(t.producido), h(t.programado)], [h(t.idealMin), h(t.producido)], [h(efectivo), h(t.idealMin)], [0, h(efectivo)]],
        backgroundColor: [COLORES_OEE.A, COLORES_OEE.paro, '#d97706', COLORES_OEE.Q, COLORES_OEE.oee] }] },
      options: { plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (c) { var v = c.raw; return fmt.num(v[1] - v[0], 1) + ' h'; } } } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'horas' } } } } });

    var par = a.pareto.slice(0, 10);
    grafico('g-pareto', { type: 'bar', data: { labels: par.map(function (x) { return x.motivo; }), datasets: [
      { type: 'line', label: '% acumulado', data: par.map(function (x) { return x.acumulado; }), borderColor: COLORES_OEE.oee, backgroundColor: COLORES_OEE.oee, yAxisID: 'y1', tension: .1 },
      { label: 'Minutos', data: par.map(function (x) { return x.minutos; }), backgroundColor: COLORES_OEE.paro, yAxisID: 'y' }
    ] }, options: { scales: { y: { beginAtZero: true, title: { display: true, text: 'min' } },
      y1: { position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, title: { display: true, text: '% acumulado' } },
      x: { ticks: { callback: function (v) { var l = this.getLabelForValue(v); return l.length > 18 ? l.slice(0, 17) + '…' : l; } } } } } });

    var ops = a.productividad.operadores;
    var dsOp = [{ label: 'unid./h-h', data: ops.map(function (o) { return o.valor; }), backgroundColor: COLORES_OEE.R }];
    if (tieneMeta('productividadMO')) dsOp.push(lineaMeta('Meta', M.productividadMO, ops.length));
    grafico('g-operadores', { type: 'bar', data: { labels: ops.map(function (o) { return o.nombre; }), datasets: dsOp },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'unid./h-h' } } } } });

    grafico('g-oee-turno', { type: 'bar', data: { labels: a.porTurno.map(function (g) { return 'Turno ' + g.clave; }), datasets: [
      { label: 'Disponibilidad', data: serie(a.porTurno, 'A'), backgroundColor: COLORES_OEE.A },
      { label: 'Rendimiento', data: serie(a.porTurno, 'R'), backgroundColor: COLORES_OEE.R },
      { label: 'Calidad', data: serie(a.porTurno, 'Q'), backgroundColor: COLORES_OEE.Q },
      { label: 'OEE', data: serie(a.porTurno, 'oee'), backgroundColor: COLORES_OEE.oee }
    ] }, options: { scales: ejePct } });

    renderAlertasOEE(a);
  }

  function renderAlertasOEE(a) {
    var t = a.total, M = estado.metas, items = [];
    if (!t.registros) { $('#o-alertas').innerHTML = '<h3>Hallazgos</h3><p class="nota">Sin registros en el filtro.</p>'; return; }
    if (t.oee != null && tieneMeta('oee')) {
      var ok = t.oee * 100 >= Number(M.oee);
      items.push({ c: ok ? 'bien' : 'mal', t: 'OEE de ' + fmt.frac(t.oee) + ' frente a una meta de ' + fmt.num(M.oee, 1) + ' %' +
        (ok ? '.' : ': se pierden ' + fmt.num((Number(M.oee) / 100 - t.oee) * t.programado / 60, 1) + ' h equivalentes de producción buena.') });
    }
    var factores = [{ n: 'disponibilidad', v: t.A, k: 'disponibilidad' }, { n: 'rendimiento', v: t.R, k: 'rendimiento' }, { n: 'calidad', v: t.Q, k: 'calidad' }]
      .filter(function (f) { return f.v != null; }).sort(function (x, y) { return x.v - y.v; });
    if (factores.length) {
      var f = factores[0], detalle = '';
      if (f.k === 'disponibilidad') detalle = ': ' + fmt.num(t.paros / 60, 1) + ' h de paros no programados (' + fmt.pct(t.paros / t.programado * 100) + ' del tiempo programado).';
      if (f.k === 'rendimiento') detalle = ': ' + fmt.num((t.producido - t.idealMin) / 60, 1) + ' h perdidas por marcha lenta o microparos no registrados.';
      if (f.k === 'calidad') detalle = ': ' + fmt.num(t.defectuosas) + ' unidades defectuosas.';
      items.push({ c: 'mal', t: 'El factor más bajo es la ' + f.n + ' (' + fmt.frac(f.v) + ')' + detalle });
    }
    if (a.pareto.length) {
      var top = [], acum = 0;
      a.pareto.forEach(function (p) { if (acum < 80) { top.push(p.motivo + ' (' + fmt.pct(p.pct) + ')'); acum = p.acumulado; } });
      items.push({ c: '', t: 'Pareto de paros: ' + (top.length === 1 ? a.pareto[0].motivo + ' concentra el ' + fmt.pct(acum) :
        top.join(', ') + ' explican el ' + fmt.pct(acum)) + ' del tiempo de paro no programado.' });
    }
    var conOEE = a.porMaquina.filter(function (g) { return g.oee != null; });
    if (conOEE.length > 1) {
      var mej = conOEE.reduce(function (x, y) { return y.oee > x.oee ? y : x; }), peor = conOEE.reduce(function (x, y) { return y.oee < x.oee ? y : x; });
      items.push({ c: '', t: 'Máquina con mayor OEE: ' + nombreMaquina(mej.clave) + ' (' + fmt.frac(mej.oee) + '); menor: ' + nombreMaquina(peor.clave) + ' (' + fmt.frac(peor.oee) + ').' });
    }
    if (a.porTurno.length > 1) {
      items.push({ c: '', t: 'OEE por turno: ' + a.porTurno.map(function (g) { return 'turno ' + g.clave + ' ' + fmt.frac(g.oee); }).join(' · ') + '.' });
    }
    var dias = a.porFecha.filter(function (g) { return g.oee != null; });
    if (dias.length > 1) {
      var pd = dias.reduce(function (x, y) { return y.oee < x.oee ? y : x; });
      items.push({ c: '', t: 'Día con menor OEE: ' + pd.clave + ' (' + fmt.frac(pd.oee) + ').' });
    }
    var ops = a.productividad.operadores.filter(function (o) { return o.valor != null; });
    if (ops.length > 1) {
      var om = ops.reduce(function (x, y) { return y.valor > x.valor ? y : x; }), op = ops.reduce(function (x, y) { return y.valor < x.valor ? y : x; });
      items.push({ c: '', t: 'Productividad de mano de obra: ' + fmt.num(a.productividad.valor, 1) + ' unid./h-h; mayor ' + om.nombre + ' (' + fmt.num(om.valor, 1) + '), menor ' + op.nombre + ' (' + fmt.num(op.valor, 1) + ').' });
    }
    if (!a.sla) items.push({ c: '', t: 'SLA: agregue una hoja de pedidos con fecha compromiso y fecha de entrega para calcularlo.' });
    else if (tieneMeta('sla')) items.push({ c: a.sla.valor >= Number(M.sla) ? 'bien' : 'mal', t: 'SLA de ' + fmt.pct(a.sla.valor) + ' frente a una meta de ' + fmt.num(M.sla, 1) + ' %.' });
    if (!a.noVendido) items.push({ c: '', t: '% no vendido: agregue una hoja de ventas (unidades vendidas o no vendidas) para calcularlo.' });
    else if (tieneMeta('noVendido')) items.push({ c: a.noVendido.valor <= Number(M.noVendido) ? 'bien' : 'mal', t: '% no vendido de ' + fmt.pct(a.noVendido.valor) + ' frente a un máximo de ' + fmt.num(M.noVendido, 1) + ' %.' });
    $('#o-alertas').innerHTML = '<h3>Hallazgos</h3><ul>' + items.map(function (x) { return '<li class="' + x.c + '">' + esc(x.t) + '</li>'; }).join('') + '</ul>';
  }

  function renderDatosOEE(t) {
    actualizarFiltrosOEE();
    var q = I.normalizar($('#buscar').value);
    var regs = O.filtrar(estado.modelo, filtrosOEE()).registros.filter(function (r) {
      return !q || I.normalizar([r.fecha, r.turno, r.maquina, r.linea, nombreMaquina(r.maquina)].join(' ')).indexOf(q) !== -1;
    });
    t.innerHTML = '<tr><th class="txt">Fecha</th><th class="txt">Turno</th><th class="txt">Máquina</th><th class="txt">Línea</th><th>Tiempo base</th><th>Paros excluidos</th>' +
      '<th>Tiempo programado</th><th>Paros</th><th>Tiempo producido</th><th>Disponibilidad</th><th>Unidades</th><th>Defectuosas</th><th>Buenas</th>' +
      '<th>Calidad</th><th>Tiempo ideal</th><th>Rendimiento</th><th>OEE</th></tr>' +
      regs.map(function (r) {
        return '<tr><td class="txt">' + esc(r.fecha) + '</td><td class="txt">' + esc(r.turno) + '</td><td class="txt">' + esc(r.maquina) + '</td><td class="txt">' + esc(r.linea) +
          '</td><td>' + fmt.num(r.base, 1) + '</td><td>' + fmt.num(r.excluidos, 1) + '</td><td>' + fmt.num(r.programado, 1) + '</td><td>' + fmt.num(r.paros, 2) +
          '</td><td>' + fmt.num(r.producido, 2) + '</td><td>' + fmt.frac(r.A) + '</td><td>' + fmt.num(r.unidades) + '</td><td>' + fmt.num(r.defectuosas) + '</td><td>' + fmt.num(r.buenas) +
          '</td><td>' + fmt.frac(r.Q) + '</td><td>' + fmt.num(r.idealMin, 2) + '</td><td>' + fmt.frac(r.R) + '</td><td><b>' + fmt.frac(r.oee) + '</b></td></tr>';
      }).join('');
  }

  $('#o-exportar').addEventListener('click', function () {
    var d = function (v, n) { return v == null ? '' : Number(v).toFixed(n).replace('.', ','); };
    var filas = [['Fecha', 'Turno', 'Máquina', 'Línea', 'Tiempo base (min)', 'Paros excluidos (min)', 'Tiempo programado (min)', 'Paros (min)', 'Tiempo producido (min)',
      'Disponibilidad', 'Unidades', 'Defectuosas', 'Buenas', 'Calidad', 'Tiempo ideal (min)', 'Rendimiento', 'OEE']].concat(
      O.filtrar(estado.modelo, filtrosOEE()).registros.map(function (r) {
        return [r.fecha, r.turno, r.maquina, r.linea, d(r.base, 2), d(r.excluidos, 2), d(r.programado, 2), d(r.paros, 2), d(r.producido, 2), d(r.A, 4),
          r.unidades, r.defectuosas, r.buenas, d(r.Q, 4), d(r.idealMin, 2), d(r.R, 4), d(r.oee, 4)];
      }));
    descargar('oee.csv', '﻿' + filas.map(function (f) { return f.join(';'); }).join('\r\n'));
  });
  $('#o-imprimir').addEventListener('click', function () { window.print(); });

  function usarEjemploOEE() {
    if (!window.DATOS_EJEMPLO_OEE) { avisar('No se encontró la base OEE de ejemplo.', 'error'); return; }
    cargarOEE('Ejemplo: ' + DATOS_EJEMPLO_OEE.nombre, DATOS_EJEMPLO_OEE.hojas);
  }
  $('#btn-ejemplo-oee').addEventListener('click', usarEjemploOEE);
  $('#btn-ejemplo-oee-vacio').addEventListener('click', usarEjemploOEE);

  // ---------- Inicio ----------
  actualizarCabecera();
  renderProceso();
  renderTablero();
})();
