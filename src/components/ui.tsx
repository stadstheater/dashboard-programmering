import { X, type Icon } from '@phosphor-icons/react'
import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { AANBOD_STATUSSEN, STATUSSEN, familieVan, type Segment } from '../data/vocab'
import { staffel, useOptellen } from '../lib/animatie'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/** Gevuld icoon op een zachte ondergrond in dezelfde kleur. */
export function IcoonBol({ icoon: I, kleur, grootte = 36, rond, className, style }: {
  icoon: Icon
  kleur: string
  grootte?: number
  rond?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={cx('inline-grid shrink-0 place-items-center', rond ? 'rounded-full' : 'rounded-[30%]', className)}
      style={{ width: grootte, height: grootte, background: kleur + '24', color: kleur, ...style }}
    >
      <I weight="fill" size={Math.round(grootte * 0.56)} />
    </span>
  )
}

export function Kaart({ titel, sub, actie, children, className, kleur, i = 0, uitleg }: {
  titel?: ReactNode
  sub?: ReactNode
  actie?: ReactNode
  children: ReactNode
  className?: string
  kleur?: string
  i?: number
  uitleg?: string
}) {
  return (
    <section data-uitleg={uitleg} className={cx('kaart verschijn p-5 sm:p-6', className)} style={{ ...staffel(i), ...(kleur ? { background: kleur } : {}) }}>
      {(titel || actie) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {titel && <h2 className="flex items-center gap-2 text-lg font-bold text-ink">{titel}</h2>}
            {sub && <p className="mt-0.5 text-sm text-ink-2">{sub}</p>}
          </div>
          {actie}
        </header>
      )}
      {children}
    </section>
  )
}

const TEGEL_STIJL = {
  perzik: { verloop: 'from-[#ffe7df] to-[#ffd2c6]', kleur: '#f4664d' },
  citroen: { verloop: 'from-[#fff4c7] to-[#ffe79a]', kleur: '#d48a00' },
  munt: { verloop: 'from-[#d6f7ef] to-[#b3eedf]', kleur: '#139a78' },
  lavendel: { verloop: 'from-[#eee8ff] to-[#ddd2ff]', kleur: '#7c5cf0' },
  ijs: { verloop: 'from-[#e0f3ff] to-[#c4e7ff]', kleur: '#1f83c9' },
  snoep: { verloop: 'from-[#ffe3f0] to-[#ffcae2]', kleur: '#db3f86' },
}

export function Getal({ waarde, opmaak }: { waarde: number; opmaak: (n: number) => string }) {
  const w = useOptellen(waarde)
  return <>{opmaak(w)}</>
}

export function KpiTegel({ label, waarde, opmaak, sub, icoon: I, kleur = 'perzik', voortgang, i = 0 }: {
  label: string
  waarde: number | ReactNode
  opmaak?: (n: number) => string
  sub?: ReactNode
  icoon?: Icon
  kleur?: keyof typeof TEGEL_STIJL
  voortgang?: number
  i?: number
}) {
  const stijl = TEGEL_STIJL[kleur]
  return (
    <div
      className={cx('verschijn group relative overflow-hidden rounded-3xl bg-gradient-to-br p-5 shadow-[var(--shadow-zacht)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hoog)]', stijl.verloop)}
      style={staffel(i)}
    >
      <span className="pointer-events-none absolute -right-6 -bottom-8 opacity-[0.09] transition duration-500 group-hover:scale-110 group-hover:-rotate-6" style={{ color: stijl.kleur }}>
        {I && <I weight="fill" size={120} />}
      </span>
      <div className="relative flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink-2">{label}</span>
        {I && (
          <span className="wip grid h-9 w-9 place-items-center rounded-2xl bg-white/75 shadow-sm" style={{ color: stijl.kleur }}>
            <I weight="fill" size={19} />
          </span>
        )}
      </div>
      <div className="font-display relative mt-2 whitespace-nowrap text-[1.7rem] font-extrabold tracking-tight text-ink tabular-nums sm:text-3xl xl:text-[1.75rem] 2xl:text-[2.1rem]">
        {typeof waarde === 'number' ? <Getal waarde={waarde} opmaak={opmaak ?? ((n) => Math.round(n).toLocaleString('nl-NL'))} /> : waarde}
      </div>
      {sub && <div className="relative mt-1 text-[13px] text-ink-2">{sub}</div>}
      {voortgang !== undefined && (
        <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/60">
          <div className="groei h-full rounded-full bg-ink/80" style={{ width: `${Math.min(100, voortgang * 100)}%`, ...staffel(i) }} />
        </div>
      )}
    </div>
  )
}

export function StatusLabel({ status, klein }: { status: string; klein?: boolean }) {
  const s = STATUSSEN.find((x) => x.naam === status) ?? AANBOD_STATUSSEN.find((x) => x.naam === status)
  return (
    <span
      className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold', klein ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs')}
      style={{ background: s?.zacht ?? '#eee', color: s?.kleur ?? '#333' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s?.kleur }} />
      {status}
    </span>
  )
}

export function SegmentChip({ segment, klein, actief = true, onClick }: { segment: Segment; klein?: boolean; actief?: boolean; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'span'
  const I = segment.icoon
  return (
    <Tag
      onClick={onClick}
      title={segment.omschrijving}
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border font-medium text-ink transition',
        klein ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        onClick && 'hover:-translate-y-px',
        !actief && 'opacity-45',
      )}
      style={{ borderColor: segment.kleur + '55', background: segment.kleur + '14' }}
    >
      <I weight="fill" size={klein ? 12 : 14} style={{ color: segment.kleur }} />
      {klein ? segment.kort : segment.naam}
    </Tag>
  )
}

