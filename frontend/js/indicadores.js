/*
 * indicadores.js — Cálculo de los indicadores definidos en las fichas técnicas (HU-10, HU-11).
 *
 * Los consolidados se calculan como razón de sumas (Σ defectuosos / Σ producidos),
 * no como promedio de porcentajes, para que coincidan con los totales del periodo.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Indicadores = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function suma(lotes, campo) {
    return lotes.reduce(function (s, l) { return s + (l[campo] == null ? 0 : l[campo]); }, 0);
  }
  function todosTienen(lotes, campo) {
    return lotes.length > 0 && lotes.every(function (l) { return l[campo] != null; });
  }
  function div(a, b) { return b > 0 ? a / b : null; }

  // Indicadores de un lote (se muestran en la tabla junto a sus datos de origen).
  function porLote(l) {
    return {
      pctDefectos: div(l.defectuosos, l.producidos) === null ? null : div(l.defectuosos, l.producidos) * 100,
      pctAprobados: div(l.aprobados, l.producidos) === null ? null : div(l.aprobados, l.producidos) * 100,
      productividad: l.tiempo == null ? null : div(l.producidos, l.tiempo),
      pctDesperdicio: l.desperdicio == null || l.materia == null ? null : div(l.desperdicio, l.materia) * 100
    };
  }

  // Consolidado de un conjunto de lotes.
  function resumen(lotes) {
    var producidos = suma(lotes, 'producidos');
    var defectuosos = suma(lotes, 'defectuosos');
    var aprobados = suma(lotes, 'aprobados');
    var conTiempo = lotes.filter(function (l) { return l.tiempo != null; });
    var conMateria = lotes.filter(function (l) { return l.materia != null && l.desperdicio != null; });
    var tiempo = suma(conTiempo, 'tiempo');
    var materia = suma(conMateria, 'materia');
    var desperdicio = suma(conMateria, 'desperdicio');
    var productividad = div(suma(conTiempo, 'producidos'), tiempo);
    return {
      lotes: lotes.length,
      periodos: agruparPorPeriodo(lotes).length,
      producidos: producidos,
      defectuosos: defectuosos,
      aprobados: aprobados,
      pctDefectos: div(defectuosos, producidos) === null ? null : div(defectuosos, producidos) * 100,
      pctAprobados: div(aprobados, producidos) === null ? null : div(aprobados, producidos) * 100,
      tiempoTotal: conTiempo.length ? tiempo : null,
      tiempoPromedio: conTiempo.length ? tiempo / conTiempo.length : null,
      productividad: productividad,                      // panes/min
      productividadHora: productividad === null ? null : productividad * 60,
      materia: conMateria.length ? materia : null,
      desperdicio: conMateria.length ? desperdicio : null,
      pctDesperdicio: conMateria.length && materia > 0 ? desperdicio / materia * 100 : null,
      masa: todosTienen(lotes, 'masa') ? suma(lotes, 'masa') : null
    };
  }

  // Clave de periodo: la fecha si existe, si no el número de día, si no el propio lote.
  function clavePeriodo(l) {
    if (l.fecha) return l.fecha;
    if (l.dia != null) return 'Día ' + l.dia;
    return 'Lote ' + l.lote;
  }
  function ordenPeriodo(l) {
    if (l.fecha) return Date.parse(l.fecha) || 0;
    if (l.dia != null) return l.dia;
    return 0;
  }

  // Agrupa los lotes por periodo y calcula el resumen de cada grupo, en orden cronológico.
  function agruparPorPeriodo(lotes) {
    var grupos = {}, orden = [];
    lotes.forEach(function (l, i) {
      var k = clavePeriodo(l);
      if (!grupos[k]) { grupos[k] = { clave: k, orden: ordenPeriodo(l), idx: i, lotes: [] }; orden.push(k); }
      grupos[k].lotes.push(l);
    });
    return orden.map(function (k) { return grupos[k]; })
      .sort(function (a, b) { return a.orden - b.orden || a.idx - b.idx; })
      .map(function (g) {
        var r = resumenSimple(g.lotes);
        r.clave = g.clave; r.lotesGrupo = g.lotes;
        return r;
      });
  }
  // Igual que resumen() pero sin recursión sobre periodos.
  function resumenSimple(lotes) {
    var producidos = suma(lotes, 'producidos'), defectuosos = suma(lotes, 'defectuosos'), aprobados = suma(lotes, 'aprobados');
    var conTiempo = lotes.filter(function (l) { return l.tiempo != null; });
    var conMateria = lotes.filter(function (l) { return l.materia != null && l.desperdicio != null; });
    var materia = suma(conMateria, 'materia');
    return {
      lotes: lotes.length, producidos: producidos, defectuosos: defectuosos, aprobados: aprobados,
      pctDefectos: producidos > 0 ? defectuosos / producidos * 100 : null,
      pctAprobados: producidos > 0 ? aprobados / producidos * 100 : null,
      productividad: div(suma(conTiempo, 'producidos'), suma(conTiempo, 'tiempo')),
      tiempoPromedio: conTiempo.length ? suma(conTiempo, 'tiempo') / conTiempo.length : null,
      pctDesperdicio: materia > 0 ? suma(conMateria, 'desperdicio') / materia * 100 : null
    };
  }

  /*
   * Carta de control p (fracción defectuosa) por lote, con límites 3σ variables:
   * LC = p̄,  LSC/LIC = p̄ ± 3·√(p̄(1−p̄)/nᵢ). El LIC no baja de 0.
   */
  function cartaP(lotes) {
    var n = suma(lotes, 'producidos'), d = suma(lotes, 'defectuosos');
    var pBar = n > 0 ? d / n : 0;
    var puntos = lotes.map(function (l) {
      var p = l.producidos > 0 ? l.defectuosos / l.producidos : 0;
      var sigma = l.producidos > 0 ? Math.sqrt(pBar * (1 - pBar) / l.producidos) : 0;
      var lsc = pBar + 3 * sigma, lic = Math.max(0, pBar - 3 * sigma);
      return { p: p, lsc: lsc, lic: lic, fuera: p > lsc || p < lic };
    });
    return { pBar: pBar, puntos: puntos, fueraDeControl: puntos.filter(function (x) { return x.fuera; }).length };
  }

  // Tiempo promedio por etapa (para identificar el cuello de botella).
  function tiemposPorEtapa(lotes) {
    var acum = {}, cuenta = {}, orden = [];
    lotes.forEach(function (l) {
      Object.keys(l.etapas || {}).forEach(function (e) {
        if (acum[e] === undefined) { acum[e] = 0; cuenta[e] = 0; orden.push(e); }
        acum[e] += l.etapas[e]; cuenta[e]++;
      });
    });
    var etapas = orden.map(function (e) { return { etapa: e, promedio: acum[e] / cuenta[e] }; });
    var total = etapas.reduce(function (s, x) { return s + x.promedio; }, 0);
    etapas.forEach(function (x) { x.participacion = total > 0 ? x.promedio / total * 100 : 0; });
    var cuello = etapas.reduce(function (m, x) { return !m || x.promedio > m.promedio ? x : m; }, null);
    return { etapas: etapas, cuelloDeBotella: cuello ? cuello.etapa : null };
  }

  /*
   * Semáforo frente a la meta. sentido 'max' = el valor no debe superar la meta
   * (defectos, desperdicio); 'min' = el valor debe alcanzarla (aprobación, productividad).
   * Amarillo: incumple por menos del 10 % de la meta.
   */
  function semaforo(valor, meta, sentido) {
    if (valor == null || meta == null || meta === '' || isNaN(meta)) return 'sin-meta';
    meta = Number(meta);
    var cumple = sentido === 'max' ? valor <= meta : valor >= meta;
    if (cumple) return 'verde';
    var desvio = Math.abs(valor - meta) / (Math.abs(meta) || 1);
    return desvio <= 0.1 ? 'amarillo' : 'rojo';
  }

  return {
    porLote: porLote, resumen: resumen, agruparPorPeriodo: agruparPorPeriodo,
    cartaP: cartaP, tiemposPorEtapa: tiemposPorEtapa, semaforo: semaforo, clavePeriodo: clavePeriodo
  };
});
