# Diccionario de datos — Base_Panaderia_Indicadores

Libro de Excel (`.xlsx`) con tablas de dimensiones (Dim) y de hechos (Fact). La aplicación reconoce cada tabla **por los nombres de sus columnas**, no por el nombre de la hoja, y acepta los nombres en español o en inglés (sinónimos en `Frontend/js/modelo.js`). Plantilla vacía: `Frontend/datos/Base_Panaderia_Indicadores_plantilla.xlsx`.

## Dimensiones

| Tabla | Campo | Tipo / unidad | Regla | Valor en los supuestos |
|---|---|---|---|---|
| Dim_Producto | `producto_id` | texto | único | PR_01 |
| | `nombre_producto` | texto | | Pan trenza 350 g |
| | `tiempo_horneado_min` | minutos | > 0 | 22 |
| | `unidades_por_tanda` | unidades | > 0 (1 si falta) | 16 |
| Dim_Turno | `turno_id` | texto | único | T1, T2 |
| | `hora_inicio`, `hora_fin` | hh:mm | | 06:00–14:00, 14:00–22:00 |
| | `duracion_min` | minutos | > 0 | 480 |
| | `descanso_min` | minutos | ≥ 0 | 30 |
| Dim_MotivoParo | `motivo_id` | texto | único | MP_01 a MP_08 |
| | `nombre_motivo` | texto | | Precalentamiento, limpieza, mantenimiento, falta de masa, falla del horno, falta de gas, falta de personal, horno en otros productos |
| | `tipo` | Planeado / No planeado | | |
| | `excluir_tiempo_programado` | S / N | S = se resta del tiempo programado | S: MP_01, MP_02, MP_03, MP_08 |
| Dim_Operario | `operario_id`, `nombre_operario` | texto | | OP_01 a OP_04 |

## Hechos

| Tabla | Campo | Tipo / unidad | Regla de validación |
|---|---|---|---|
| Fact_Produccion (una fila por tanda) | `fecha` | fecha | obligatoria |
| | `turno_id` | texto | obligatorio, debe existir en Dim_Turno |
| | `producto_id` | texto | debe existir en Dim_Producto (si no, advertencia: no suma tiempo ideal) |
| | `hora_inicio`, `hora_fin` | fecha y hora | opcional |
| | `duracion_min` | minutos | ≥ 0 |
| | `unidades_producidas` | unidades | ≥ 0, obligatoria |
| | `unidades_defectuosas` | unidades | ≥ 0 y ≤ producidas |
| Fact_Paros | `fecha`, `turno_id`, `motivo_id` | | obligatorios; motivo fuera del catálogo → advertencia y no se cuenta |
| | `duracion_min` | minutos | ≥ 0 |
| Fact_Pedidos | `pedido_id`, `fecha`, `cliente_codigo` | texto/fecha | código de cliente, sin datos personales (Ley 1581) |
| | `cantidad_pedida` | unidades | > 0 |
| | `fecha_hora_compromiso`, `fecha_hora_entrega` | fecha y hora | compromiso obligatorio; sin entrega = no cumple |
| | `cantidad_entregada` | unidades | ≥ 0 |
| Fact_Ventas (una fila por día) | `fecha`, `producto_id` | | |
| | `unidades_vendidas` | unidades | ≥ 0; incluye mostrador y pedidos |
| Fact_ManoObra | `fecha`, `turno_id`, `operario_id` | | |
| | `asistio` | S / N | |
| | `horas_trabajadas` | horas | 0 a 24; más de 8 → advertencia |

Opcional: una columna de máquina o equipo (`maquina`, `equipo`, `machine_id`) en producción y paros. Si no existe, todo se asigna al **horno**.

## Indicadores (fichas técnicas)

| Indicador | Fórmula | Verde | Rojo |
|---|---|---|---|
| Disponibilidad | (programado − paros no planeados) ÷ programado; programado = duración − descanso − paros excluidos | ≥ 90 % | < 80 % |
| Rendimiento | Σ(unidades × tiempo_horneado ÷ unidades_por_tanda) ÷ tiempo operativo | ≥ 80 % | < 70 % |
| Calidad | (producidas − defectuosas) ÷ producidas | ≥ 95 % | < 90 % |
| OEE del horno | disponibilidad × rendimiento × calidad | ≥ 65 % | < 55 % |
| SLA (OTIF) | pedidos con entrega ≤ compromiso y entregada ≥ pedida ÷ total de pedidos | ≥ 95 % | < 90 % |
| % no vendido | (buenas − vendidas) ÷ buenas (por día; no se calcula por turno) | ≤ 10 % | > 15 % |
| Productividad de mano de obra | buenas ÷ horas trabajadas | ≥ línea base + 5 % | < línea base |

Los consolidados (día, mes, filtro) suman primero tiempos y unidades y luego dividen; no se promedian porcentajes.

## Almacenamiento en el navegador

| Clave (`localStorage`) | Contenido |
|---|---|
| `pt.base` | Último libro cargado (solo las hojas reconocidas) |
| `pt.metas.fichas` | Metas y línea base del semáforo |
