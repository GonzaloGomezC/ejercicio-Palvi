import clsx from 'clsx'
import type { AreaScore } from '../../lib/scoring'
import { statusForScore } from '../../lib/scoring'
import { AREAS, METRIC_LABELS } from '../../lib/constants'

type Props = {
  area: AreaScore
}

const TONE_TEXT = {
  green: 'text-status-green',
  yellow: 'text-status-yellow',
  red: 'text-status-red',
} as const

const TONE_DOT = {
  green: 'bg-status-green',
  yellow: 'bg-status-yellow',
  red: 'bg-status-red',
} as const

const fmt = (v: number | null) =>
  v === null ? '—' : Number.isInteger(v) ? v.toLocaleString('es-CL') : v.toFixed(2)

const fmtDelta = (d: number | null) => {
  if (d === null) return '—'
  const sign = d > 0 ? '+' : ''
  return `${sign}${Math.round(d)}%`
}

export function AreaDetail({ area }: Props) {
  const cfg = AREAS[area.area]
  const status = statusForScore(area.score)
  const weightPct = Math.round(cfg.weight * 100)

  const lowest = area.metrics.reduce((a, b) =>
    a.score <= b.score ? a : b,
  )
  const triggersAlerts = area.score < 50

  return (
    <div className="space-y-4">
      <div>
        <p className={clsx('text-4xl font-bold', TONE_TEXT[status.tone])}>
          {Math.round(area.score)}
          <span className="text-base font-medium text-navy-700/60">/100</span>
        </p>
        <p className={clsx('text-sm font-semibold flex items-center gap-1.5', TONE_TEXT[status.tone])}>
          <span className={clsx('inline-block w-2 h-2 rounded-full', TONE_DOT[status.tone])} aria-hidden />
          {status.label}
        </p>
      </div>

      <div className="rounded-md bg-navy-900/5 p-3 text-sm text-navy-900/80">
        <p>
          El score del área <strong>{area.label}</strong> se calcula como el{' '}
          <em>promedio simple</em> de los scores de sus {area.metrics.length}{' '}
          métricas. Esta área pesa <strong>{weightPct}%</strong> del Sales
          Health Score general.
        </p>
        <p className="mt-2">
          La métrica con menor score es{' '}
          <strong>{METRIC_LABELS[lowest.key] ?? lowest.key}</strong> (
          {Math.round(lowest.score)}/100), por lo que es la que más arrastra el
          promedio del área.
        </p>
        {triggersAlerts && (
          <p className="mt-2 text-status-red font-semibold">
            ⚠ Score bajo 50: dispara alerta para todas las métricas del área.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-700/60 mb-2">
          Métricas del área
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-navy-700/60 border-b border-navy-900/10">
              <th className="text-left py-2 font-medium">Métrica</th>
              <th className="text-right py-2 font-medium">Score</th>
              <th className="text-right py-2 font-medium">Δ</th>
              <th className="text-right py-2 font-medium">7d</th>
              <th className="text-right py-2 font-medium">30d</th>
            </tr>
          </thead>
          <tbody>
            {area.metrics.map((m) => {
              const tone = statusForScore(m.score).tone
              return (
                <tr
                  key={m.key}
                  className="border-b border-navy-900/5 last:border-0"
                >
                  <td className="py-2 truncate">
                    {METRIC_LABELS[m.key] ?? m.key}
                  </td>
                  <td
                    className={clsx(
                      'py-2 text-right font-bold',
                      TONE_TEXT[tone],
                    )}
                  >
                    {Math.round(m.score)}
                  </td>
                  <td className="py-2 text-right">{fmtDelta(m.delta)}</td>
                  <td className="py-2 text-right text-navy-700/70">
                    {fmt(m.avg7d)}
                  </td>
                  <td className="py-2 text-right text-navy-700/70">
                    {fmt(m.avg30d)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
