import type { Dataset, DayEntry, Direction } from '../types'

export type Trend = 'green' | 'red' | 'neutral'

export function getLastDay(dataset: Dataset): DayEntry | null {
  return dataset.days.length > 0 ? dataset.days[dataset.days.length - 1] : null
}

/**
 * Promedio de los últimos `last` días para una métrica.
 * Excluye los días con valor null. Devuelve null si no quedan valores válidos.
 */
export function computeAvg(
  days: DayEntry[],
  key: string,
  last: number,
): number | null {
  const slice = days.slice(-last)
  let sum = 0
  let count = 0
  for (const d of slice) {
    const v = d.metrics[key]
    if (typeof v === 'number') {
      sum += v
      count += 1
    }
  }
  return count === 0 ? null : sum / count
}

/**
 * Win rate sobre los últimos `windowDays` días: sum(won) / sum(won + lost).
 * Excluye nulls de cada métrica de forma independiente.
 * Devuelve null si el denominador es 0 o no hay datos.
 */
export function computeWinRate(
  days: DayEntry[],
  windowDays: number,
): number | null {
  const slice = days.slice(-windowDays)
  let won = 0
  let lost = 0
  for (const d of slice) {
    const w = d.metrics['deals_won']
    const l = d.metrics['deals_lost']
    if (typeof w === 'number') won += w
    if (typeof l === 'number') lost += l
  }
  const denom = won + lost
  return denom === 0 ? null : won / denom
}

/**
 * Delta porcentual ajustado por dirección.
 * Devuelve { raw, isImprovement } o null si no se puede calcular.
 *  - raw: cambio porcentual bruto (yesterday vs baseline). El signo indica
 *    el sentido del cambio en el valor (no si es bueno o malo).
 *  - isImprovement: true si el cambio es bueno según la dirección.
 */
export type DeltaResult = {
  raw: number
  isImprovement: boolean
}

export function computeDelta(
  current: number | null,
  baseline: number | null,
  direction: Direction,
): DeltaResult | null {
  if (current === null || baseline === null || baseline === 0) return null
  const raw = ((current - baseline) / baseline) * 100
  const isImprovement =
    direction === 'higher_is_better' ? raw > 0 : raw < 0
  return { raw, isImprovement }
}

/**
 * Interpola linealmente los huecos null de un arreglo de valores.
 * Los nulls al inicio o al final no se extrapolan (quedan null).
 */
export function interpolateNulls(
  values: (number | null)[],
): (number | null)[] {
  const out = values.slice()
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== null) continue
    let prev = -1
    for (let j = i - 1; j >= 0; j--) {
      if (values[j] !== null) {
        prev = j
        break
      }
    }
    let next = -1
    for (let j = i + 1; j < values.length; j++) {
      if (values[j] !== null) {
        next = j
        break
      }
    }
    if (prev === -1 || next === -1) continue
    const a = values[prev] as number
    const b = values[next] as number
    out[i] = a + ((b - a) * (i - prev)) / (next - prev)
  }
  return out
}

/**
 * Compara la media de los últimos 7 valores contra los primeros 7
 * de la ventana, ignorando nulls. Devuelve color según direction.
 */
export function getTrendColor(
  values: (number | null)[],
  direction: Direction,
): Trend {
  if (values.length < 8) return 'neutral'
  const meanRange = (from: number, to: number): number | null => {
    let sum = 0
    let count = 0
    for (let i = from; i < to && i < values.length; i++) {
      const v = values[i]
      if (typeof v === 'number') {
        sum += v
        count += 1
      }
    }
    return count === 0 ? null : sum / count
  }
  const first = meanRange(0, 7)
  const last = meanRange(values.length - 7, values.length)
  if (first === null || last === null) return 'neutral'
  const change = last - first
  if (Math.abs(change) < 1e-9) return 'neutral'
  const isImprovement =
    direction === 'higher_is_better' ? change > 0 : change < 0
  return isImprovement ? 'green' : 'red'
}

/**
 * Win rate diario calculado como ventana móvil de N días.
 * Para cada día i, devuelve sum(won)/sum(won+lost) de los días [i-N+1, i].
 * Días donde el denominador es 0 → null.
 */
export function rollingWinRate(
  days: DayEntry[],
  window: number,
): (number | null)[] {
  const out: (number | null)[] = []
  for (let i = 0; i < days.length; i++) {
    let won = 0
    let lost = 0
    const start = Math.max(0, i - window + 1)
    for (let j = start; j <= i; j++) {
      const w = days[j].metrics['deals_won']
      const l = days[j].metrics['deals_lost']
      if (typeof w === 'number') won += w
      if (typeof l === 'number') lost += l
    }
    const denom = won + lost
    out.push(denom === 0 ? null : won / denom)
  }
  return out
}
