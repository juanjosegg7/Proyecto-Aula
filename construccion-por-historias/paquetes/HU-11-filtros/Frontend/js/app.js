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

  var estado = {
    archivo: null,                               // { nombre, cargado, hojas }
    modelo: null,
    metas: Object.assign(metasDefecto(), leer('pt.metas.fichas', {})),
    graficos: {}
  };
  estado.archivo = leer('pt.base', null);
  if (estado.archivo) {
    try { estado.modelo = M.construirModelo(estado.archivo.hojas); } catch (e) { estado.archivo = null; }
  }

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
    modelo.registros = K.calcularRegistros(modelo);
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
    ['#f-desde', '#f-hasta', '#f-turno', '#f-maquina', '#f-linea'].forEach(function (s) { $(s).value = ''; });
    irA('tablero');
    avisar('Tablero generado: ' + modelo.registros.length + ' turnos, ' + modelo.produccion.length + ' registros de producción y ' +
      modelo.paros.length + ' paros' + (modelo.errores.length ? '; ' + modelo.errores.length + ' fila(s) con errores (ver «Cargar datos»)' : '') + '.');
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
  $('#btn-ejemplo-vacio').addEventListener('click', usarEjemplo);

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
  function filtros() {
    return { desde: $('#f-desde').value, hasta: $('#f-hasta').value, turno: $('#f-turno').value,
      maquina: $('#f-maquina').value, linea: $('#f-linea').value };
  }
  function nombreEquipo(id) {
    var q = estado.modelo && estado.modelo.maquinas[id];
    return q && q.nombre !== id ? q.nombre + ' (' + id + ')' : id;
  }

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

  // ---------- Tablero ----------
  function tarjeta(etiqueta, valor, unidad, detalle, clave, valorNum) {
    var sem = 'sin-meta', meta = '';
    sem = clave ? semaforo(clave, valorNum) : 'sin-meta';
    var l = clave ? limites(clave) : null, ind = INDICADORES.filter(function (i) { return i.clave === clave; })[0];
    meta = l && valorNum != null ? ' · meta ' + (ind.sentido === 'max' ? '≤ ' : '≥ ') + fmt.num(l.verde, 1) : '';
    var textos = { verde: '● Cumple la meta', amarillo: '● En alerta', rojo: '● Fuera de meta', 'sin-meta': '' };
    return '<div class="kpi ' + sem + '"><div class="etiqueta">' + esc(etiqueta) + '</div>' +
      '<div class="valor">' + valor + (unidad ? ' <span class="unidad">' + unidad + '</span>' : '') + '</div>' +
      '<div class="detalle">' + esc(detalle || '') + meta + '</div>' +
      (textos[sem] ? '<div class="estado">' + textos[sem] + '</div>' : '') + '</div>';
  }

  function renderTablero() {
    var hay = !!estado.modelo;
    $('#tablero-vacio').hidden = hay;
    $('#tablero').hidden = !hay;
    if (!hay) return;
    if (!estado.modelo.registros) estado.modelo.registros = K.calcularRegistros(estado.modelo);
    actualizarFiltros();
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
    var sla = a.sla;
    tarjetas.push(tarjeta('SLA de pedidos (OTIF)', sla ? fmt.pct(sla.valor) : 'N/D', '',
      sla ? sla.aTiempo + ' de ' + sla.total + ' pedidos a tiempo y completos' + (filtros().turno ? ' (los pedidos no dependen del turno)' : '')
        : 'el archivo no trae pedidos', 'sla', sla && sla.valor));
    var nv = a.noVendido;
    tarjetas.push(tarjeta('% no vendido', nv && nv.valor != null ? fmt.pct(nv.valor) : 'N/D', '',
      nv ? (nv.valor == null ? nv.motivo : fmt.num(nv.unidades) + ' trenzas buenas sin vender') : 'el archivo no trae ventas', 'noVendido', nv && nv.valor));
    var pr = a.productividad;
    tarjetas.push(tarjeta('Productividad de mano de obra', fmt.num(pr.valor, 2), 'trenzas/h-h', fmt.num(pr.horas, 1) + ' horas-hombre' +
      (limites('productividad') ? '' : ' · defina la línea base en Metas') +
      '', 'productividad', pr.valor));
    tarjetas.push(tarjeta('Trenzas buenas', fmt.num(t.buenas), '', fmt.num(t.unidades) + ' producidas en ' + fmt.num(a.datos.produccion.length) + ' tandas'));
    $('#kpis').innerHTML = tarjetas.join('');
  }




  // ---------- Inicio ----------
  renderMetas();
  actualizarCabecera();
  renderTablero();
})();
