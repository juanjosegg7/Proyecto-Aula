REGISTRO DE DATOS DE PRODUCCIÓN --- FABRICACIÓN DE PAN TRENZA
HU-09 | Registrar datos de producción del pan trenza

1. Objetivo del registro
Esta historia es el punto de partida para que el sistema empiece a tener datos propios del proceso. La fuente externa consultada (estudio de tiempos de la Universidad Autónoma de Occidente) se usa únicamente como referencia del proceso y de los tiempos esperados por etapa, pero el formulario debe guardar las mediciones reales de cada lote que se registre en el proyecto, no datos inventados.

2. Campos del formulario de lote
A continuación se describe cada campo del formulario, si corresponde a un dato de referencia externa o a un dato que debe medirse en el lote real.

Campo | Qué se registra | ¿Dato externo disponible?
Fecha | Fecha real de fabricación del lote | No; la registra el usuario
Lote | Código o identificador del lote | No; lo asigna el sistema/usuario
Responsable | Persona que registra o fabrica el lote | No; lo registra el usuario
Masa preparada (kg) | Peso real de la masa preparada | No; debe pesarse en cada lote
Panes producidos | Número real de panes obtenidos en el lote | Sí, como referencia: el estudio de tiempos usa un lote base de 112 panes (a partir de 4 arrobas)
Panes defectuosos | Número real de panes defectuosos del lote | No encontrado en la fuente consultada; debe medirse
Panes aprobados | Panes producidos menos panes defectuosos | Se calcula automáticamente
Tiempo de producción (min) | Tiempo real medido del lote | Sí, como referencia de etapas (ver tabla de tiempos de referencia)
Materia prima utilizada (kg) | Peso real de materia prima utilizada | No; debe pesarse en cada lote
Materia prima desperdiciada (kg) | Peso real de materia prima desperdiciada | No encontrado en la fuente consultada; debe medirse

3. Tiempos de referencia del proceso (fuente externa)
Estos tiempos no se usan como datos fijos del sistema, sino como referencia para validar que los tiempos registrados en cada lote sean razonables. Provienen del estudio de tiempos "Pan Trenza (4@)" de la Universidad Autónoma de Occidente, calculados sobre un lote de 112 panes.

Etapa | Tiempo de referencia
Armado (dosificación, mezclado, amasado, cilindro, multiformadora, moldeo) | 66 min
Fermentación | 60 min (3 panes por lata ≈ 20 min por pan)
Horneado (enbolado + horneo) | 55.89 min
Empaque | 17 min

4. Validaciones del formulario
- Las cantidades (masa, panes, materia prima) y los tiempos deben ser valores positivos.
- Los panes aprobados no pueden superar los panes producidos.
- Los panes aprobados se calculan automáticamente como: Aprobados = Producidos − Defectuosos.
- No se permite guardar el formulario con campos obligatorios vacíos.

5. Almacenamiento
Toda la información del lote se guarda en la hoja PRODUCCION de Google Sheets, permitiendo que estos registros alimenten posteriormente el cálculo de indicadores (HU-10), el dashboard de monitoreo (HU-12) y la trazabilidad histórica del proceso.

6. Criterios de aceptación
CA1. Se puede registrar fecha, lote y responsable.
CA2. Cantidades y tiempos son positivos.
CA3. Aprobados no supera producidos.
CA4. Puede calcularse aprobados = producidos − defectuosos.
CA5. El lote queda almacenado.
CA6. Se confirma el guardado.

Nota: los campos de panes defectuosos y materia prima desperdiciada no cuentan con un valor publicado en la fuente externa consultada; por esta razón se registran como mediciones reales de cada lote y no como datos de referencia, evitando así inventar cifras para completar el formulario.

Fuente de referencia: Universidad Autónoma de Occidente. Estudio de tiempos Pan Trenza (4@).
https://red.uao.edu.co/bitstreams/33b53389-b16d-46d1-92b4-6eee22b07b9b/download

Responsable: Juan José | Apoyo: Iván Santiago + María Camila (QA)
Puntos de estimación: 4 puntos
