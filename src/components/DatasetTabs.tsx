import clsx from 'clsx'
import type { DatasetKey } from '../types'

const KEYS: DatasetKey[] = ['A', 'B', 'C', 'D']

type Props = {
  active: DatasetKey
  onChange: (key: DatasetKey) => void
}

export function DatasetTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Dataset activo"
      className="inline-flex rounded-md bg-navy-800 p-1"
    >
      {KEYS.map((key) => {
        const isActive = key === active
        return (
          <button
            key={key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={clsx(
              'min-w-10 px-4 py-1.5 text-sm font-semibold rounded',
              isActive
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                : 'text-white/70 hover:text-white hover:bg-white/10',
            )}
          >
            {key}
          </button>
        )
      })}
    </div>
  )
}
