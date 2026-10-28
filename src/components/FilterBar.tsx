import { CaretDown, MagnifyingGlass, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { DOELGROEPEN, GENRES, MOTIVATIES, STATUSSEN, ZALEN } from '../data/vocab'
import { useStore, type Filters } from '../store/useStore'
import { cx } from './ui'

function Keuze({ label, opties, gekozen, onChange }: {
  label: string
  opties: { naam: string; kleur?: string; emoji?: string }[]
  gekozen: string[]
  onChange: (w: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cx('flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition', gekozen.length ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-[#fff6ee]')}
      >
        {label}
        {gekozen.length > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs">{gekozen.length}</span>}
        <CaretDown size={15} />
      </button>
      {open && (
        <div className="verschijn absolute left-0 z-40 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-hoog)]">
          {opties.map((o) => {
            const aan = gekozen.includes(o.naam)
            return (
              <label key={o.naam} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm hover:bg-[#fff6ee]">
                <input type="checkbox" checked={aan} onChange={() => onChange(aan ? gekozen.filter((g) => g !== o.naam) : [...gekozen, o.naam])} className="h-4 w-4 accent-violet-600" />
                {o.kleur && <span className="h-2.5 w-2.5 rounded-full" style={{ background: o.kleur }} />}
                {o.emoji && <span>{o.emoji}</span>}
                <span className="flex-1">{o.naam}</span>
              </label>
            )
          })}
          {gekozen.length > 0 && (
            <button onClick={() => onChange([])} className="mt-1 w-full rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50">Selectie wissen</button>
          )}
        </div>
      )}
    </div>
  )
}

export default function FilterBar({ verberg = [] }: { verberg?: (keyof Filters)[] }) {
  const filters = useStore((s) => s.filters)
  const setFilters = useStore((s) => s.setFilters)
  const wis = useStore((s) => s.wisFilters)
  const aantal = filters.genres.length + filters.zalen.length + filters.statussen.length + filters.doelgroepen.length + filters.motivaties.length + (filters.zoek ? 1 : 0)
  return (
    <div data-uitleg="filters" className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1 sm:max-w-xs">
        <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="invoer !rounded-full !pl-9" placeholder="Zoek titel, artiest of impresariaat" value={filters.zoek} onChange={(e) => setFilters({ zoek: e.target.value })} />
      </div>
      {!verberg.includes('genres') && <Keuze label="Genre" opties={GENRES.map((g) => ({ naam: g }))} gekozen={filters.genres} onChange={(genres) => setFilters({ genres })} />}
      {!verberg.includes('zalen') && <Keuze label="Zaal" opties={ZALEN.map((z) => ({ naam: z.naam }))} gekozen={filters.zalen} onChange={(zalen) => setFilters({ zalen })} />}
      {!verberg.includes('statussen') && <Keuze label="Status" opties={STATUSSEN.map((s) => ({ naam: s.naam, kleur: s.kleur }))} gekozen={filters.statussen} onChange={(statussen) => setFilters({ statussen })} />}
      {!verberg.includes('doelgroepen') && <Keuze label="Doelgroep" opties={DOELGROEPEN} gekozen={filters.doelgroepen} onChange={(doelgroepen) => setFilters({ doelgroepen })} />}
      {!verberg.includes('motivaties') && <Keuze label="Motivatie" opties={MOTIVATIES} gekozen={filters.motivaties} onChange={(motivaties) => setFilters({ motivaties })} />}
      {aantal > 0 && (
        <button onClick={wis} className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
          <X size={15} /> Wis filters
        </button>
      )}
    </div>
  )
}
