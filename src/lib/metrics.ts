import type { Dataset, DayEntry, Direction } from '../types'

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
