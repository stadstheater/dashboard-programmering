import { ChevronLeft, ChevronRight, Plus, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import FilterBar from '../components/FilterBar'
import { Legenda } from '../components/charts'
import { GenreLabel, Kaart, Lade, Paginakop, ScoreRing, StatusLabel, Tabs, cx } from '../components/ui'
import { isoDatum, naarDatum, seizoenStartJaar } from '../data/generate'
import type { Voorstelling, Zaal } from '../data/types'
import { GENRE_FAMILIES, PLAN_SEIZOEN, STATUSSEN, ZALEN, familieVan } from '../data/vocab'
import {
  DAGNAMEN, MAANDNAMEN, MAANDNAMEN_LANG, SEIZOENSMAANDEN, actief, bezetting, bezoekers, datumKort, datumLang, getal,
  isVerleden, maandVan, procent, vandaag, verkochtTotNu,
} from '../lib/calc'
import { useMatches, useSelectie } from '../lib/hooks'
import { vindWitteVlekken } from '../lib/inzichten'
import { pasFiltersToe, useSeizoen, useStore } from '../store/useStore'

type Weergave = 'maand' | 'week' | 'seizoen' | 'lijst'
type Kleuring = 'genre' | 'status'

const kleurVan = (v: Voorstelling, k: Kleuring) =>
  k === 'genre' ? familieVan(v.genre).kleur : STATUSSEN.find((s) => s.naam === v.status)?.kleur ?? '#888'

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

function Pil({ v, kleuring, onClick }: { v: Voorstelling; kleuring: Kleuring; onClick: () => void }) {
  const kleur = kleurVan(v, kleuring)
  return (
    <button
      onClick={onClick}
      title={`${v.titel} · ${v.zaal} · ${v.status}`}
      className={cx('group flex w-full items-center gap-1.5 truncate rounded-lg px-1.5 py-1 text-left text-[11.5px] font-semibold leading-tight text-ink transition hover:-translate-y-px hover:shadow', v.status === 'Geannuleerd' && 'line-through opacity-50', v.bron === 'scenario' && 'outline-2 outline-dashed outline-violet')}
      style={{ background: kleur + '22' }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: kleur }} />
      <span className="truncate">{v.titel}</span>
      <span className="ml-auto shrink-0 text-[10px] font-medium text-ink-2">{ZALEN.find((z) => z.naam === v.zaal)?.kort}</span>
    </button>
  )
}

