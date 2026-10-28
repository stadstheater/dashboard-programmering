import { CaretLeft, CaretRight, CheckCircle, DotsSixVertical, Flask, Lightning, Star, Target, Trash, X } from '@phosphor-icons/react'
import Confetti from '../components/Confetti'
import { staffel } from '../lib/animatie'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { TipKaart } from '../components/charts'
import { CdmLabel, GenreLabel, Kaart, Leeg, Paginakop, ScoreRing, Tabs, cx } from '../components/ui'
import { isoDatum, seizoenStartJaar } from '../data/generate'
import { DOELGROEPEN, MOTIVATIES, PLAN_SEIZOEN, familieVan } from '../data/vocab'
import {
  MAANDNAMEN, MAANDNAMEN_LANG, SEIZOENSMAANDEN, aandelen, actief, bereikPerDoelgroep, bereikPerMotivatie, bezoekers,
  datumKort, euroKort, getal, marge, recette, som,
} from '../lib/calc'
import { useMatches, useSelectie } from '../lib/hooks'
import { vindKannibalisatie } from '../lib/inzichten'
import { useSeizoen, useStore } from '../store/useStore'

function maandDagen(jaar: number, maand: number) {
  const eerste = new Date(jaar, maand, 1)
  const start = new Date(eerste)
  start.setDate(1 - ((eerste.getDay() + 6) % 7))
  const dagen = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
  return dagen[35].getMonth() === maand ? dagen : dagen.slice(0, 35)
}

