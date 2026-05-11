import clsx from 'clsx'
import type { DeltaResult } from '../lib/metrics'

type Props = {
  label: string
  value: number | null
  unit: string
  delta: DeltaResult | null
  formatValue?: (v: number) => string
}

const DEFAULT_FORMAT = (v: number) =>
  Number.isInteger(v) ? v.toLocaleString('es-CL') : v.toFixed(1)

export function KpiCard({ label, value, unit, delta, formatValue }: Props) {
  const fmt = formatValue ?? DEFAULT_FORMAT
  const valueText = value === null ? '—' : `${fmt(value)} ${unit}`.trim()

  const arrow = delta === null ? null : delta.raw > 0 ? '↑' : delta.raw < 0 ? '↓' : '·'
  const deltaPct = delta === null ? null : Math.round(Math.abs(delta.raw))

  const deltaColor = clsx(
    'text-xs font-semibold mt-1',
    delta === null && 'text-navy-700/40',
    delta?.isImprovement && 'text-status-green',
    delta && !delta.isImprovement && delta.raw !== 0 && 'text-status-red',
  )

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-navy-700/60">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-navy-900">{valueText}</p>
      <p className={deltaColor}>
        {delta === null
          ? '— sin baseline'
          : `${arrow}${deltaPct}% vs 30d`}
      </p>
    </div>
  )
}