export function GenreLabel({ genre, klein }: { genre: string; klein?: boolean }) {
  const f = familieVan(genre)
  const I = f.icoon
  return (
    <span
      className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold text-ink', klein ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs')}
      style={{ background: f.kleur + '1f' }}
    >
      <I weight="fill" size={klein ? 12 : 14} style={{ color: f.kleur }} />
      {genre}
    </span>
  )
}

function SluitKnop({ onSluit }: { onSluit: () => void }) {
  return (
    <button onClick={onSluit} className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm transition hover:rotate-90 hover:bg-perzik" aria-label="Sluiten">
      <X weight="bold" size={16} />
    </button>
  )
}

export function Lade({ open, onSluit, titel, children, breed }: { open: boolean; onSluit: () => void; titel: ReactNode; children: ReactNode; breed?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onSluit])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="vervaag-in absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={onSluit} />
      <aside className={cx('schuif-in dun-scroll relative h-full w-full overflow-y-auto bg-[#fffdfa] shadow-2xl', breed ? 'max-w-2xl' : 'max-w-lg')}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-[#fffdfa]/95 px-6 py-4 backdrop-blur">
          <div className="font-display text-xl font-bold">{titel}</div>
          <SluitKnop onSluit={onSluit} />
        </div>
        <div className="p-6">{children}</div>
      </aside>
    </div>
  )
}

export function Venster({ open, onSluit, titel, children }: { open: boolean; onSluit: () => void; titel: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onSluit])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="vervaag-in absolute inset-0 bg-ink/30 backdrop-blur-[2px]" onClick={onSluit} />
      <div className="plop dun-scroll relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-[#fffdfa] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-[#fffdfa]/95 px-6 py-4 backdrop-blur">
          <div className="font-display text-xl font-bold">{titel}</div>
          <SluitKnop onSluit={onSluit} />
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

/** Horizontale balk met een doelmarkering, voor aandeel versus streefwaarde. */
export function DoelBalk({ label, icoon: I, kleur, aandeel, doel, max = 40, sub, i = 0 }: {
  label: string
  icoon?: Icon
  kleur: string
  aandeel: number
  doel: number
  max?: number
  sub?: string
  i?: number
}) {
  const verschil = aandeel - doel
  return (
    <div className="group" title={`${label}: ${aandeel.toFixed(1)}% (doel ${doel}%)`}>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-ink">
          {I && <I weight="fill" size={16} className="shrink-0 self-center transition group-hover:scale-125" style={{ color: kleur }} />}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 tabular-nums text-ink-2">
          <b className="text-ink">{aandeel.toFixed(1).replace('.', ',')}%</b>
          <span className={cx('ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold', Math.abs(verschil) < 1.5 ? 'bg-slate-100 text-slate-600' : verschil > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
            {verschil > 0 ? '+' : ''}{verschil.toFixed(1).replace('.', ',')}
          </span>
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-[#f6efe6]">
        <div className="groei h-full rounded-full transition-[width] duration-700 group-hover:brightness-110" style={{ width: `${Math.min(100, (aandeel / max) * 100)}%`, background: kleur, ...staffel(i) }} />
        <div className="absolute -top-1 h-5 w-[3px] rounded-full bg-ink transition-[left] duration-700" style={{ left: `calc(${Math.min(100, (doel / max) * 100)}% - 1px)` }} title={`Doel ${doel}%`} />
      </div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}

export function Leeg({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-ink-2">{children}</div>
}

export function Tabs<T extends string>({ waarde, opties, onChange, uitleg }: { waarde: T; opties: { id: T; label: ReactNode }[]; onChange: (t: T) => void; uitleg?: string }) {
  return (
    <div data-uitleg={uitleg} className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-white p-1 shadow-sm">
      {opties.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cx('flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95', waarde === o.id ? 'bg-ink text-white shadow' : 'text-ink-2 hover:bg-perzik/60')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Paginakop({ titel, icoon: I, kleur, sub, children }: { titel: string; icoon: Icon; kleur: string; sub: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="zweef grid h-12 w-12 place-items-center rounded-2xl text-white shadow-[var(--shadow-hoog)]" style={{ background: `linear-gradient(135deg, ${kleur}, ${kleur}bb)` }}>
            <I weight="fill" size={26} />
          </span>
          {titel}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-2">{sub}</p>
      </div>
      {children}
    </div>
  )
}

export function ScoreRing({ score, grootte = 52 }: { score: number; grootte?: number }) {
  const r = grootte / 2 - 5
  const omtrek = 2 * Math.PI * r
  const kleur = score >= 75 ? '#16a34a' : score >= 55 ? '#d97706' : '#dc2626'
  return (
    <div className="relative shrink-0" style={{ width: grootte, height: grootte }} title={`Matchscore ${score} van 100`}>
      <svg width={grootte} height={grootte} className="-rotate-90">
        <circle cx={grootte / 2} cy={grootte / 2} r={r} fill="none" stroke="#f3ebe1" strokeWidth={6} />
        <circle
          className="ring-teken"
          cx={grootte / 2}
          cy={grootte / 2}
          r={r}
          fill="none"
          stroke={kleur}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={omtrek}
          strokeDashoffset={omtrek * (1 - score / 100)}
          style={{ ['--omtrek' as string]: omtrek, transition: 'stroke-dashoffset .6s ease' }}
        />
      </svg>
      <span className="font-display absolute inset-0 grid place-items-center text-sm font-extrabold">{score}</span>
    </div>
  )
}
