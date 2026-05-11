import { useEffect } from 'react'
import type { ReactNode } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function DetailPanel({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-navy-900/40"
        onClick={onClose}
      />
      <aside className="absolute top-0 right-0 h-full w-full sm:w-[440px] bg-white shadow-xl overflow-y-auto">
        <header className="sticky top-0 bg-white border-b border-navy-900/10 px-5 py-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-navy-900 truncate">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="text-navy-700/70 hover:text-navy-900 text-xl leading-none px-2"
          >
            ×
          </button>
        </header>
        <div className="px-5 py-4">{children}</div>
      </aside>
    </div>
  )
}
