import clsx from 'clsx'
import type { Alert } from '../lib/scoring'

type Props = {
  alerts: Alert[]
  maxVisible?: number
}

const SEVERITY_ICON = {
  critical: '🔴',
  warning: '🟡',
} as const

function formatDelta(rawDelta: number | null): string {
  if (rawDelta === null) return '—'
  const arrow = rawDelta > 0 ? '↑' : rawDelta < 0 ? '↓' : '·'
  return `${arrow}${Math.round(Math.abs(rawDelta))}%`
}

export function AlertPanel({ alerts, maxVisible = 3 }: Props) {
  if (alerts.length === 0) {
    return (
      <section
        aria-label="Alertas"
        className="rounded-lg bg-white p-6 shadow-sm"
      >
        <p className="text-sm font-semibold text-status-green">
          ✓ Todo en rango — sin alertas activas
        </p>
      </section>
    )
  }

  const visible = alerts.slice(0, maxVisible)
  const hiddenCount = alerts.length - visible.length

  return (
    <section
      aria-label="Alertas"
      className="rounded-lg bg-white p-6 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-navy-700">
        ⚠ Alertas ({alerts.length})
      </h3>

      <ul className="mt-4 space-y-3">
        {visible.map((alert) => (
          <li
            key={alert.metricKey}
            className="flex items-start gap-3 border-l-4 border-l-transparent pl-3"
            style={{
              borderLeftColor:
                alert.severity === 'critical'
                  ? 'var(--color-status-red)'
                  : 'var(--color-status-yellow)',
            }}
          >
            <span aria-hidden className="text-lg leading-tight">
              {SEVERITY_ICON[alert.severity]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-navy-900 truncate">
                  {alert.metricLabel}
                </p>
                <p
                  className={clsx(
                    'text-sm font-bold whitespace-nowrap',
                    alert.severity === 'critical'
                      ? 'text-status-red'
                      : 'text-status-yellow',
                  )}
                >
                  {formatDelta(alert.rawDelta)}
                </p>
              </div>
              <p className="text-xs text-navy-700/70">
                {alert.areaLabel}: {Math.round(alert.areaScore)}/100 ·{' '}
                {alert.impactMessage}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <p className="mt-4 text-xs text-navy-700/60">
          + {hiddenCount} alerta{hiddenCount === 1 ? '' : 's'} más
        </p>
      )}
    </section>
  )
}
