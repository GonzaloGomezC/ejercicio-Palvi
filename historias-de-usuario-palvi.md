# Historias de Usuario — Dashboard Ejecutivo Palvi
> Stack: React + TypeScript + Vite + Recharts + Tailwind
> Contexto: Reporte ejecutivo para Jefe de Ventas B2B SaaS — 5 minutos de uso diario

---

## HU-001 — Carga y selección de dataset

**Identificador:** HU-001
**Título:** Selección de dataset activo (A / B / C / D)

**Objetivo de negocio:**
Permitir al evaluador navegar entre los 4 datasets para verificar que la app responde correctamente a comportamientos distintos de datos. En producción real, esto sería selección de tenant o período.

**Historia de usuario:**
```
Como jefe de ventas (o evaluador),
quiero seleccionar entre los datasets A, B, C y D,
para que toda la app refleje los datos del dataset activo.
```

**Contexto / Problema:**
El JSON contiene 4 conjuntos de datos con comportamientos distintos. Si la app solo funciona con el primero, no cumple el requisito mínimo del evaluador.

**Reglas de negocio:**
- Al cargar la app, el dataset activo por defecto es A.
- Cambiar de dataset recalcula todas las métricas derivadas: KPIs, alertas, scores, funnel, tendencias.
- El dataset activo se mantiene visible en todo momento (UI persistente).
- No hay persistencia entre sesiones (no se guarda en localStorage).

**Especificación funcional:**
- Selector tipo tab con las opciones: `A | B | C | D`
- Al cambiar de tab, todos los componentes se re-renderizan con los datos del nuevo dataset.
- Durante el cambio, mostrar un estado de loading mínimo (skeleton o opacity transition).
- El tab activo tiene estilo diferenciado.

**Casos de aceptación:**
```gherkin
Scenario: Carga inicial
Given el usuario abre la aplicación
Then el dataset A está activo
And todos los componentes muestran datos de A

Scenario: Cambio de dataset
Given el usuario está viendo el dataset A
When hace click en el tab "B"
Then todos los KPIs, alertas, scores y gráficos cambian a datos de B
And el tab "B" aparece como activo

Scenario: Dataset con nulls en métricas
Given el dataset activo tiene días con avg_response_time_min = null
When se calculan KPIs, alertas y scores
Then los días null son excluidos del cálculo
And no aparece NaN ni error en pantalla
```

**Requisitos no funcionales:**
- El cambio de dataset debe completarse visualmente en menos de 300ms.
- No debe haber errores de consola al cambiar entre datasets.

**Diseño técnico:**
```
- Estado global: useState<'A'|'B'|'C'|'D'> en App.tsx
- El JSON se carga una sola vez con fetch('/metrics.json') en useEffect
- Se pasa el objeto del dataset activo como prop a todos los componentes hijos
- No se necesita context ni state manager externo
```

**API / Contratos:**
```
GET /metrics.json  (archivo estático en /public)

Response: objeto con keys A, B, C, D
Cada key: { metadata: { metrics: MetricMeta[] }, days: DayEntry[] }

type MetricMeta = {
  key: string
  label: string
  unit: string
  direction: 'higher_is_better' | 'lower_is_better'
  description: string
}

type DayEntry = {
  date: string  // ISO 8601
  metrics: Record<string, number | null>
}
```

**Validaciones:**
- Si el fetch falla, mostrar pantalla de error con mensaje claro.
- Si el JSON está malformado, capturar con try/catch y mostrar error.

**Edge cases:**
- Fetch falla por red → mostrar error, no pantalla en blanco.
- Dataset tiene menos de 7 días de datos → todos los cálculos de tendencia se adaptan al rango disponible.
- Valor null en métrica → excluir del promedio, no tratar como cero.

**Dependencias:**
- Archivo `metrics.json` en `/public`

**Definición de terminado (DoD):**
- El selector funciona para los 4 datasets.
- Cambiar dataset actualiza todos los componentes.
- No hay NaN visible en pantalla con ningún dataset.
- No hay errores de consola.

---

## HU-002 — Panel de alertas prioritarias + Sistema de Scoring

**Identificador:** HU-002
**Título:** Alertas automáticas de métricas en riesgo con scoring de salud operacional

**Objetivo de negocio:**
El jefe de ventas no tiene tiempo de revisar 11 métricas. La app debe decirle directamente qué está mal, por qué importa, y cuantificar la salud general de la operación con un número que no requiera interpretación.

