import clsx from 'clsx'
import type { Alert } from '../lib/scoring'

type Props = {
  alerts: Alert[]
  onAlertClick?: (alert: Alert) => void
}

const SEVERITY_DOT = {
  critical: 'bg-status-red',
  warning: 'bg-status-yellow',
} as const

function formatDelta(rawDelta: number | null): string {
  if (rawDelta === null) return '—'
  const arrow = rawDelta > 0 ? '↑' : rawDelta < 0 ? '↓' : '·'
  return `${arrow}${Math.round(Math.abs(rawDelta))}%`
}

export function AlertPanel({ alerts, onAlertClick }: Props) {
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

  return (
    <section
      aria-label="Alertas"
      className="rounded-lg bg-white p-6 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-navy-700">
        ⚠ Alertas ({alerts.length})
      </h3>

      <ul className="mt-4 space-y-2 max-h-[28rem] overflow-y-auto">
        {alerts.map((alert) => {
          const borderColor =
            alert.severity === 'critical'
              ? 'var(--color-status-red)'
              : 'var(--color-status-yellow)'
          const inner = (
            <>
              <span
                aria-hidden
                className={clsx('mt-0.5 inline-block w-2.5 h-2.5 rounded-full shrink-0', SEVERITY_DOT[alert.severity])}
              />
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
            </>
          )

          const baseClass =
            'w-full text-left flex items-start gap-3 border-l-4 pl-3 py-1 rounded-r'

          if (onAlertClick) {
            return (
              <li key={alert.metricKey}>
                <button
                  type="button"
                  onClick={() => onAlertClick(alert)}
                  className={clsx(
                    baseClass,
                    'hover:bg-navy-900/[0.03] cursor-pointer',
                  )}
                  style={{ borderLeftColor: borderColor }}
                >
                  {inner}
                </button>
              </li>
            )
          }
          return (
            <li
              key={alert.metricKey}
              className={baseClass}
              style={{ borderLeftColor: borderColor }}
            >
              {inner}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
