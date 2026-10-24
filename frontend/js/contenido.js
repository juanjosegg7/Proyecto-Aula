/*
 * contenido.js — Información fija del proyecto: fichas técnicas (HU-11), empresa,
 * SIPOC y estrategia (HU-01 a HU-05) y backlog inicial (HU-07). Fuente: carpeta docs/.
 */
window.Contenido = {
  fichas: [
    {
      clave: 'pctDefectos', nombre: 'Porcentaje de defectos', tipo: 'Calidad / eficiencia', unidad: '%',
      objetivo: 'Medir qué porcentaje de los panes producidos presenta defectos durante el proceso.',
      formula: '% Defectos = (Panes defectuosos / Panes producidos) × 100',
      frecuencia: 'Por lote y consolidado por jornada, semana o mes.',
      responsable: 'Responsable de producción / encargado del proceso.',
      fuente: 'Datos de producción: panes producidos y panes defectuosos.',
      meta: 'Nivel bajo. El 5 % de la simulación es un supuesto que debe reemplazarse por la meta real.',
      interpretacion: 'Un valor menor representa una menor proporción de productos defectuosos.',
      ejemplo: '112 panes producidos y 6 defectuosos → (6/112) × 100 = 5,36 %'
    },
    {
      clave: 'pctAprobados', nombre: 'Porcentaje de producción aprobada', tipo: 'Calidad', unidad: '%',
      objetivo: 'Medir la proporción de panes producidos que cumplen los criterios y son aprobados.',
      formula: '% Aprobada = (Panes aprobados / Panes producidos) × 100',
      frecuencia: 'Por lote y consolidado por jornada, semana o mes.',
      responsable: 'Responsable de producción / encargado del proceso.',
      fuente: 'Datos de producción: panes producidos y panes aprobados.',
      meta: 'Alto y estable. La meta definitiva la define la empresa.',
      interpretacion: 'Un valor cercano al 100 % indica que una mayor proporción de la producción fue aprobada.',
      ejemplo: '112 panes producidos y 106 aprobados → (106/112) × 100 = 94,64 %'
    },
    {
      clave: 'productividad', nombre: 'Productividad', tipo: 'Productividad / eficiencia', unidad: 'panes/min (y panes/h)',
      objetivo: 'Medir la cantidad de panes producidos en relación con el tiempo utilizado en producción.',
      formula: 'Productividad = Panes producidos / Tiempo de producción',
      frecuencia: 'Por lote y consolidado por jornada, semana o mes.',
      responsable: 'Responsable de producción.',
      fuente: 'Datos de producción: panes producidos y tiempo de producción.',
      meta: 'Mantener o mejorar la producción por unidad de tiempo sin afectar la calidad.',
      interpretacion: 'Un valor mayor representa más panes producidos por minuto, manteniendo la calidad.',
      ejemplo: '112 panes en 66 minutos → 112/66 = 1,70 panes/min'
    },
    {
      clave: 'pctDesperdicio', nombre: 'Porcentaje de desperdicio', tipo: 'Eficiencia / costos', unidad: '%',
      objetivo: 'Medir qué proporción de la materia prima utilizada termina como desperdicio.',
      formula: '% Desperdicio = (Materia prima desperdiciada / Materia prima utilizada) × 100',
      frecuencia: 'Por lote y consolidado por jornada, semana o mes.',
      responsable: 'Responsable de producción / encargado de materias primas.',
      fuente: 'Datos de producción: materia prima utilizada y desperdiciada.',
      meta: 'Menor al 5 % (indicador principal de la estrategia, HU-03).',
      interpretacion: 'Un porcentaje menor indica menor desperdicio de la materia prima utilizada.',
      ejemplo: '50 kg utilizados y 2,5 kg desperdiciados → (2,5/50) × 100 = 5 %'
    }
  ],

  empresa: [
    ['Empresa', 'Panadería La Trenza Dorada (nombre anonimizado)'],
    ['Ubicación', 'Envigado, Antioquia'],
    ['Proceso monitoreado', 'Fabricación de pan trenza'],
    ['Responsable del proceso', 'Andrés Felipe Gómez'],
    ['Capacidad', '500 unidades/día'],
    ['Lote de referencia', '112 panes (4 arrobas ≈ 50 kg de masa)'],
    ['Materias primas', 'Harina de trigo, agua, levadura, azúcar, sal, mantequilla y huevos']
  ],

  estrategia: [
    ['Estrategia corporativa', 'Mejorar la eficiencia y el control de la producción de pan trenza mediante el seguimiento de la producción, el control de desperdicios y el análisis de indicadores.'],
    ['Meta de la empresa', 'Reducir los desperdicios de materia prima y mejorar la eficiencia del proceso.'],
    ['Objetivo al que aporta la app', 'Registrar y analizar los datos de producción para medir desperdicio, defectos, producción aprobada y productividad.'],
    ['Indicador principal', 'Porcentaje de desperdicio de materia prima — meta < 5 %'],
    ['Portafolio → Programa → Proyecto', 'Mejoramiento y transformación de procesos de producción → Optimización de producción de panadería → Sistema de monitoreo del proceso de fabricación de pan trenza'],
    ['Clasificación', 'Proyecto tecnológico (software) · ciclo de vida ágil/híbrido · ODS 9 y ODS 12 · RSE: uso eficiente de recursos y reducción de desperdicios']
  ],

  sipoc: {
    S: ['Dismapan SAS', 'Mundo Harinas S.A.S.', 'La Casa del Empaque'],
    I: ['Harina de trigo', 'Levadura', 'Azúcar', 'Sal', 'Mantequilla', 'Huevos', 'Agua', 'Material de empaque', 'Receta de elaboración'],
    P: ['Recepción', 'Pesaje', 'Mezclado', 'Amasado', 'División', 'Formado', 'Fermentación', 'Horneado', 'Enfriamiento', 'Empaque'],
    O: ['Pan trenza terminado', 'Unidades defectuosas', 'Desperdicios de producción'],
    C: ['Clientes finales', 'Tiendas de barrio', 'Cafeterías', 'Establecimientos comerciales']
  },

  // Backlog del producto (documento de historias de usuario actualizado + Sprint 3 de reconstrucción).
  backlog: [
    { id: 'HU-01', nombre: 'Registrar información de la panadería y del proceso', sprint: 1, prioridad: 'Alta', puntos: 3, responsable: 'Juan Pablo', estado: 'Terminado' },
    { id: 'HU-02', nombre: 'Registrar el SIPOC del proceso', sprint: 1, prioridad: 'Alta', puntos: 4, responsable: 'María Camila', estado: 'Terminado' },
    { id: 'HU-03', nombre: 'Registrar la estrategia corporativa y el objetivo', sprint: 1, prioridad: 'Media', puntos: 3, responsable: 'Juan Pablo', estado: 'Terminado' },
    { id: 'HU-04', nombre: 'Registrar portafolio, programa y proyecto', sprint: 1, prioridad: 'Media', puntos: 2, responsable: 'María Camila', estado: 'Terminado' },
    { id: 'HU-05', nombre: 'Clasificar el proyecto', sprint: 1, prioridad: 'Baja', puntos: 2, responsable: 'Juan Pablo', estado: 'Terminado' },
    { id: 'HU-06', nombre: 'Estudio de prefactibilidad y factibilidad', sprint: 1, prioridad: 'Alta', puntos: 4, responsable: 'María Camila', estado: 'Terminado' },
    { id: 'HU-07', nombre: 'Gestionar el backlog del producto', sprint: 2, prioridad: 'Alta', puntos: 2, responsable: 'Juan Pablo', estado: 'Terminado' },
    { id: 'HU-08', nombre: 'Visualizar tablero Scrum', sprint: 2, prioridad: 'Media', puntos: 3, responsable: 'María Camila', estado: 'Terminado' },
    { id: 'HU-09', nombre: 'Registrar datos de producción del pan trenza', sprint: 2, prioridad: 'Alta', puntos: 4, responsable: 'Juan José', estado: 'En revisión' },
    { id: 'HU-10', nombre: 'Calcular indicadores de producción', sprint: 2, prioridad: 'Alta', puntos: 5, responsable: 'Iván Santiago', estado: 'En revisión' },
    { id: 'HU-11', nombre: 'Crear fichas técnicas de los indicadores', sprint: 2, prioridad: 'Media', puntos: 3, responsable: 'María Camila', estado: 'Terminado' },
    { id: 'HU-12', nombre: 'Construir dashboard de monitoreo', sprint: 2, prioridad: 'Alta', puntos: 13, responsable: 'Juan José', estado: 'En revisión' },
    { id: 'HU-13', nombre: 'Construir arquitectura y prototipo V0', sprint: 2, prioridad: 'Alta', puntos: 13, responsable: 'Iván Santiago', estado: 'En revisión' },
    { id: 'HU-14', nombre: 'Generar el tablero a partir de un archivo de datos (Excel/CSV)', sprint: 3, prioridad: 'Alta', puntos: 8, responsable: 'Juan José', estado: 'En revisión' },
    { id: 'HU-15', nombre: 'Reconocer y validar columnas del archivo (diccionario de datos)', sprint: 3, prioridad: 'Alta', puntos: 5, responsable: 'Iván Santiago', estado: 'En revisión' },
    { id: 'HU-16', nombre: 'Configurar metas, alertas y exportar el tablero', sprint: 3, prioridad: 'Media', puntos: 3, responsable: 'Juan José', estado: 'En revisión' }
  ],
  estadosBacklog: ['Backlog', 'Por hacer', 'En desarrollo', 'En revisión', 'Terminado']
};