**Historia de usuario:**
```
Como jefe de ventas,
quiero ver automáticamente qué métricas están fuera de rango
y un score que resuma la salud de mi operación,
para saber dónde poner el foco sin analizar números crudos.
```

**Contexto / Problema:**
Sin alertas ni score, el usuario tiene que interpretar 11 métricas y decidir qué es normal y qué no. En 5 minutos, eso no es viable. Un score único da contexto inmediato; las alertas explican por qué.

---

### PARTE A — Sistema de Scoring

**Reglas de negocio — Scoring:**

**Score General: "Sales Health Score" (0–100)**
Weighted average de los 5 scores de área. Aparece en el header, siempre visible, antes del panel de alertas.

| Score de Área    | Métricas que lo componen                              | Peso en score general |
|------------------|-------------------------------------------------------|-----------------------|
| 🎯 Pipeline       | leads_created, leads_qualified, deals_created         | 25%                   |
| 💰 Cierre         | deals_won, deals_lost, win rate (calculado)           | 30%                   |
| ⚡ Velocidad      | avg_response_time_min, avg_deal_cycle_days            | 25%                   |
| 🔧 Soporte        | support_tickets_opened, support_avg_resolution_hours  | 10%                   |
| 🧹 Higiene        | stale_deals                                           | 10%                   |

**Cálculo de score por métrica:**
1. Calcular promedio de los últimos 7 días (ignorando nulls).
2. Calcular promedio de los 30 días previos como baseline (ignorando nulls).
3. Calcular delta ajustado por `direction`:
   - `higher_is_better`: delta = (avg7d - avg30d) / avg30d × 100
   - `lower_is_better`: delta = (avg30d - avg7d) / avg30d × 100
   - (positivo = mejora, negativo = deterioro en ambos casos)
4. Normalizar: `score_metrica = clamp(50 + delta × 0.5, 0, 100)`
   - 50 = sin cambio vs baseline
   - 100 = mejora del 100% o más
   - 0 = deterioro del 100% o más

**Score de área** = promedio simple de los scores de sus métricas.
**Score general** = suma ponderada de los 5 scores de área según tabla de pesos.

**Semáforo del score general:**

| Rango   | Color   | Label                  |
|---------|---------|------------------------|
| 75–100  | 🟢 Verde  | Operación saludable    |
| 50–74   | 🟡 Amarillo | Atención requerida  |
| 0–49    | 🔴 Rojo   | Acción urgente         |

**Especificación funcional — Scoring:**
- El score general se muestra: número grande + color + label semántico.
- Ejemplo: `87 · 🟢 Operación saludable`
- Debajo del score general: 5 pills con score de área, nombre del área e ícono.
- El área con score más bajo se resalta con borde o fondo distinto (es el foco recomendado).
- Todo el scoring se recalcula al cambiar de dataset.

---

### PARTE B — Panel de Alertas

**Reglas de negocio — Alertas:**
- Una métrica está en alerta si cumple **al menos una** de estas condiciones:
  - Su promedio 7d supera en más de **20%** el promedio 30d en dirección negativa (umbral de delta).
  - El score del área a la que pertenece es **< 50** (umbral de score).
- Para `higher_is_better`: alerta delta si promedio 7d está >20% por debajo del promedio 30d.
- Para `lower_is_better`: alerta delta si promedio 7d está >20% por encima del promedio 30d.
- Las alertas se ordenan por severidad: delta% absoluto descendente.
- Se muestran máximo **3 alertas** en el panel principal. Si hay más, se indica cuántas quedaron ocultas.
- Si no hay alertas, mostrar estado positivo: "Todo en rango".
- Los días con valor `null` se excluyen de los promedios.

**Especificación funcional — Alertas:**
Cada alerta muestra:
- Ícono de severidad: 🔴 crítico (delta >40% o score área <35) / 🟡 advertencia (resto)
- Nombre de la métrica en lenguaje de negocio (usar `label` del metadata)
- Delta en % vs mes anterior
- Score del área a la que pertenece la métrica (ej. `Velocidad: 34/100`)
- Una frase corta de impacto en negocio (hardcodeada por clave de métrica)

