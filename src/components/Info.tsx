import { Info as InfoIcoon } from '@phosphor-icons/react'
import { useRef, useState, type ReactNode } from 'react'
import { cx } from './ui'
import Zwevend from './Zwevend'

/** Klein i-bolletje dat bij aanwijzen of aantikken een korte uitleg in gewone taal toont. */
export default function Info({ children, className, boven, links }: { children: ReactNode; className?: string; boven?: boolean; links?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  return (
    <span ref={ref} className={cx('relative inline-flex align-middle', className)} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true) }}
        className="grid h-5 w-5 place-items-center rounded-full text-ink-2/70 transition hover:scale-110 hover:text-violet"
        aria-label="Wat betekent dit?"
        aria-expanded={open}
      >
        <InfoIcoon size={16} />
      </button>
      <Zwevend anker={ref} open={open} onSluit={() => setOpen(false)} boven={boven} links={links} className="plop w-64 max-w-[calc(100vw-16px)]">
        <span role="tooltip" className="block rounded-2xl bg-ink px-3.5 py-2.5 text-left text-xs font-medium leading-relaxed text-op-ink shadow-xl">
          {children}
        </span>
      </Zwevend>
    </span>
  )
}
