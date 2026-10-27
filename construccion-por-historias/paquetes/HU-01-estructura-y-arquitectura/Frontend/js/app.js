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