**Frases de impacto por `key`:**
```
avg_response_time_min      → "Respuesta lenta reduce conversión de leads"
avg_deal_cycle_days        → "Ciclos largos atan capacidad del equipo"
stale_deals                → "Deals estancados bloquean el pipeline"
deals_lost                 → "Tasa de pérdida sobre umbral histórico"
deals_won                  → "Cierres por debajo del ritmo esperado"
leads_created              → "Captación de leads por debajo del baseline"
leads_qualified            → "Calificación baja afecta deals futuros"
deals_created              → "Pocas oportunidades abiertas esta semana"
support_tickets_opened     → "Volumen de soporte inusualmente alto"
support_avg_resolution_hours → "Resolución lenta afecta retención"
win_rate                   → "Tasa de cierre por debajo del umbral histórico"
```

**Layout del panel:**
```
┌─────────────────────────────────────────────────────────┐
│  Sales Health Score                                     │
│  87  🟢 Operación saludable                             │
│                                                         │
│  🎯 Pipeline 82  💰 Cierre 90  ⚡ Velocidad 34          │
│  🔧 Soporte 75   🧹 Higiene 61                          │
├─────────────────────────────────────────────────────────┤
│  ⚠ Alertas (2)                                         │
│                                                         │
│  🔴 Average response time    ↑108%                     │
│     Velocidad: 34/100 · Respuesta lenta reduce ...     │
│                                                         │
│  🟡 Stale deals              ↑22%                      │
│     Higiene: 61/100 · Deals estancados bloquean...     │
│                                                         │
│  + 1 alerta más                                        │
└─────────────────────────────────────────────────────────┘
```

**Casos de aceptación:**
```gherkin
Scenario: Score general en rango rojo
Given el dataset activo tiene múltiples métricas deterioradas
When se renderiza el header de scoring
Then el score general aparece en rojo
And el label dice "Acción urgente"

Scenario: Área con score más bajo resaltada
Given el área Velocidad tiene score 34 y es la más baja
When se renderizan los pills de área
Then el pill de Velocidad tiene borde o fondo distinto

Scenario: Alerta por umbral de score (sin superar 20% delta)
Given el área Pipeline tiene score 48
And ninguna métrica de Pipeline supera el 20% de delta individualmente
When se calculan las alertas
Then aparece al menos una alerta del área Pipeline

Scenario: Métrica en alerta crítica por delta
Given el dataset activo tiene avg_response_time_min 50% sobre su promedio 30d
When se renderiza el panel de alertas
Then aparece una alerta roja con el label "Average response time"
And muestra el delta en porcentaje
And muestra el score del área Velocidad
And muestra la frase de impacto correspondiente

Scenario: Sin alertas
Given todas las métricas están dentro del rango normal
And todos los scores de área son >= 50
When se renderiza el panel
Then el score general aparece en verde
And aparece el mensaje "Todo en rango — sin alertas activas"

Scenario: Cambio de dataset
Given el usuario cambia de dataset A a dataset D
When D tiene métricas distintas en alerta
Then el score general, scores de área y alertas se recalculan con datos de D
And los valores de A desaparecen

Scenario: Métrica con nulls
Given avg_response_time_min tiene 5 días null en los últimos 7
When se calculan score y alerta
Then se usa solo los días con valor válido
And no aparece NaN en score ni en delta

Scenario: Área con score < 50 sin delta individual > 20%
Given todas las métricas de Soporte tienen delta de 15%
But el score de Soporte resulta 47
When se calculan las alertas
Then aparece una alerta del área Soporte
```

**Requisitos no funcionales:**
- El cálculo de scores y alertas debe completarse en menos de 50ms (todo en memoria, sin async).
- El panel de scoring debe ser lo primero visible sin scroll en cualquier pantalla >= 1280px.
- El panel de alertas va inmediatamente debajo del scoring.
- Los scores deben actualizarse en menos de 300ms al cambiar de dataset.

