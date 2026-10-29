import { ArrowCounterClockwise, ArrowsClockwise, Lightbulb, Palette, Target, UsersThree, type Icon } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { wisAlleUitleg } from '../components/Rondleiding'
import { CdmLabel, Kaart, Paginakop, cx } from '../components/ui'
import { STANDAARD_DOELEN } from '../data/generate'
import type { Doelen as DoelenType } from '../data/types'
import { DOELGROEPEN, GENRE_FAMILIES, MOTIVATIES } from '../data/vocab'
import { useStore } from '../store/useStore'

/** Schuif voor één streefaandeel. Op een telefoon staat de naam boven de schuif. */
function DoelSchuif({ label, kleur, waarde, onChange, max = 40 }: { label: ReactNode; kleur: string; waarde: number; onChange: (n: number) => void; max?: number }) {
  return (
    <label className="grid grid-cols-[1fr_3rem] items-center gap-x-3 gap-y-1 sm:grid-cols-[15rem_1fr_3rem]">
      <span className="col-span-2 flex min-w-0 items-center gap-2 text-sm sm:col-span-1">{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        value={waarde}
        onChange={(e) => onChange(Number(e.target.value))}
        className="schuif w-full"
        style={{ ['--k' as string]: kleur, background: `linear-gradient(to right, ${kleur} ${(waarde / max) * 100}%, var(--color-spoor) ${(waarde / max) * 100}%)` }}
      />
      <span className="text-right font-semibold tabular-nums">{waarde}%</span>
    </label>
  )
}

function Totaal({ som }: { som: number }) {
  return (
    <span className={cx('rounded-full px-2.5 py-1 text-xs font-bold', som === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800')}>
      totaal {som}%{som !== 100 && ', streef naar 100%'}
    </span>
  )
}

const somVan = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0)

export default function Doelen() {
  const doelen = useStore((s) => s.dataset.doelen)
  const setDoelen = useStore((s) => s.setDoelen)
  const opnieuwBeginnen = useStore((s) => s.opnieuwBeginnen)
  const [melding, setMelding] = useState<string | null>(null)
  const zet = (soort: 'doelgroepen' | 'motivaties' | 'genres', naam: string, w: number) =>
    setDoelen({ ...doelen, [soort]: { ...doelen[soort], [naam]: w } } as DoelenType)

  const blok = (titel: string, icoon: Icon, kleur: string, soort: 'doelgroepen' | 'motivaties' | 'genres', rijen: { naam: string; kleur: string; label: ReactNode }[], i: number, max = 40) => {
    const I = icoon
    return (
      <Kaart i={i} uitleg={i === 0 ? 'doelen-schuiven' : undefined} titel={<><I size={20} style={{ color: kleur }} /> {titel}</>} actie={<Totaal som={somVan(doelen[soort])} />}>
        <div className="space-y-3">
          {rijen.map((r) => <DoelSchuif key={r.naam} label={r.label} kleur={r.kleur} waarde={doelen[soort][r.naam] ?? 0} max={max} onChange={(w) => zet(soort, r.naam, w)} />)}
        </div>
      </Kaart>
    )
  }

  return (
    <div>
      <Paginakop titel="Doelen" icoon={Target} kleur="#7c5cf0" sub="Wat willen we per seizoen bereiken? Het dashboard vergelijkt alles met deze doelen." />
      {melding && <div className="verschijn mb-4 rounded-2xl bg-citroen px-4 py-3 text-sm font-medium">{melding}</div>}

      <div className="grid items-start gap-6 xl:grid-cols-2">
        {blok('Publiek', UsersThree, '#0f9f84', 'doelgroepen', DOELGROEPEN.map((d) => ({ naam: d.naam, kleur: d.kleur, label: <><CdmLabel segment={d} /><span className="truncate">{d.naam}</span></> })), 0)}
        <div className="space-y-6">
          <Kaart i={1} uitleg="doelen-seizoen" titel={<><Target size={20} className="text-violet" /> Seizoen</>}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink-2">Zalen gemiddeld vol (%)</span>
                <input type="number" min={0} max={100} className="invoer" value={doelen.bezetting} onChange={(e) => setDoelen({ ...doelen, bezetting: Number(e.target.value) })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-ink-2">Aantal voorstellingen</span>
                <input type="number" min={0} className="invoer" value={doelen.aantal} onChange={(e) => setDoelen({ ...doelen, aantal: Number(e.target.value) })} />
              </label>
            </div>
          </Kaart>
          {blok('Motivaties', Lightbulb, '#db2777', 'motivaties', MOTIVATIES.map((m) => ({ naam: m.naam, kleur: m.kleur, label: <><m.icoon size={16} className="shrink-0" style={{ color: m.kleur }} /><span className="truncate">{m.naam}</span></> })), 2, 50)}
          {blok('Genres', Palette, '#2a78d6', 'genres', GENRE_FAMILIES.map((f) => ({ naam: f.naam, kleur: f.kleur, label: <><f.icoon size={16} className="shrink-0" style={{ color: f.kleur }} /><span className="truncate">{f.naam}</span></> })), 3)}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-6">
        <button className="knop knop-zacht" onClick={() => { setDoelen(STANDAARD_DOELEN); setMelding('De standaarddoelen staan weer ingesteld.') }}>
          <ArrowCounterClockwise size={16} /> Standaarddoelen herstellen
        </button>
        <button className="knop knop-zacht" onClick={() => { wisAlleUitleg(); setMelding('De uitleg verschijnt weer bij je volgende bezoek aan elk onderdeel.') }}>
          <Lightbulb size={16} /> Uitleg weer aanzetten
        </button>
        <button className="knop knop-zacht" onClick={() => { if (confirm('Alle wijzigingen wissen en opnieuw beginnen met voorbeelddata?')) { opnieuwBeginnen(); setMelding('Je begint weer met verse voorbeelddata.') } }}>
          <ArrowsClockwise size={16} /> Opnieuw beginnen
        </button>
      </div>
    </div>
  )
}
