import clsx from 'clsx'
import type { Alert } from '../../lib/scoring'

type Props = {
  alert: Alert
}

const SEVERITY = {
  critical: { icon: '🔴', label: 'Crítica', color: 'text-status-red' },
  warning: { icon: '🟡', label: 'Advertencia', color: 'text-status-yellow' },
} as const

const fmt = (v: number | null) =>
  v === null ? '—' : Number.isInteger(v) ? v.toLocaleString('es-CL') : v.toFixed(2)

const fmtRaw = (raw: number | null) => {
  if (raw === null) return '—'
  const arrow = raw > 0 ? '↑' : raw < 0 ? '↓' : '·'
  return `${arrow}${Math.round(Math.abs(raw))}%`
}

export function AlertDetail({ alert }: Props) {
  const sev = SEVERITY[alert.severity]

  return (
    <div className="space-y-4">
      <div>
        <p className={clsx('text-sm font-semibold', sev.color)}>
          {sev.icon} Alerta {sev.label.toLowerCase()}
        </p>
        <p className="text-2xl font-bold text-navy-900 mt-1">
          {alert.metricLabel}
        </p>
        <p className={clsx('text-base font-bold mt-1', sev.color)}>
          {fmtRaw(alert.rawDelta)} vs baseline 30d
        </p>
      </div>

      <div className="rounded-md bg-navy-900/5 p-3 text-sm text-navy-900/80 space-y-2">
        <p className="font-semibold text-navy-900">¿Por qué se disparó?</p>
        {(alert.trigger === 'delta' || alert.trigger === 'both') && (
          <p>
            • El cambio direction-adjusted de{' '}
            <strong>{Math.round(alert.delta ?? 0)}%</strong> supera el umbral
            de <strong>−20%</strong> en sentido negativo.
          </p>
        )}
        {(alert.trigger === 'score' || alert.trigger === 'both') && (
          <p>
            • El score del área <strong>{alert.areaLabel}</strong> es{' '}
            <strong>{Math.round(alert.areaScore)}/100</strong>, bajo el umbral
            de <strong>50</strong>. Esto dispara alerta para todas las métricas
            del área.
          </p>
        )}
        {alert.severity === 'critical' && (
          <p className="text-status-red font-semibold pt-1">
            Severidad crítica: delta {'<'} −40% o score de área {'<'} 35.
          </p>
        )}
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-700/60 mb-2">
          Impacto en negocio
        </h3>
        <p className="text-sm text-navy-900">{alert.impactMessage}</p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-navy-700/60 mb-2">
          Valores
        </h3>
        <dl className="text-sm grid grid-cols-2 gap-y-2">
          <dt className="text-navy-700/70">Promedio 7d</dt>
          <dd className="text-right font-semibold">{fmt(alert.avg7d)}</dd>
          <dt className="text-navy-700/70">Baseline 30d</dt>
          <dd className="text-right font-semibold">{fmt(alert.avg30d)}</dd>
          <dt className="text-navy-700/70">Score área</dt>
          <dd className="text-right font-semibold">
            {Math.round(alert.areaScore)}/100
          </dd>
        </dl>
      </div>
    </div>
  )
}