**Diseño técnico:**
```typescript
// Tipos
type Direction = 'higher_is_better' | 'lower_is_better'

type MetricScore = {
  key: string
  score: number       // 0-100
  delta: number       // % ajustado por direction, positivo = bueno
  avg7d: number | null
  avg30d: number | null
}

type AreaScore = {
  area: 'pipeline' | 'cierre' | 'velocidad' | 'soporte' | 'higiene'
  label: string
  icon: string
  score: number       // 0-100
  metrics: MetricScore[]
}

type Alert = {
  metricKey: string
  metricLabel: string
  delta: number
  severity: 'critical' | 'warning'
  impactMessage: string
  areaLabel: string
  areaScore: number
  trigger: 'delta' | 'score' | 'both'
}

// Funciones puras
computeAvg(days: DayEntry[], key: string, from: number, to: number): number | null
computeMetricScore(avg7d, avg30d, direction): number
computeAreaScores(dataset: Dataset): AreaScore[]
computeGeneralScore(areaScores: AreaScore[]): number
computeAlerts(dataset: Dataset, areaScores: AreaScore[]): Alert[]

// Constantes
const AREA_WEIGHTS = { pipeline: 0.25, cierre: 0.30, velocidad: 0.25, soporte: 0.10, higiene: 0.10 }
const AREA_METRICS = {
  pipeline: ['leads_created', 'leads_qualified', 'deals_created'],
  cierre: ['deals_won', 'deals_lost', 'win_rate'],
  velocidad: ['avg_response_time_min', 'avg_deal_cycle_days'],
  soporte: ['support_tickets_opened', 'support_avg_resolution_hours'],
  higiene: ['stale_deals']
}
const IMPACT_MESSAGES: Record<string, string> = { /* ver spec funcional */ }

// Componentes
<ScoreHeader generalScore areaScores />
<AlertPanel alerts />   // máximo 3, con "N más" si hay más
```

**Validaciones:**
- avg30d = 0 → omitir score de esa métrica (no dividir por cero).
- Menos de 7 días con datos válidos para una métrica → no generar alerta por delta para ella.
- Delta se expresa como porcentaje entero redondeado (Math.round).
- Score individual = clamp(0, 100, valor calculado).

**Edge cases:**
- Promedio 30d = 0 → omitir la alerta delta para esa métrica; incluirla solo si el área tiene score < 50.
- Todos los días de una métrica son null → score de esa métrica = 50 (neutral, no penalizar).
- Dataset con solo 10 días → ventana 7d usa días disponibles; ventana 30d usa los mismos días disponibles.
- Win rate con denominador 0 → score de win_rate = 50 (neutral).

**Dependencias:**
- HU-001 (dataset activo disponible)
- `metadata.metrics[].direction` por cada clave

**Definición de terminado (DoD):**
- El score general y scores de área cambian al cambiar de dataset.
- Las alertas cambian al cambiar de dataset.
- No hay NaN visible bajo ningún dataset ni combinación de nulls.
- El orden de alertas es por severidad descendente.
- Las frases de impacto aparecen para todas las métricas con key conocido.
- El área con score más bajo está visualmente resaltada.
- El score general refleja correctamente los pesos definidos.
- Las alertas por umbral de score aparecen aunque el delta no supere 20%.

---

## HU-003 — KPI Strip de ayer

**Identificador:** HU-003
**Título:** Resumen de KPIs del día anterior con delta vs. promedio

**Objetivo de negocio:**
Dar al jefe una lectura instantánea del estado de ayer comparado con el comportamiento reciente, sin tener que abrir un gráfico.

**Historia de usuario:**
```
Como jefe de ventas,
quiero ver los valores clave de ayer con su variación respecto al mes anterior,
para saber de un vistazo si el día fue bueno o malo.
```

**Contexto / Problema:**
Un número crudo (ej. "34 leads") no tiene contexto. Con el delta ("↑18% vs. promedio 30d") el jefe sabe si celebrar o preocuparse.

**Reglas de negocio:**
- "Ayer" = el último día disponible en el dataset (no necesariamente la fecha real de hoy).
- Se muestran **6 métricas priorizadas**, en este orden:
  1. leads_created
  2. deals_won
  3. Win rate calculado (últimos 7d: sum(won) / sum(won + lost))
  4. avg_response_time_min
  5. stale_deals
  6. support_tickets_opened
- El delta se calcula vs. promedio de los 30 días previos al último día.
- El color del delta sigue `direction`: verde si mejora, rojo si empeora.
- Si el valor de ayer es `null`, mostrar "—" en lugar del número.

**Especificación funcional:**
- Cada KPI card muestra:
  - Label corto (máx 2 palabras)
  - Valor de ayer con su unidad
  - Delta en % con flecha (↑ / ↓) y color
- Layout: fila horizontal de 6 cards, responsive a 2 columnas en mobile.
- Win rate se calcula; no viene directo en el JSON.

