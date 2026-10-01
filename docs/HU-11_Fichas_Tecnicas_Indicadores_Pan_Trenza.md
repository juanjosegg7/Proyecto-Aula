# FICHAS TÉCNICAS DE LOS INDICADORES

**Sistema de monitoreo del proceso de fabricación de pan trenza**

**Sprint 2 -- HU-11: Crear fichas técnicas de los indicadores**

Documento de definición de los cuatro indicadores establecidos para el
monitoreo del proceso: porcentaje de defectos, porcentaje de producción
aprobada, productividad y porcentaje de desperdicio.

## FICHA TÉCNICA 1: PORCENTAJE DE DEFECTOS

  -----------------------------------------------------------------------
  Campo                               Definición
  ----------------------------------- -----------------------------------
  **Nombre del indicador**            Porcentaje de defectos

  **Objetivo**                        Medir qué porcentaje de los panes
                                      producidos presenta defectos
                                      durante el proceso.

  **Fórmula**                         \% Defectos = (Panes defectuosos /
                                      Panes producidos) × 100

  **Unidad de medida**                Porcentaje (%)

  **Frecuencia**                      Por lote y consolidado por jornada,
                                      semana o mes.

  **Responsable**                     Responsable de producción /
                                      encargado del proceso.

  **Fuente de información**           Hoja PRODUCCION: panes producidos y
                                      panes defectuosos.

  **Meta**                            Mantener el porcentaje de defectos
                                      en un nivel bajo. El 5% usado en la
                                      simulación es solo un supuesto y
                                      debe reemplazarse por la meta real.

  **Tipo de indicador**               Calidad / eficiencia

  **Interpretación**                  Un valor menor representa una menor
                                      proporción de productos
                                      defectuosos.
  -----------------------------------------------------------------------

**Ejemplo de cálculo:** 112 panes producidos y 6 defectuosos →
(6/112)×100 = **5,36%**.

## FICHA TÉCNICA 2: PORCENTAJE DE PRODUCCIÓN APROBADA

  -----------------------------------------------------------------------
  Campo                               Definición
  ----------------------------------- -----------------------------------
  **Nombre del indicador**            Porcentaje de producción aprobada

  **Objetivo**                        Medir la proporción de panes
                                      producidos que cumplen los
                                      criterios y son aprobados.

  **Fórmula**                         \% Aprobada = (Panes aprobados /
                                      Panes producidos) × 100

  **Unidad de medida**                Porcentaje (%)

  **Frecuencia**                      Por lote y consolidado por jornada,
                                      semana o mes.

  **Responsable**                     Responsable de producción /
                                      encargado del proceso.

  **Fuente de información**           Hoja PRODUCCION: panes producidos y
                                      panes aprobados.

  **Meta**                            Buscar un porcentaje de aprobación
                                      alto y estable. La meta definitiva
                                      debe ser definida por la empresa.

  **Tipo de indicador**               Calidad

  **Interpretación**                  Un valor cercano al 100% indica que
                                      una mayor proporción de la
                                      producción fue aprobada.
  -----------------------------------------------------------------------

**Ejemplo de cálculo:** 112 panes producidos y 106 aprobados →
(106/112)×100 = **94,64%**.

## FICHA TÉCNICA 3: PRODUCTIVIDAD

  -----------------------------------------------------------------------
  Campo                               Definición
  ----------------------------------- -----------------------------------
  **Nombre del indicador**            Productividad

  **Objetivo**                        Medir la cantidad de panes
                                      producidos en relación con el
                                      tiempo utilizado en producción.

  **Fórmula**                         Productividad = Panes producidos /
                                      Tiempo de producción

  **Unidad de medida**                Panes por minuto (panes/min)

  **Frecuencia**                      Por lote y consolidado por jornada,
                                      semana o mes.

  **Responsable**                     Responsable de producción.

  **Fuente de información**           Hoja PRODUCCION: panes producidos y
                                      tiempo de producción.

  **Meta**                            Mantener o mejorar la producción
                                      por unidad de tiempo sin afectar la
                                      calidad.

  **Tipo de indicador**               Productividad / eficiencia

  **Interpretación**                  Un valor mayor representa más panes
                                      producidos por minuto, manteniendo
                                      las condiciones de calidad.
  -----------------------------------------------------------------------

**Ejemplo de cálculo:** 112 panes en 66 minutos → 112/66 = **1,70
panes/min**.

## FICHA TÉCNICA 4: PORCENTAJE DE DESPERDICIO

  -----------------------------------------------------------------------
  Campo                               Definición
  ----------------------------------- -----------------------------------
  **Nombre del indicador**            Porcentaje de desperdicio

  **Objetivo**                        Medir qué proporción de la materia
                                      prima utilizada termina como
                                      desperdicio.

  **Fórmula**                         \% Desperdicio = (Materia prima
                                      desperdiciada / Materia prima
                                      utilizada) × 100

  **Unidad de medida**                Porcentaje (%)

  **Frecuencia**                      Por lote y consolidado por jornada,
                                      semana o mes.

  **Responsable**                     Responsable de producción /
                                      encargado de materias primas.

  **Fuente de información**           Hoja PRODUCCION: materia prima
                                      utilizada y materia prima
                                      desperdiciada.

  **Meta**                            Mantener el desperdicio en el nivel
                                      más bajo posible sin afectar el
                                      proceso. La meta definitiva debe
                                      establecerse con datos reales.

  **Tipo de indicador**               Eficiencia / costos

  **Interpretación**                  Un porcentaje menor indica menor
                                      desperdicio de la materia prima
                                      utilizada.
  -----------------------------------------------------------------------

**Ejemplo de cálculo:** 50 kg utilizados y 2,5 kg desperdiciados →
(2,5/50)×100 = **5%**.

## NOTA SOBRE LAS METAS

Las metas deben definirse con la empresa o con datos históricos reales.
El 5% de defectos usado en la simulación es únicamente un supuesto de
prueba y no debe presentarse como una meta empresarial.

## CONCLUSIÓN

Las cuatro fichas estandarizan cómo se registra, calcula y presenta cada
indicador del proceso de fabricación de pan trenza y permiten
relacionarlos posteriormente con el Dashboard.
