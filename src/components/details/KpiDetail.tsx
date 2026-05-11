import clsx from 'clsx'
import type { Direction } from '../../types'
import type { DeltaResult } from '../../lib/metrics'

export type KpiDetailData = {
  label: string
  description: string
  unit: string
  direction: Direction
  value: number | null
  baseline: number | null
  delta: DeltaResult | null
  baselineLabel: string         // ej. "Promedio últimos 30 días"
  formatValue?: (v: number) => string
  formula?: {
    label: string               // ej. "Win rate ayer = won / (won + lost)"
    parts: { label: string; value: number | null }[]
  }
}

const DEFAULT_FMT = (v: number) =>
  Number.isInteger(v) ? v.toLocaleString('es-CL') : v.toFixed(2)

export function KpiDetail({ data }: { data: KpiDetailData }) {
  const fmt = data.formatValue ?? DEFAULT_FMT
  const valueText =
    data.value === null ? '—' : `${fmt(data.value)} ${data.unit}`.trim()
  const baselineText =
    data.baseline === null ? '—' : `${fmt(data.baseline)} ${data.unit}`.trim()

  const deltaText =
    data.delta === null
      ? '— sin baseline'
      : `${data.delta.raw > 0 ? '↑' : data.delta.raw < 0 ? '↓' : '·'}${Math.round(Math.abs(data.delta.raw))}% vs baseline`

  const deltaColor =
    data.delta === null
      ? 'text-navy-700/40'
      : data.delta.isImprovement
        ? 'text-status-green'
        : data.delta.raw === 0
          ? 'text-navy-700'
          : 'text-status-red'

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">
          {data.label}
        </p>
        <p className="text-3xl font-bold text-navy-900 mt-1">{valueText}</p>
        <p className={clsx('text-sm font-bold mt-1', deltaColor)}>{deltaText}</p>
      </div>

      <div className="rounded-md bg-navy-900/5 p-3 text-sm text-navy-900/80">
        <p>{data.description}</p>
        <p className="mt-2 text-xs text-navy-700/70">
          Esta métrica es{' '}
          <code className="bg-navy-900/10 px-1 rounded">{data.direction}</code>:{' '}
          un valor{' '}
          {data.direction === 'higher_is_better'
            ? 'mayor que el baseline'
            : 'menor que el baseline'}{' '}
          cuenta como mejora (verde).
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-700/60 mb-2">
          Comparación
        </h3>
        <dl className="text-sm grid grid-cols-2 gap-y-2">
          <dt className="text-navy-700/70">Valor de ayer</dt>
          <dd className="text-right font-semibold">{valueText}</dd>
          <dt className="text-navy-700/70">{data.baselineLabel}</dt>
          <dd className="text-right font-semibold">{baselineText}</dd>
        </dl>
      </div>

      {data.formula && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-700/60 mb-2">
            Cómo se calcula
          </h3>
          <p className="text-sm text-navy-900 mb-2">
            <code className="bg-navy-900/5 px-2 py-1 rounded">
              {data.formula.label}
            </code>
          </p>
          <dl className="text-sm grid grid-cols-2 gap-y-1">
            {data.formula.parts.map((p) => (
              <span key={p.label} className="contents">
                <dt className="text-navy-700/70">{p.label}</dt>
                <dd className="text-right font-semibold">
                  {p.value === null ? '—' : DEFAULT_FMT(p.value)}
                </dd>
              </span>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}