**Casos de aceptación:**
```gherkin
Scenario: KPI con mejora
Given avg_response_time_min de ayer es 25 min
And el promedio 30d es 35 min
When se renderiza el KPI strip
Then aparece "↓28%" en verde (lower_is_better mejoró)

Scenario: KPI con deterioro
Given deals_won de ayer es 1
And el promedio 30d es 4
When se renderiza el KPI strip
Then aparece "↓75%" en rojo (higher_is_better empeoró)

Scenario: Valor null
Given avg_response_time_min de ayer es null
When se renderiza el KPI strip
Then la card muestra "—" sin delta
```

**Requisitos no funcionales:**
- Los 6 cards deben ser visibles sin scroll horizontal en pantallas >= 1280px.
- No usar tooltips para información crítica.

**Diseño técnico:**
```typescript
getLastDay(dataset: Dataset): DayEntry
computeAvg(days: DayEntry[], key: string, last: number): number | null
computeWinRate(days: DayEntry[], windowDays: number): number | null

// Componentes
<KpiStrip dataset={dataset} />
  → 6 × <KpiCard label value delta direction />
```

**Validaciones:**
- Win rate denominador = 0 → mostrar "—".
- Promedio 30d sin datos válidos → no mostrar delta.

**Edge cases:**
- Dataset con menos de 30 días → calcular delta con los días disponibles.
- Todos los valores de los 30d son null → mostrar "—" sin delta.

**Dependencias:**
- HU-001

**Definición de terminado (DoD):**
- Los 6 KPIs se muestran con valor y delta correcto.
- Colores siguen `direction`.
- Win rate calculado correctamente.
- Nada explota con datasets cortos o con nulls.

---

## HU-004 — Funnel de conversión

**Identificador:** HU-004
**Título:** Visualización del funnel de ventas (últimos 30 días)

**Objetivo de negocio:**
Mostrar visualmente dónde se pierden prospectos en el pipeline, para que el jefe identifique el cuello de botella en segundos.

**Historia de usuario:**
```
Como jefe de ventas,
quiero ver el embudo de conversión de los últimos 30 días,
para identificar en qué etapa se está perdiendo más volumen.
```

**Contexto / Problema:**
Sin el funnel, el jefe puede ver que "los deals ganados bajaron" pero no saber si el problema está en la captación de tráfico, la calificación de leads, o el cierre.

**Reglas de negocio:**
- El funnel usa sumas de los últimos 30 días (no promedios).
- Etapas en orden: Tráfico → Leads → Calificados → Deals → Ganados.
- Entre cada etapa se muestra la tasa de conversión: etapa_siguiente / etapa_actual × 100.
- La etapa con la tasa de conversión más baja se resalta visualmente (cuello de botella).
- Si una etapa tiene suma = 0, la tasa de conversión a la siguiente es "—".

**Especificación funcional:**
- Visualización horizontal (desktop) o vertical (mobile).
- Cada etapa muestra: nombre, valor total (suma 30d), tasa de conversión hacia la siguiente.
- La tasa se muestra en % con 1 decimal.
- El cuello de botella se destaca con color diferente (rojo o naranja).
- Implementar con divs proporcionales al valor, sin librería de funnel.

**Casos de aceptación:**
```gherkin
Scenario: Funnel normal
Given los últimos 30d tienen tráfico=50000, leads=1200, calificados=600, deals=200, ganados=40
When se renderiza el funnel
Then aparece: 50000 → 2.4% → 1200 → 50.0% → 600 → 33.3% → 200 → 20.0% → 40
And la tasa más baja (2.4%) está resaltada en rojo

Scenario: Etapa con cero
Given deals_won suma 0 en los últimos 30d
When se renderiza el funnel
Then la tasa "Deals → Ganados" muestra "—"
And no aparece división por cero
```

**Requisitos no funcionales:**
- El funnel debe ser comprensible sin leer ningún tooltip.
- Los valores deben usar separador de miles (1,200 no 1200).

**Diseño técnico:**
```typescript
type FunnelStage = {
  label: string
  value: number
  conversionRate: number | null  // hacia la siguiente etapa
  isBottleneck: boolean
}

computeFunnel(days: DayEntry[]): FunnelStage[]

// Componente
<FunnelChart stages={FunnelStage[]} />
```

**Validaciones:**
- División por cero en tasas → mostrar "—".
- Valores null → excluir del sum (equivale a 0 para ese día en el total).

