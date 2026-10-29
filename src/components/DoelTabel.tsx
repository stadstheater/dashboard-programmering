import { CaretDown, type Icon } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { isLicht } from '../data/vocab'
import { staffel } from '../lib/animatie'
import Info from './Info'
import { cx } from './ui'

export interface DoelRij {
  naam: string
  label: ReactNode
  kleur: string
  doel: number
  realisatie: number
}

const pct = (x: number) => `${x.toFixed(1).replace('.', ',')}%`

/** Tabel met per regel het doel, de realisatie en het verschil, plus een balk met doelstreepje. Inklapbaar op een telefoon. */
export default function DoelTabel({ titel, icoon: I, kleur, rijen, actief, uitleg, inklapbaar }: {
  titel: string
  icoon: Icon
  kleur: string
  rijen: DoelRij[]
  actief?: boolean
  uitleg?: string
  inklapbaar?: boolean
}) {
  const [open, setOpen] = useState(false)
  const toon = !inklapbaar || open
  const max = Math.max(...rijen.flatMap((r) => [r.doel, r.realisatie]), 1) * 1.1
  return (
    <section
      data-uitleg={uitleg}
      className={cx('kaart verschijn p-5 transition', actief && 'ring-2 ring-offset-2')}
      style={actief ? ({ '--tw-ring-color': kleur } as React.CSSProperties) : undefined}
    >
      <header className={cx('flex items-center gap-2.5', toon && 'mb-3')}>
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: kleur + '22', color: kleur }}>
          <I size={19} />
        </span>
        {inklapbaar ? (
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-w-0 flex-1 items-center justify-between gap-2 self-stretch text-left">
            <h2 className="text-lg font-bold">{titel}</h2>
            <CaretDown size={18} className={cx('shrink-0 text-ink-2 transition', open && 'rotate-180')} />
          </button>
        ) : (
          <h2 className="text-lg font-bold">{titel}</h2>
        )}
        <Info className={cx(!inklapbaar && 'ml-auto')}>
          Doel: het aandeel dat we dit seizoen willen bereiken. Realisatie: het aandeel van alle bezoekers, met echte aantallen voor gespeelde voorstellingen en de verwachting voor de rest.
        </Info>
      </header>
      {toon && (<>
      <div className="grid grid-cols-[1fr_2.6rem_4.4rem_3.6rem] items-end gap-x-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        <span />
        <span className="text-right">Doel</span>
        <span className="text-right">Realisatie</span>
        <span className="text-right">Verschil</span>
      </div>
      <ul className="divide-y divide-line/60">
        {rijen.map((r, i) => {
          const verschil = r.realisatie - r.doel
          return (
            <li key={r.naam} className="verschijn py-2" style={staffel(i)} title={`${r.naam}: doel ${pct(r.doel)}, realisatie ${pct(r.realisatie)}`}>
              <div className="flex min-w-0 items-center gap-1.5 text-sm font-medium">{r.label}</div>
              <div className="mt-1 grid grid-cols-[1fr_2.6rem_4.4rem_3.6rem] items-center gap-x-2 text-sm">
                <div className="relative h-2 rounded-full bg-spoor">
                  <div
                    className={cx('groei h-full rounded-full', isLicht(r.kleur) && 'ring-1 ring-inset ring-black/15')}
                    style={{ width: `${Math.min(100, (r.realisatie / max) * 100)}%`, background: r.kleur, ...staffel(i) }}
                  />
                  <div className="absolute -top-0.5 h-3 w-[2px] rounded-full bg-ink" style={{ left: `${Math.min(100, (r.doel / max) * 100)}%` }} />
                </div>
                <span className="text-right tabular-nums text-ink-2">{Math.round(r.doel)}%</span>
                <span className="text-right font-semibold tabular-nums">{pct(r.realisatie)}</span>
                <span className={cx('justify-self-end rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold tabular-nums', Math.abs(verschil) < 1.5 ? 'bg-slate-100 text-slate-600' : verschil > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                  {verschil > 0 ? '+' : ''}{verschil.toFixed(1).replace('.', ',')}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
      </>)}
    </section>
  )
}