function Delta({ label, voor, na, opmaak }: { label: string; voor: number; na: number; opmaak: (x: number) => string }) {
  const d = na - voor
  return (
    <div className="rounded-2xl bg-oppervlak/80 p-4 ring-1 ring-oppervlak">
      <div className="text-xs font-semibold text-ink-2">{label}</div>
      <div className="font-display mt-1 text-2xl font-extrabold">{opmaak(na)}</div>
      <div className={cx('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold', d > 0 ? 'bg-emerald-100 text-emerald-800' : d < 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600')}>
        {d > 0 ? '+' : d < 0 ? '−' : '±'}{opmaak(Math.abs(d))}
      </div>
    </div>
  )
}

export default function Scenario() {
  const aanbod = useStore((s) => s.dataset.aanbod)
  const doelen = useStore((s) => s.dataset.doelen)
  const scenario = useStore((s) => s.scenario)
  const voegToe = useStore((s) => s.voegScenarioToe)
  const verwijder = useStore((s) => s.verwijderScenario)
  const wis = useStore((s) => s.wisScenario)
  const bevestig = useStore((s) => s.bevestigScenario)
  const toonAanbod = useSelectie((s) => s.toonAanbod)
  const toonVoorstelling = useSelectie((s) => s.toonVoorstelling)
  const matches = useMatches()
  const voor = useSeizoen(PLAN_SEIZOEN, false)
  const na = useSeizoen(PLAN_SEIZOEN, true)
  const [maandIndex, setMaandIndex] = useState(0)
  const [sleep, setSleep] = useState<string | null>(null)
  const [bron, setBron] = useState<'shortlist' | 'top'>('shortlist')
  const [melding, setMelding] = useState<string | null>(null)
  const [feest, setFeest] = useState(0)

  const jaar = seizoenStartJaar(PLAN_SEIZOEN)
  const maand = SEIZOENSMAANDEN[maandIndex]
  const maandJaar = maand >= 8 ? jaar : jaar + 1
  const gesleept = aanbod.find((a) => a.id === sleep)

  const kandidaten = useMemo(() => {
    const ingepland = new Set(scenario.map((s) => s.aanbodId))
    const basis = aanbod.filter((a) => a.status !== 'Afgewezen' && a.status !== 'Ingepland')
    const l = bron === 'shortlist' ? basis.filter((a) => a.status === 'Shortlist' || ingepland.has(a.id)) : basis
    return [...l].sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0)).slice(0, 40)
  }, [aanbod, scenario, bron, matches])

  const bezet = useMemo(() => new Set(na.filter(actief).map((v) => `${v.datum}|${v.zaal}`)), [na])
  const perDag = useMemo(() => {
    const m = new Map<string, typeof na>()
    for (const v of na) m.set(v.datum, [...(m.get(v.datum) ?? []), v])
    return m
  }, [na])

  const dgVoor = aandelen(bereikPerDoelgroep(voor))
  const dgNa = aandelen(bereikPerDoelgroep(na))
  const motVoor = aandelen(bereikPerMotivatie(voor))
  const motNa = aandelen(bereikPerMotivatie(na))
  const conflicten = useMemo(() => vindKannibalisatie(na), [na])
  const scenarioConflicten = conflicten.filter((c) => c.a.bron === 'scenario' || c.b.bron === 'scenario')

  const drop = (datum: string) => {
    if (!gesleept) return
    const zaal = gesleept.zalen.find((z) => !bezet.has(`${datum}|${z}`))
    if (!gesleept.beschikbareData.includes(datum)) {
      setMelding(`${gesleept.titel} is niet beschikbaar op ${datumKort(datum)}. Kies een groen gemarkeerde datum.`)
    } else if (!zaal) {
      setMelding(`De zaal is op ${datumKort(datum)} al bezet.`)
    } else {
      voegToe({ aanbodId: gesleept.id, datum, zaal })
      setMelding(null)
    }
    setSleep(null)
  }

  const dgData = DOELGROEPEN.map((d) => ({ naam: d.kort, voluit: d.naam, Huidig: dgVoor[d.naam] ?? 0, 'Met scenario': dgNa[d.naam] ?? 0, doel: doelen.doelgroepen[d.naam] ?? 0 }))
  const motData = MOTIVATIES.map((m) => ({ naam: m.kort, voluit: m.naam, Huidig: motVoor[m.naam] ?? 0, 'Met scenario': motNa[m.naam] ?? 0, doel: doelen.motivaties[m.naam] ?? 0 }))

  return (
    <div>
      <Paginakop titel="Seizoensbouwer 27/28" icoon={Flask} kleur="#8b5cf6" sub="Een zandbak voor het volgende seizoen. Sleep aanbod naar een datum en zie direct wat het doet met doelgroepen, motivaties, bezoekers en saldo. Pas bij bevestigen wordt het een optie in de kalender.">
        <div className="flex flex-wrap gap-2">
          <button className="knop knop-zacht" disabled={!scenario.length} onClick={wis}><Trash size={16} /> Wis scenario</button>
          <button
            data-uitleg="bevestig"
            className={cx('knop knop-primair disabled:opacity-40', scenario.length > 0 && 'puls-violet')}
            disabled={!scenario.length}
            onClick={() => { const n = bevestig(); setFeest(Date.now()); setMelding(`${n} voorstelling(en) als optie in de kalender gezet.`) }}
          >
            <CheckCircle size={16} /> Bevestig als opties ({scenario.length})
          </button>
        </div>
      </Paginakop>
      <Confetti sleutel={feest} />

      {melding && (
        <div className="verschijn mb-4 flex items-center justify-between gap-3 rounded-2xl bg-citroen px-4 py-3 text-sm font-medium">
          {melding}
          <button onClick={() => setMelding(null)} aria-label="Sluiten"><X size={16} /></button>
        </div>
      )}

      <div data-uitleg="impact" className="verschijn rounded-3xl bg-gradient-to-br from-lavendel via-ijs to-munt p-5 shadow-[var(--shadow-zacht)]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Impact van je scenario</h2>
          <span className="text-sm text-ink-2">{scenario.length} voorstelling(en) in de zandbak</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Delta label="Voorstellingen" voor={voor.filter(actief).length} na={na.filter(actief).length} opmaak={getal} />
          <Delta label="Verwachte bezoekers" voor={som(voor, (v) => bezoekers(v))} na={som(na, (v) => bezoekers(v))} opmaak={getal} />
          <Delta label="Recette" voor={som(voor, (v) => recette(v))} na={som(na, (v) => recette(v))} opmaak={euroKort} />
          <Delta label="Saldo na uitkoop" voor={som(voor, (v) => marge(v))} na={som(na, (v) => marge(v))} opmaak={euroKort} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[380px_1fr]">
        <Kaart i={1} uitleg="kandidaten" titel="Kandidaten" sub="Sleep een kaart naar de kalender" actie={<Tabs waarde={bron} onChange={setBron} opties={[{ id: 'shortlist', label: <><Star size={16} /> Shortlist</> }, { id: 'top', label: <><Target size={16} /> Topmatches</> }]} />}>
          {!kandidaten.length && <Leeg>Nog niets op de shortlist. Kies Topmatches of zet aanbod op de shortlist.</Leeg>}
          <div className="dun-scroll -mr-2 max-h-[720px] space-y-2 overflow-y-auto pr-2">
            {kandidaten.map((a, i) => {
              const m = matches.get(a.id)
              const gepland = scenario.filter((s) => s.aanbodId === a.id)
              return (
                <div
                  key={a.id}
                  draggable
                  style={staffel(i)}
                  onDragStart={(e) => { setSleep(a.id); e.dataTransfer.effectAllowed = 'copy' }}
                  onDragEnd={() => setSleep(null)}
                  className={cx('verschijn group flex cursor-grab items-center gap-3 rounded-2xl bg-oppervlak p-3 ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing', sleep === a.id && 'opacity-50 ring-2 ring-violet')}
                >
                  <DotsSixVertical size={16} className="shrink-0 text-muted transition group-hover:text-violet" />
                  <ScoreRing score={m?.score ?? 0} grootte={42} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => toonAanbod(a.id)}>
                    <div className="truncate text-sm font-semibold">{a.titel}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
                      {(() => { const f = familieVan(a.genre); return <f.icoon size={13} style={{ color: f.kleur }} /> })()}
                      <span className="flex gap-1">{a.doelgroepen.slice(0, 3).map((d) => <CdmLabel key={d} naam={d} />)}</span>
                    </div>
                  </button>
                  {gepland.length > 0 && <span className="rounded-full bg-violet px-2 py-0.5 text-[11px] font-bold text-white">{gepland.length}x</span>}
                </div>
              )
            })}
          </div>
        </Kaart>

        <Kaart
          i={2}
          uitleg="scenario-kalender"
          titel={<span className="capitalize">{MAANDNAMEN_LANG[maand]} {maandJaar}</span>}
          sub={gesleept ? `Groen = ${gesleept.titel} is beschikbaar` : 'Grijs = al geprogrammeerd, paars = jouw scenario'}
          actie={
            <div className="flex flex-wrap gap-1">
              <button className="knop knop-zacht !px-2.5" disabled={maandIndex === 0} onClick={() => setMaandIndex(maandIndex - 1)} aria-label="Vorige maand"><CaretLeft size={18} /></button>
              <div className="dun-scroll hidden max-w-sm gap-1 overflow-x-auto lg:flex">
                {SEIZOENSMAANDEN.map((m, i) => {
                  const telling = scenario.filter((s) => Number(s.datum.slice(5, 7)) - 1 === m).length
                  return (
                    <button key={m} onClick={() => setMaandIndex(i)} className={cx('relative rounded-full px-2.5 py-1 text-xs font-semibold', i === maandIndex ? 'bg-ink text-op-ink' : 'bg-oppervlak text-ink-2 ring-1 ring-line')}>
                      {MAANDNAMEN[m]}
                      {telling > 0 && <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-violet px-1 text-[10px] leading-4 text-white">{telling}</span>}
                    </button>
                  )
                })}
              </div>
              <button className="knop knop-zacht !px-2.5" disabled={maandIndex === SEIZOENSMAANDEN.length - 1} onClick={() => setMaandIndex(maandIndex + 1)} aria-label="Volgende maand"><CaretRight size={18} /></button>
            </div>
          }
        >
          <div className="dun-scroll overflow-x-auto">
            <div className="grid min-w-[700px] grid-cols-7 gap-1.5">
              {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => <div key={d} className="text-center text-xs font-bold uppercase text-muted">{d}</div>)}
              {maandDagen(maandJaar, maand).map((d) => {
                const iso = isoDatum(d)
                const inMaand = d.getMonth() === maand
                const items = perDag.get(iso) ?? []
                const kan = gesleept && gesleept.beschikbareData.includes(iso) && gesleept.zalen.some((z) => !bezet.has(`${iso}|${z}`))
                return (
                  <div
                    key={iso}
                    onDragOver={(e) => { if (gesleept) e.preventDefault() }}
                    onDrop={(e) => { e.preventDefault(); drop(iso) }}
                    className={cx(
                      'flex min-h-[104px] flex-col gap-1 rounded-2xl p-1.5 transition',
                      inMaand ? 'bg-oppervlak ring-1 ring-line' : 'opacity-30',
                      kan && 'puls scale-[1.03] bg-emerald-50 ring-2 ring-emerald-400',
                    )}
                  >
                    <span className="px-1 text-xs font-bold text-ink-2">{d.getDate()}</span>
                    {inMaand && items.map((v) =>
                      v.bron === 'scenario' ? (
                        <div key={v.id} className="plop flex items-center gap-1 rounded-lg bg-violet px-1.5 py-1 text-[11px] font-semibold text-white">
                          <span className="truncate">{v.titel}</span>
                          <button className="ml-auto shrink-0 opacity-70 hover:opacity-100" onClick={() => verwijder(v.id.slice(2, -11), v.datum)} aria-label="Verwijder uit scenario"><X size={12} /></button>
                        </div>
                      ) : (
                        <button key={v.id} onClick={() => toonVoorstelling(v.id)} className="truncate rounded-lg bg-vlak px-1.5 py-1 text-left text-[11px] text-ink-2 hover:bg-spoor" title={`${v.titel} (${v.status})`}>
                          {v.titel}
                        </button>
                      ),
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </Kaart>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Kaart i={3} titel="Doelgroepbalans: huidig versus scenario" sub="Aandeel in het bereik (%). Het zwarte bolletje is het doel.">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={dgData} layout="vertical" margin={{ left: 10, right: 16 }} barGap={2}>
                <CartesianGrid horizontal={false} stroke="var(--color-raster)" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} unit="%" />
                <YAxis type="category" dataKey="naam" tickLine={false} axisLine={false} width={80} tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }} />
                <Tooltip cursor={{ fill: 'var(--color-zacht)' }} content={<TipKaart formatter={(v) => `${v.toFixed(1).replace('.', ',')}%`} titel={(_, p) => String(p?.voluit ?? '')} />} />
                <Bar animationDuration={900} dataKey="Huidig" fill="#c9c3d6" radius={[0, 4, 4, 0]} barSize={9} />
                <Bar animationDuration={900} dataKey="Met scenario" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={9} />
                {dgData.map((d) => <ReferenceDot key={d.naam} x={d.doel} y={d.naam} r={4} fill="var(--color-ink)" stroke="var(--color-oppervlak)" />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Kaart>
        <Kaart i={4} titel="Motivatiemix: huidig versus scenario" sub="Aandeel in het bereik (%). Het zwarte bolletje is het doel.">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={motData} layout="vertical" margin={{ left: 10, right: 16 }} barGap={2}>
                <CartesianGrid horizontal={false} stroke="var(--color-raster)" />
                <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} unit="%" />
                <YAxis type="category" dataKey="naam" tickLine={false} axisLine={false} width={80} tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }} />
                <Tooltip cursor={{ fill: 'var(--color-zacht)' }} content={<TipKaart formatter={(v) => `${v.toFixed(1).replace('.', ',')}%`} titel={(_, p) => String(p?.voluit ?? '')} />} />
                <Bar animationDuration={900} dataKey="Huidig" fill="#c9c3d6" radius={[0, 4, 4, 0]} barSize={9} />
                <Bar animationDuration={900} dataKey="Met scenario" fill="#e87ba4" radius={[0, 4, 4, 0]} barSize={9} />
                {motData.map((d) => <ReferenceDot key={d.naam} x={d.doel} y={d.naam} r={4} fill="var(--color-ink)" stroke="var(--color-oppervlak)" />)}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Kaart>
      </div>

      <Kaart className="mt-6" uitleg="kannibalisatie" titel={<><Lightning size={20} className="wip text-amber-500" /> Kannibalisatie-alarm</>} sub={`${conflicten.length} mogelijke botsingen in seizoen 27/28, waarvan ${scenarioConflicten.length} door je scenario`}>
        {!conflicten.length ? (
          <Leeg>Geen botsingen gevonden. Mooi gespreid!</Leeg>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {[...scenarioConflicten, ...conflicten.filter((c) => !scenarioConflicten.includes(c))].slice(0, 12).map((c) => (
              <div key={`${c.a.id}-${c.b.id}`} className={cx('rounded-2xl p-4', c.ernst === 'hoog' ? 'bg-rose-50 ring-1 ring-rose-200' : 'bg-amber-50 ring-1 ring-amber-200', (c.a.bron === 'scenario' || c.b.bron === 'scenario') && 'outline-2 outline-dashed outline-violet')}>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide">
                  <span className={c.ernst === 'hoog' ? 'text-rose-700' : 'text-amber-700'}>{c.ernst === 'hoog' ? 'Hoog risico' : 'Let op'}</span>
                  <span className="text-ink-2">{c.dagen} dagen</span>
                </div>
                <div className="mt-2 space-y-1 text-sm">
                  {[c.a, c.b].map((v) => (
                    <div key={v.id} className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-ink-2">{datumKort(v.datum)}</span>
                      <span className="truncate font-semibold">{v.titel}</span>
                      {v.bron === 'scenario' && <span className="rounded-full bg-violet px-1.5 text-[10px] font-bold text-white">scenario</span>}
                      <span className="ml-auto"><GenreLabel genre={v.genre} klein /></span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-ink-2">{c.reden}</div>
              </div>
            ))}
          </div>
        )}
      </Kaart>
    </div>
  )
}