export default function Kalender() {
  const seizoen = useStore((s) => s.seizoen)
  const filters = useStore((s) => s.filters)
  const toon = useSelectie((s) => s.toonVoorstelling)
  const lijst = useSeizoen(undefined, true)
  const gefilterd = useMemo(() => pasFiltersToe(lijst, filters), [lijst, filters])
  const [weergave, setWeergave] = useState<Weergave>('maand')
  const [kleuring, setKleuring] = useState<Kleuring>('genre')
  const [vlekken, setVlekken] = useState(true)
  const [vlekDatum, setVlekDatum] = useState<{ datum: string; zaal: Zaal } | null>(null)

  const jaar = seizoenStartJaar(seizoen)
  const nu = naarDatum(vandaag())
  const startIndex = Math.max(0, SEIZOENSMAANDEN.findIndex((m) => m === nu.getMonth() && (m >= 8 ? jaar : jaar + 1) === nu.getFullYear()))
  const [maandIndex, setMaandIndex] = useState(startIndex)
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(Math.max(nu.getTime(), new Date(jaar, 8, 1).getTime()))
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    return isoDatum(d)
  })
  const maand = SEIZOENSMAANDEN[maandIndex]
  const maandJaar = maand >= 8 ? jaar : jaar + 1

  const perDag = useMemo(() => {
    const m = new Map<string, Voorstelling[]>()
    for (const v of gefilterd) m.set(v.datum, [...(m.get(v.datum) ?? []), v])
    return m
  }, [gefilterd])
  const vrij = useMemo(() => new Set(vindWitteVlekken(lijst, seizoen, 'Grote zaal', '0000').map((w) => w.datum)), [lijst, seizoen])

  const kop = (
    <div className="flex flex-wrap items-center gap-2">
      <Tabs<Weergave> waarde={weergave} onChange={setWeergave} opties={[{ id: 'maand', label: 'Maand' }, { id: 'week', label: 'Week' }, { id: 'seizoen', label: 'Seizoen' }, { id: 'lijst', label: 'Lijst' }]} />
      <Tabs<Kleuring> waarde={kleuring} onChange={setKleuring} opties={[{ id: 'genre', label: '🎨 Genre' }, { id: 'status', label: '🚦 Status' }]} />
    </div>
  )

  return (
    <div>
      <Paginakop titel="Kalender" emoji="🗓️" sub={<>Seizoen {seizoen} per maand, week of in één overzicht. Gestippelde vakjes zijn vrije weekendavonden in de Grote zaal: klik erop voor passende suggesties uit het aanbod.</>}>
        {kop}
      </Paginakop>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <FilterBar />
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-2">
          <input type="checkbox" checked={vlekken} onChange={(e) => setVlekken(e.target.checked)} className="h-4 w-4 accent-violet-600" />
          Toon witte vlekken
        </label>
      </div>

      {weergave === 'maand' && (
        <Kaart
          titel={<span className="capitalize">{MAANDNAMEN_LANG[maand]} {maandJaar}</span>}
          sub={`${gefilterd.filter((v) => maandVan(v.datum) === maand).length} voorstellingen`}
          actie={
            <div className="flex gap-1">
              <button className="knop knop-zacht !px-2.5" disabled={maandIndex === 0} onClick={() => setMaandIndex(maandIndex - 1)} aria-label="Vorige maand"><ChevronLeft size={18} /></button>
              <div className="dun-scroll hidden max-w-md gap-1 overflow-x-auto md:flex">
                {SEIZOENSMAANDEN.map((m, i) => (
                  <button key={m} onClick={() => setMaandIndex(i)} className={cx('rounded-full px-2.5 py-1 text-xs font-semibold', i === maandIndex ? 'bg-ink text-white' : 'bg-white text-ink-2 ring-1 ring-line')}>{MAANDNAMEN[m]}</button>
                ))}
              </div>
              <button className="knop knop-zacht !px-2.5" disabled={maandIndex === SEIZOENSMAANDEN.length - 1} onClick={() => setMaandIndex(maandIndex + 1)} aria-label="Volgende maand"><ChevronRight size={18} /></button>
            </div>
          }
        >
          <div className="dun-scroll overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-7 gap-1.5">
              {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => (
                <div key={d} className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-muted">{d}</div>
              ))}
              {maandDagen(maandJaar, maand).map((d) => {
                const iso = isoDatum(d)
                const items = perDag.get(iso) ?? []
                const inMaand = d.getMonth() === maand
                const isVrij = vlekken && inMaand && vrij.has(iso)
                const isVandaag = iso === vandaag()
                return (
                  <div
                    key={iso}
                    className={cx(
                      'flex min-h-[118px] flex-col gap-1 rounded-2xl p-1.5 transition',
                      inMaand ? 'bg-white ring-1 ring-line' : 'bg-transparent opacity-40',
                      isVrij && 'bg-[repeating-linear-gradient(45deg,#fff,#fff_6px,#f7f2ff_6px,#f7f2ff_12px)] outline-2 outline-dashed outline-violet/40',
                      isVandaag && 'ring-2 ring-koraal',
                    )}
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className={cx('text-xs font-bold', isVandaag ? 'rounded-full bg-koraal px-1.5 text-white' : 'text-ink-2')}>{d.getDate()}</span>
                      {isVrij && (
                        <button onClick={() => setVlekDatum({ datum: iso, zaal: 'Grote zaal' })} className="flex items-center gap-0.5 rounded-full bg-violet/10 px-1.5 py-0.5 text-[10px] font-bold text-violet hover:bg-violet hover:text-white" title="Vrije avond in de Grote zaal: bekijk suggesties">
                          <Sparkles size={11} /> vrij
                        </button>
                      )}
                    </div>
                    {inMaand && items.map((v) => <Pil key={v.id} v={v} kleuring={kleuring} onClick={() => toon(v.id)} />)}
                  </div>
                )
              })}
            </div>
          </div>
          <KleurLegenda kleuring={kleuring} />
        </Kaart>
      )}

      {weergave === 'week' && <WeekWeergave weekStart={weekStart} setWeekStart={setWeekStart} perDag={perDag} kleuring={kleuring} onVrij={setVlekDatum} />}

      {weergave === 'seizoen' && (
        <Kaart titel={`Seizoensoverzicht ${seizoen}`} sub="Kleurintensiteit is het aantal bezoekers per dag. Klik op een maand om in te zoomen.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {SEIZOENSMAANDEN.map((m, i) => {
              const j = m >= 8 ? jaar : jaar + 1
              return (
                <button key={m} onClick={() => { setMaandIndex(i); setWeergave('maand') }} className="rounded-2xl bg-[#fffaf5] p-3 text-left ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-2 flex justify-between text-sm font-bold capitalize">
                    {MAANDNAMEN_LANG[m]}
                    <span className="font-medium text-ink-2">{gefilterd.filter((v) => maandVan(v.datum) === m).length}</span>
                  </div>
                  <div className="grid grid-cols-7 gap-[3px]">
                    {maandDagen(j, m).map((d) => {
                      const iso = isoDatum(d)
                      const items = perDag.get(iso) ?? []
                      const b = items.reduce((s, v) => s + bezoekers(v), 0)
                      const inMaand = d.getMonth() === m
                      const t = Math.min(1, b / 1000)
                      return (
                        <div
                          key={iso}
                          title={inMaand ? `${datumKort(iso)}: ${items.length} voorstelling(en), ${getal(b)} bezoekers` : ''}
                          className={cx('aspect-square rounded-[5px]', !inMaand && 'opacity-0', vlekken && inMaand && vrij.has(iso) && 'ring-1 ring-violet/60')}
                          style={{ background: items.length ? `rgba(139, 92, 246, ${0.18 + t * 0.82})` : '#f3ece3' }}
                        />
                      )
                    })}
                  </div>
                </button>
              )
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-2">
            minder <div className="h-2.5 w-32 rounded-full bg-gradient-to-r from-[rgba(139,92,246,.18)] to-[rgba(139,92,246,1)]" /> meer bezoekers
            {vlekken && <span className="ml-4 flex items-center gap-1"><span className="h-3 w-3 rounded-[4px] ring-1 ring-violet/60" /> vrije weekendavond Grote zaal</span>}
          </div>
        </Kaart>
      )}

      {weergave === 'lijst' && <LijstWeergave lijst={gefilterd} onKies={toon} />}

      <SuggestieLade vlek={vlekDatum} onSluit={() => setVlekDatum(null)} seizoen={seizoen} />
    </div>
  )
}

