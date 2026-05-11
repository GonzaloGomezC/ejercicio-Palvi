import clsx from 'clsx'
import type { Direction } from '../../types'
import { getTrendColor } from '../../lib/metrics'
import { Sparkline } from '../Sparkline'

export type SparklineDetailData = {
  label: string
  values: (number | null)[]
  dates: string[]
  unit: string
  direction: Direction
  formatValue?: (v: number) => string
}

const DEFAULT_FMT = (v: number) =>
  Number.isInteger(v) ? v.toLocaleString('es-CL') : v.toFixed(2)

const TREND_TEXT = {
  green: 'text-status-green',
  red: 'text-status-red',
  neutral: 'text-navy-700',
} as const

const TREND_LABEL = {
  green: 'verde (mejora)',
  red: 'rojo (deterioro)',
  neutral: 'neutral (sin cambio significativo)',
} as const

function meanRange(
  values: (number | null)[],
  from: number,
  to: number,
): number | null {
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

export function SparklineDetail({ data }: { data: SparklineDetailData }) {
  const fmt = data.formatValue ?? DEFAULT_FMT
  const trend = getTrendColor(data.values, data.direction)

  const numeric = data.values.filter(
    (v): v is number => typeof v === 'number',
  )
  const min = numeric.length ? Math.min(...numeric) : null
  const max = numeric.length ? Math.max(...numeric) : null
  const last = data.values[data.values.length - 1]
  const lastNum = typeof last === 'number' ? last : null

  const first7 = meanRange(data.values, 0, 7)
  const last7 = meanRange(data.values, data.values.length - 7, data.values.length)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">
          {data.label}
        </p>
        <p className={clsx('text-2xl font-bold mt-1', TREND_TEXT[trend])}>
          {lastNum === null
            ? '—'
            : `${fmt(lastNum)} ${data.unit}`.trim()}
        </p>
        <p className="text-xs text-navy-700/60 mt-0.5">Último día</p>
      </div>

      <div className="bg-navy-900/5 rounded-md p-3">
        <Sparkline
          label="Tendencia 28 días"
          values={data.values}
          dates={data.dates}
          unit={data.unit}
          direction={data.direction}
          formatValue={data.formatValue}
        />
      </div>

      <div className="rounded-md bg-navy-900/5 p-3 text-sm text-navy-900/80">
        <p>
          La línea es <strong>{TREND_LABEL[trend]}</strong>.
        </p>
        <p className="mt-2 text-xs">
          Comparamos la media de los <strong>primeros 7 días</strong> de la
          ventana ({first7 === null ? '—' : DEFAULT_FMT(first7)}) con la media
          de los <strong>últimos 7 días</strong> (
          {last7 === null ? '—' : DEFAULT_FMT(last7)}).
        </p>
        <p className="mt-2 text-xs">
          Como esta métrica es{' '}
          <code className="bg-navy-900/10 px-1 rounded">{data.direction}</code>,
          un cambio{' '}
          {data.direction === 'higher_is_better' ? 'al alza' : 'a la baja'}{' '}
          cuenta como mejora.
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-700/60 mb-2">
          Resumen 28 días
        </h3>
        <dl className="text-sm grid grid-cols-2 gap-y-2">
          <dt className="text-navy-700/70">Mínimo</dt>
          <dd className="text-right font-semibold">
            {min === null ? '—' : fmt(min)}
          </dd>
          <dt className="text-navy-700/70">Máximo</dt>
          <dd className="text-right font-semibold">
            {max === null ? '—' : fmt(max)}
          </dd>
          <dt className="text-navy-700/70">Último</dt>
          <dd className="text-right font-semibold">
            {lastNum === null ? '—' : fmt(lastNum)}
          </dd>
          <dt className="text-navy-700/70">Días con dato</dt>
          <dd className="text-right font-semibold">
            {numeric.length}/{data.values.length}
          </dd>
        </dl>
      </div>
    </div>
  )
}