**Edge cases:**
- Tráfico = 0 en todos los 30d → todas las tasas son "—".
- Leads > Tráfico (datos inconsistentes) → mostrar sin corregir.

**Dependencias:**
- HU-001

**Definición de terminado (DoD):**
- El funnel muestra las 5 etapas con tasas correctas.
- El cuello de botella se resalta visualmente.
- No hay errores con datasets donde alguna etapa suma cero.

---

## HU-005 — Tendencias con sparklines

**Identificador:** HU-005
**Título:** Gráficos de tendencia de las últimas 4 semanas por métrica

**Objetivo de negocio:**
Permitir al jefe ver si una métrica viene mejorando o deteriorándose en el tiempo reciente, no solo comparar ayer vs. promedio.

**Historia de usuario:**
```
Como jefe de ventas,
quiero ver la tendencia de las últimas 4 semanas para las métricas clave,
para entender si un problema es nuevo o viene de antes.
```

**Contexto / Problema:**
Una alerta dice "el tiempo de respuesta está mal". El sparkline dice si empezó a subir hace 3 días o lleva 3 semanas deteriorándose. Eso cambia la urgencia de la acción.

**Reglas de negocio:**
- Se muestran sparklines para **7 métricas**: las 6 del KPI strip + avg_deal_cycle_days.
- Ventana: últimos 28 días del dataset.
- Los días con valor `null` se interpolan linealmente entre los valores válidos adyacentes. Si no hay valores adyacentes, se omite el punto.
- La línea usa color de tendencia: verde si el valor reciente (últimos 7d) es mejor que el primer tramo (primeros 7d de la ventana), rojo si es peor, según `direction`.
- No mostrar ejes ni labels en el sparkline; solo la línea y el valor actual al final.

**Especificación funcional:**
- Grid de 7 sparklines, cada uno con:
  - Label de la métrica
  - La línea (28 puntos o menos si hay nulls)
  - Valor del último día (o "—" si null)
  - Color de línea según tendencia
- Al hacer hover/click sobre un sparkline, mostrar el valor exacto de ese día (tooltip).
- En mobile, grid de 2 columnas.

**Casos de aceptación:**
```gherkin
Scenario: Tendencia negativa
Given avg_response_time_min sube de 30 a 65 min en los últimos 28d
When se renderiza el sparkline
Then la línea es roja (lower_is_better empeoró)

Scenario: Días con null interpolados
Given los días 10, 11 y 12 de los 28 tienen avg_response_time_min = null
When se renderiza el sparkline
Then los puntos 10-12 se interpolan linealmente
And la línea no tiene cortes visibles

Scenario: Todos los 28 días son null
Given avg_response_time_min es null en todos los 28 días
When se renderiza el sparkline
Then aparece "—" y la línea está vacía sin error
```

**Requisitos no funcionales:**
- Cada sparkline debe renderizar en menos de 16ms.
- Usar Recharts `<LineChart>` con `dot={false}`.

**Diseño técnico:**
```typescript
interpolateNulls(values: (number | null)[]): (number | null)[]
getTrendColor(values: number[], direction: Direction): 'green' | 'red' | 'neutral'
  // compara media últimos 7d vs primeros 7d de la ventana

// Componentes
<Sparkline data metricKey direction label lastValue />
<SparklineGrid dataset={dataset} />
```

**Validaciones:**
- Array vacío o todo nulls → renderizar placeholder "sin datos".
- Recharts requiere al menos 2 puntos → si solo hay 1 dato, mostrar punto único.

**Edge cases:**
- Null al inicio o al final → no extrapolar fuera del rango.
- Outliers extremos → Recharts domain='auto' los maneja, aceptable.

**Dependencias:**
- HU-001
- Recharts instalado

**Definición de terminado (DoD):**
- Los 7 sparklines se renderizan para todos los datasets.
- Los colores de tendencia son correctos según `direction`.
- La interpolación de nulls no genera errores ni líneas rotas.
- El hover muestra el valor exacto.

---

## Orden de implementación recomendado

```
HU-001  →  HU-003  →  HU-002  →  HU-004  →  HU-005
 Carga      KPIs      Score +      Funnel    Sparklines
            Strip     Alertas
```

Cada HU es independiente una vez que HU-001 entrega el dataset activo.
El scoring de HU-002 puede reutilizar las funciones de promedio de HU-003.