function KleurLegenda({ kleuring }: { kleuring: Kleuring }) {
  return (
    <Legenda
      className="mt-4"
      items={kleuring === 'genre' ? GENRE_FAMILIES.map((f) => ({ naam: f.naam, kleur: f.kleur, emoji: f.emoji })) : STATUSSEN.map((s) => ({ naam: s.naam, kleur: s.kleur }))}
    />
  )
}

function WeekWeergave({ weekStart, setWeekStart, perDag, kleuring, onVrij }: {
  weekStart: string
  setWeekStart: (s: string) => void
  perDag: Map<string, Voorstelling[]>
  kleuring: Kleuring
  onVrij: (v: { datum: string; zaal: Zaal }) => void
}) {
  const toon = useSelectie((s) => s.toonVoorstelling)
  const dagen = Array.from({ length: 7 }, (_, i) => {
    const d = naarDatum(weekStart)
    d.setDate(d.getDate() + i)
    return isoDatum(d)
  })
  const verschuif = (n: number) => {
    const d = naarDatum(weekStart)
    d.setDate(d.getDate() + n * 7)
    setWeekStart(isoDatum(d))
  }
  return (
    <Kaart
      titel={`Week van ${datumKort(dagen[0])} tot ${datumKort(dagen[6])}`}
      sub="Per zaal een eigen baan"
      actie={
        <div className="flex gap-1">
          <button className="knop knop-zacht !px-2.5" onClick={() => verschuif(-1)} aria-label="Vorige week"><ChevronLeft size={18} /></button>
          <button className="knop knop-zacht !px-2.5" onClick={() => verschuif(1)} aria-label="Volgende week"><ChevronRight size={18} /></button>
        </div>
      }
    >
      <div className="dun-scroll overflow-x-auto">
        <div className="grid min-w-[860px] grid-cols-[120px_repeat(7,1fr)] gap-2">
          <div />
          {dagen.map((d) => (
            <div key={d} className={cx('rounded-xl py-1.5 text-center text-sm font-bold', d === vandaag() ? 'bg-koraal text-white' : 'text-ink-2')}>
              {DAGNAMEN[naarDatum(d).getDay()]} {naarDatum(d).getDate()} {MAANDNAMEN[naarDatum(d).getMonth()]}
            </div>
          ))}
          {ZALEN.map((z) => (
            <div key={z.naam} className="contents">
              <div className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-lavendel to-ijs px-3 py-2">
                <div className="font-display font-bold">{z.naam}</div>
                <div className="text-xs text-ink-2">{z.capaciteit} stoelen</div>
              </div>
              {dagen.map((d) => {
                const items = (perDag.get(d) ?? []).filter((v) => v.zaal === z.naam)
                return (
                  <div key={d} className="min-h-28 space-y-1.5 rounded-2xl bg-white p-1.5 ring-1 ring-line">
                    {items.map((v) => {
                      const kleur = kleurVan(v, kleuring)
                      const verkocht = verkochtTotNu(v)
                      return (
                        <button key={v.id} onClick={() => toon(v.id)} className="w-full rounded-xl p-2 text-left text-xs transition hover:-translate-y-0.5 hover:shadow-md" style={{ background: kleur + '22', borderLeft: `4px solid ${kleur}` }}>
                          <div className="font-bold text-ink">{v.tijd}</div>
                          <div className="line-clamp-2 font-semibold text-ink">{v.titel}</div>
                          <div className="mt-1 text-[11px] text-ink-2">{isVerleden(v) ? `${procent(bezetting(v))} bezet` : `${getal(verkocht)} verkocht`}</div>
                        </button>
                      )
                    })}
                    {!items.length && z.naam !== 'Theatercafé' && [5, 6].includes(naarDatum(d).getDay()) && (
                      <button onClick={() => onVrij({ datum: d, zaal: z.naam })} className="grid h-full min-h-24 w-full place-items-center rounded-xl border-2 border-dashed border-violet/30 text-xs font-semibold text-violet hover:bg-violet/5">
                        <span className="flex items-center gap-1"><Plus size={13} /> suggesties</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <KleurLegenda kleuring={kleuring} />
    </Kaart>
  )
}

type SorteerSleutel = 'datum' | 'titel' | 'genre' | 'zaal' | 'status' | 'verwacht' | 'verkocht' | 'bezetting'

function LijstWeergave({ lijst, onKies }: { lijst: Voorstelling[]; onKies: (id: string) => void }) {
  const [sorteer, setSorteer] = useState<SorteerSleutel>('datum')
  const [op, setOp] = useState(true)
  const waarde = (v: Voorstelling): string | number =>
    sorteer === 'verkocht' ? verkochtTotNu(v) : sorteer === 'bezetting' ? bezetting(v) : (v[sorteer as keyof Voorstelling] as string | number)
  const gesorteerd = [...lijst].sort((a, b) => {
    const x = waarde(a)
    const y = waarde(b)
    const r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
    return op ? r : -r
  })
  const Kop = ({ s, children, rechts }: { s: SorteerSleutel; children: string; rechts?: boolean }) => (
    <th className={cx('cursor-pointer select-none px-3 py-2 font-semibold text-ink-2 hover:text-ink', rechts && 'text-right')} onClick={() => (s === sorteer ? setOp(!op) : (setSorteer(s), setOp(true)))}>
      {children} {sorteer === s ? (op ? '↑' : '↓') : ''}
    </th>
  )
  return (
    <Kaart titel={`${lijst.length} voorstellingen`} sub="Klik op een kolom om te sorteren">
      <div className="dun-scroll overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide">
            <tr className="border-b border-line">
              <Kop s="datum">Datum</Kop><Kop s="titel">Titel</Kop><Kop s="genre">Genre</Kop><Kop s="zaal">Zaal</Kop><Kop s="status">Status</Kop>
              <Kop s="verwacht" rechts>Verwacht</Kop><Kop s="verkocht" rechts>Verkocht</Kop><Kop s="bezetting" rechts>Bezetting</Kop>
            </tr>
          </thead>
          <tbody>
            {gesorteerd.map((v) => (
              <tr key={v.id} onClick={() => onKies(v.id)} className="cursor-pointer border-b border-line/60 transition hover:bg-[#fff6ee]">
                <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{datumKort(v.datum)}</td>
                <td className="px-3 py-2.5 font-semibold">{v.titel}{v.bron === 'scenario' && <span className="ml-2 rounded-full bg-violet/10 px-2 py-0.5 text-[10px] font-bold text-violet">scenario</span>}</td>
                <td className="px-3 py-2.5"><GenreLabel genre={v.genre} klein /></td>
                <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{v.zaal}</td>
                <td className="px-3 py-2.5"><StatusLabel status={v.status} klein /></td>
                <td className="px-3 py-2.5 text-right tabular-nums">{getal(v.verwacht)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{actief(v) ? getal(verkochtTotNu(v)) : '·'}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="ml-auto flex w-28 items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-[#f6efe6]"><div className="h-full rounded-full bg-mint" style={{ width: `${Math.min(100, bezetting(v) * 100)}%` }} /></div>
                    <span className="w-9 tabular-nums text-ink-2">{procent(bezetting(v))}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Kaart>
  )
}

function SuggestieLade({ vlek, onSluit, seizoen }: { vlek: { datum: string; zaal: Zaal } | null; onSluit: () => void; seizoen: string }) {
  const aanbod = useStore((s) => s.dataset.aanbod)
  const voegToe = useStore((s) => s.voegScenarioToe)
  const toonAanbod = useSelectie((s) => s.toonAanbod)
  const matches = useMatches()
  if (!vlek) return null
  const exact = aanbod.filter((a) => a.status !== 'Afgewezen' && a.zalen.includes(vlek.zaal) && a.beschikbareData.includes(vlek.datum))
  const inPeriode = aanbod.filter((a) => a.status !== 'Afgewezen' && a.zalen.includes(vlek.zaal) && !exact.includes(a) && a.periodeStart <= vlek.datum && a.periodeEind >= vlek.datum)
  const sorteer = (l: typeof aanbod) => [...l].sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0)).slice(0, 6)
  return (
    <Lade open onSluit={onSluit} titel={`Vrij: ${datumLang(vlek.datum)}`}>
      <p className="text-ink-2">De {vlek.zaal} is nog vrij. Dit aanbod past op deze datum, gesorteerd op matchscore.</p>
      {seizoen !== PLAN_SEIZOEN && <p className="mt-3 rounded-2xl bg-citroen p-3 text-sm">Het aanbod van impresariaten is voor seizoen {PLAN_SEIZOEN}. Kies dat seizoen bovenaan voor de beste suggesties.</p>}
      {[{ titel: 'Beschikbaar op precies deze datum', items: sorteer(exact), direct: true }, { titel: 'Tourt in deze periode (datum navragen)', items: sorteer(inPeriode), direct: false }].map((groep) => (
        <div key={groep.titel} className="mt-5">
          <h3 className="mb-2 font-bold">{groep.titel}</h3>
          {!groep.items.length && <p className="text-sm text-muted">Geen aanbod gevonden.</p>}
          <div className="space-y-2">
            {groep.items.map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line">
                <ScoreRing score={matches.get(a.id)?.score ?? 0} grootte={46} />
                <button className="min-w-0 flex-1 text-left" onClick={() => toonAanbod(a.id)}>
                  <div className="truncate font-semibold hover:underline">{a.titel}</div>
                  <div className="text-xs text-ink-2">{a.genre} · {a.impresariaat}</div>
                </button>
                {groep.direct && (
                  <button className="knop knop-primair !px-3 !py-1.5" onClick={() => { voegToe({ aanbodId: a.id, datum: vlek.datum, zaal: vlek.zaal }); onSluit() }}>
                    <Plus size={14} /> Plan
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Lade>
  )
}
