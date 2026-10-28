import { Info as InfoIcoon } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from './ui'

/** Klein i-bolletje dat bij aanwijzen of aantikken een korte uitleg in gewone taal toont. */
export default function Info({ children, className }: { children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <span ref={ref} className={cx('relative inline-flex align-middle', className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(!open) }}
        className="grid h-5 w-5 place-items-center rounded-full text-ink-2/70 transition hover:scale-110 hover:text-violet"
        aria-label="Wat betekent dit?"
      >
        <InfoIcoon size={16} />
      </button>
      {open && (
        <span className="plop absolute left-1/2 top-full z-40 mt-2 w-64 -translate-x-1/2 rounded-2xl bg-ink px-3.5 py-2.5 text-left text-xs font-medium leading-relaxed text-white shadow-xl">
          {children}
        </span>
      )}
    </span>
  )
}
