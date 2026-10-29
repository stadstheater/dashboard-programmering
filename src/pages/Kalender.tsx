import { CalendarDots, CaretLeft, CaretRight, Check, Funnel, Lightbulb, Palette, PencilSimple, Plus, Sparkle, UsersThree } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import DoelTabel from '../components/DoelTabel'
import FilterBar from '../components/FilterBar'
import { CdmLabel, Kaart, Lade, Paginakop, PastBijOns, Tabs, cx } from '../components/ui'
import { isoDatum, naarDatum, seizoenStartJaar, seizoenVanDatum } from '../data/generate'
import type { Voorstelling, Zaal } from '../data/types'
import { DOELGROEPEN, GEMIDDELDE_PRIJS, GENRES, GENRE_FAMILIES, MOTIVATIES, ZALEN, capaciteitVan, familieVan, segmentVan } from '../data/vocab'
import { staffel } from '../lib/animatie'
import {
  MAANDNAMEN_LANG, SEIZOENSMAANDEN, aandelen, actief, bereikPerDoelgroep, bereikPerFamilie, bereikPerMotivatie, datumKort, datumLang, maandVan, vandaag,
} from '../lib/calc'
import { useMatches, useSelectie } from '../lib/hooks'
import { vindWitteVlekken } from '../lib/inzichten'
import { pasFiltersToe, useSeizoen, useStore } from '../store/useStore'

type Kleuring = 'genre' | 'doelgroep' | 'motivatie'

const kleurVan = (v: Voorstelling, k: Kleuring) =>
  k === 'genre' ? familieVan(v.genre).kleur
    : k === 'doelgroep' ? segmentVan(DOELGROEPEN, v.doelgroepen[0] ?? '')?.kleur ?? '#c9c3d6'
      : segmentVan(MOTIVATIES, v.motivaties[0] ?? '')?.kleur ?? '#c9c3d6'

/** Klein teken vooraan in een kalenderblok: genre-icoon, CDM-afkorting, motivatie-icoon of statusbolletje. */
function Merk({ v, kleuring, kleur }: { v: Voorstelling; kleuring: Kleuring; kleur: string }) {
  if (kleuring === 'doelgroep') return v.doelgroepen[0] ? <CdmLabel naam={v.doelgroepen[0]} /> : null
  const I = kleuring === 'genre' ? familieVan(v.genre).icoon : segmentVan(MOTIVATIES, v.motivaties[0] ?? '')?.icoon
  return I ? <I size={12} className="shrink-0 transition group-hover:scale-125" style={{ color: kleur }} /> : <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: kleur }} />
}

const KLEURING_OPTIES: { id: Kleuring; label: React.ReactNode }[] = [
  { id: 'motivatie', label: <><Lightbulb size={16} /> Motivatie</> },
  { id: 'doelgroep', label: <><UsersThree size={16} /> Doelgroep</> },
  { id: 'genre', label: <><Palette size={16} /> Genre</> },
]

/** De gekozen kleuring wordt in deze browser onthouden. */
const KLEURING_SLEUTEL = 'coulisse-kalender-kleuring'
function bewaardeKleuring(): Kleuring {
  try {
    const k = localStorage.getItem(KLEURING_SLEUTEL)
    return KLEURING_OPTIES.some((o) => o.id === k) ? (k as Kleuring) : 'motivatie'
  } catch {
    return 'motivatie'
  }
}
function bewaarKleuring(k: Kleuring) {
  try {
    localStorage.setItem(KLEURING_SLEUTEL, k)
  } catch {
    /* zonder opslag geldt de keuze alleen voor dit bezoek */
  }
}

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
      className={cx('group flex w-full items-center gap-1.5 truncate rounded-lg px-1.5 py-1.5 text-left text-[13px] font-semibold leading-tight text-ink transition hover:-translate-y-px hover:shadow', v.status === 'Geannuleerd' && 'line-through opacity-50', (v.status === 'Optie' || v.status === 'Concept') && 'outline-1 outline-dashed outline-ink/30')}
      style={{ background: kleur + '22' }}
    >
      <Merk v={v} kleuring={kleuring} kleur={kleur} />
      <span className="truncate">{v.titel}</span>
      <span className="ml-auto shrink-0 text-[10px] font-medium text-ink-2">{ZALEN.find((z) => z.naam === v.zaal)?.kort}</span>
    </button>
  )
}

export default function Kalender() {
  const seizoen = useStore((s) => s.seizoen)
  const filters = useStore((s) => s.filters)
  const doelen = useStore((st) => st.dataset.doelen)
  const toon = useSelectie((s) => s.toonVoorstelling)
  const lijst = useSeizoen()
  const gefilterd = useMemo(() => pasFiltersToe(lijst, filters), [lijst, filters])
  const [kleuring, zetKleuring] = useState<Kleuring>(bewaardeKleuring)
  const setKleuring = (k: Kleuring) => {
    zetKleuring(k)
    bewaarKleuring(k)
  }
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [vlekDatum, setVlekDatum] = useState<{ datum: string; zaal: Zaal } | null>(null)

  const jaar = seizoenStartJaar(seizoen)
  const nu = naarDatum(vandaag())
  const startIndex = Math.max(0, SEIZOENSMAANDEN.findIndex((m) => m === nu.getMonth() && (m >= 8 ? jaar : jaar + 1) === nu.getFullYear()))
  const [maandIndex, setMaandIndex] = useState(startIndex)
  const maand = SEIZOENSMAANDEN[maandIndex]
  const maandJaar = maand >= 8 ? jaar : jaar + 1
  const verhouding = useMemo(
    () => ({ genre: aandelen(bereikPerFamilie(lijst)), doelgroep: aandelen(bereikPerDoelgroep(lijst)), motivatie: aandelen(bereikPerMotivatie(lijst)) }),
    [lijst],
  )
  const perDag = useMemo(() => {
    const m = new Map<string, Voorstelling[]>()
    for (const v of gefilterd) m.set(v.datum, [...(m.get(v.datum) ?? []), v])
    return m
  }, [gefilterd])
  const vrij = useMemo(() => new Set(vindWitteVlekken(lijst, seizoen, 'Grote zaal', vandaag()).map((w) => w.datum)), [lijst, seizoen])
  const peil = vandaag()

  return (
    <div>
      <Paginakop
        titel="Kalender"
        icoon={CalendarDots}
        kleur="#2a78d6"
        sub={<>Seizoen {seizoen} per maand. Gestreepte vakjes zijn vrije vrijdag- en zaterdagavonden in de Grote zaal.</>}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Tabs<Kleuring> uitleg="kleuring" waarde={kleuring} onChange={setKleuring} opties={KLEURING_OPTIES} />
          <button data-uitleg="filter-knop" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} className={cx('knop !px-4 !py-2.5 text-[15px]', filtersOpen ? 'knop-primair' : 'knop-zacht')}>
            <Funnel size={18} /> Filteren
          </button>
        </div>
      </Paginakop>
      {filtersOpen && (
        <div className="verschijn mb-4">
          <FilterBar verberg={['statussen', 'motivaties']} />
        </div>
      )}

      <Kaart
        uitleg="kalender-raster"
        titel={<span className="capitalize">{MAANDNAMEN_LANG[maand]} {maandJaar}</span>}
        sub={`${gefilterd.filter((v) => maandVan(v.datum) === maand).length} voorstellingen`}
        actie={
          <div className="flex gap-1">
            <button className="knop knop-zacht !px-2.5" disabled={maandIndex === 0} onClick={() => setMaandIndex(maandIndex - 1)} aria-label="Vorige maand"><CaretLeft size={18} /><span className="hidden sm:inline">Vorige</span></button>
            <button className="knop knop-zacht !px-2.5" disabled={maandIndex === SEIZOENSMAANDEN.length - 1} onClick={() => setMaandIndex(maandIndex + 1)} aria-label="Volgende maand"><span className="hidden sm:inline">Volgende</span><CaretRight size={18} /></button>
          </div>
        }
      >
        <div className="dun-scroll overflow-x-auto">
          <div key={`${seizoen}-${maandIndex}`} className="grid min-w-[760px] grid-cols-7 gap-1.5">
            {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map((d) => (
              <div key={d} className="pb-1 text-center text-xs font-bold uppercase tracking-wide text-muted">{d}</div>
            ))}
            {maandDagen(maandJaar, maand).map((d, celIndex) => {
              const iso = isoDatum(d)
              const items = perDag.get(iso) ?? []
              const inMaand = d.getMonth() === maand
              const isVrij = inMaand && vrij.has(iso)
              const isVandaag = iso === peil
              const planbaar = inMaand && iso >= peil
              return (
                <div
                  key={iso}
                  style={staffel(celIndex % 7 + Math.floor(celIndex / 7))}
                  className={cx(
                    'plop group/dag flex min-h-[132px] flex-col gap-1 rounded-2xl p-1.5 transition',
                    planbaar && 'hover:ring-2 hover:ring-violet/50',
                    inMaand ? 'bg-oppervlak ring-1 ring-line' : 'bg-transparent opacity-40',
                    isVrij && 'bg-[repeating-linear-gradient(45deg,var(--color-oppervlak),var(--color-oppervlak)_6px,var(--color-lavendel)_6px,var(--color-lavendel)_12px)]',
                    isVandaag && 'ring-2 ring-koraal',
                  )}
                >
                  <div className="flex items-center justify-between gap-1 px-1">
                    <span className={cx('text-xs font-bold', isVandaag ? 'rounded-full bg-[#c93a24] px-1.5 text-white' : 'text-ink-2')}>{d.getDate()}</span>
                    {planbaar && !isVrij && (
                      <button
                        onClick={() => setVlekDatum({ datum: iso, zaal: 'Grote zaal' })}
                        className="grid h-6 w-6 place-items-center rounded-full bg-violet text-white opacity-0 shadow-md transition hover:scale-110 focus:opacity-100 group-hover/dag:opacity-100 [@media(hover:none)]:opacity-60"
                        title="Voorstelling inplannen in de Grote of Kleine zaal"
                        aria-label={`Voorstelling inplannen op ${datumKort(iso)}`}
                        data-uitleg="plus-knop"
                      >
                        <Plus size={14} weight="bold" />
                      </button>
                    )}
                    {isVrij && (
                      <button data-uitleg="witte-vlek" onClick={() => setVlekDatum({ datum: iso, zaal: 'Grote zaal' })} className="flex items-center gap-0.5 rounded-full bg-violet/10 px-1.5 py-0.5 text-[10px] font-bold text-violet-700 transition hover:bg-violet hover:text-white" title="Vrije avond in de Grote zaal: bekijk suggesties">
                        <Sparkle size={11} /> Iets inplannen?
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

      <div className="mt-8 mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-display text-xl font-extrabold">Doel en realisatie</h2>
        <span className="text-sm text-ink-2">Hoe seizoen {seizoen} zich verhoudt tot onze doelen</span>
      </div>
      <div data-uitleg="doel-tabellen" className="grid gap-5 lg:grid-cols-3">
        <DoelTabel
          titel="Motivatie"
          icoon={Lightbulb}
          kleur="#db2777"
          actief={kleuring === 'motivatie'}
          rijen={MOTIVATIES.map((m) => ({ naam: m.naam, kleur: m.kleur, doel: doelen.motivaties[m.naam] ?? 0, realisatie: verhouding.motivatie[m.naam] ?? 0, label: <><m.icoon size={15} style={{ color: m.kleur }} className="shrink-0" /><span className="truncate">{m.naam}</span></> }))}
        />
        <DoelTabel
          titel="Culturele doelgroep"
          icoon={UsersThree}
          kleur="#0f9f84"
          actief={kleuring === 'doelgroep'}
          rijen={DOELGROEPEN.map((d) => ({ naam: d.naam, kleur: d.kleur, doel: doelen.doelgroepen[d.naam] ?? 0, realisatie: verhouding.doelgroep[d.naam] ?? 0, label: <><CdmLabel segment={d} /><span className="truncate">{d.naam}</span></> }))}
        />
        <DoelTabel
          titel="Genre"
          icoon={Palette}
          kleur="#2a78d6"
          actief={kleuring === 'genre'}
          rijen={GENRE_FAMILIES.map((f) => ({ naam: f.naam, kleur: f.kleur, doel: doelen.genres[f.naam] ?? 0, realisatie: verhouding.genre[f.naam] ?? 0, label: <><f.icoon size={15} style={{ color: f.kleur }} className="shrink-0" /><span className="truncate">{f.naam}</span></> }))}
        />
      </div>

      <PlanLade key={vlekDatum ? `${vlekDatum.datum}-${vlekDatum.zaal}` : 'leeg'} vlek={vlekDatum} onSluit={() => setVlekDatum(null)} />
    </div>
  )
}

function KleurLegenda({ kleuring }: { kleuring: Kleuring }) {
  if (kleuring === 'doelgroep') {
    return (
      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-ink-2">
        {DOELGROEPEN.map((d) => (
          <span key={d.naam} className="flex items-center gap-1.5"><CdmLabel segment={d} /> {d.naam}</span>
        ))}
      </div>
    )
  }
  const items = kleuring === 'genre' ? GENRE_FAMILIES : MOTIVATIES
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-2">
      {items.map((i) => (
        <span key={i.naam} className="flex items-center gap-1.5"><i.icoon weight="fill" size={14} style={{ color: i.kleur }} /> {i.naam}</span>
      ))}
      <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded outline-1 outline-dashed outline-ink/30" /> optie, nog niet bevestigd</span>
    </div>
  )
}

function PlanLade({ vlek, onSluit }: { vlek: { datum: string; zaal: Zaal } | null; onSluit: () => void }) {
  const aanbod = useStore((s) => s.dataset.aanbod)
  const voorstellingen = useStore((s) => s.dataset.voorstellingen)
  const zetOptie = useStore((s) => s.zetOptie)
  const upsert = useStore((s) => s.upsertVoorstelling)
  const toonAanbod = useSelectie((s) => s.toonAanbod)
  const matches = useMatches()
  const [zaal, setZaal] = useState<Zaal>(vlek?.zaal ?? 'Grote zaal')
  const [eigen, setEigen] = useState({ titel: '', genre: 'Cabaret', tijd: '20:15', doelgroep: '', motivatie: '' })
  const [gepland, setGepland] = useState<string | null>(null)
  if (!vlek) return null
  const datum = vlek.datum
  const bezet = voorstellingen.filter((v) => v.datum === datum && v.zaal === zaal && actief(v))
  const exact = aanbod.filter((a) => a.status !== 'Afgewezen' && a.status !== 'Ingepland' && a.zalen.includes(zaal) && a.beschikbareData.includes(datum))
  const inPeriode = aanbod.filter((a) => a.status !== 'Afgewezen' && a.status !== 'Ingepland' && a.zalen.includes(zaal) && !exact.includes(a) && a.periodeStart <= datum && a.periodeEind >= datum)
  const sorteer = (l: typeof aanbod) => [...l].sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0)).slice(0, 6)
  const klaar = (titel: string) => {
    setGepland(titel)
    setTimeout(onSluit, 1100)
  }
  const voegEigenToe = () => {
    if (!eigen.titel.trim()) return
    const capaciteit = capaciteitVan(zaal)
    const verwacht = Math.round((capaciteit * 0.72) / 10) * 10
    const prijs = GEMIDDELDE_PRIJS[eigen.genre] ?? 30
    upsert({
      id: `e-${Date.now().toString(36)}`,
      seizoen: seizoenVanDatum(datum),
      status: 'Optie',
      datum,
      tijd: eigen.tijd,
      titel: eigen.titel.trim(),
      artiest: eigen.titel.trim(),
      impresariaat: 'Eigen programmering',
      genre: eigen.genre,
      leeftijd: null,
      zaal,
      capaciteit,
      verwacht,
      eindstand: verwacht,
      prijs,
      uitkoopsom: Math.round((verwacht * prijs * 0.55) / 50) * 50,
      motivaties: eigen.motivatie ? [eigen.motivatie] : [],
      doelgroepen: eigen.doelgroep ? [eigen.doelgroep] : [],
      bron: 'builder',
    })
    klaar(eigen.titel.trim())
  }
  return (
    <Lade open onSluit={onSluit} titel={`Inplannen op ${datumLang(datum)}`}>
      {gepland ? (
        <div className="plop grid place-items-center gap-3 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check size={34} weight="bold" className="spring" /></span>
          <div className="font-display text-xl font-bold">{gepland}</div>
          <p className="text-ink-2">staat als optie in de {zaal}.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink-2">Zaal</span>
            <Tabs<Zaal>
              waarde={zaal}
              onChange={setZaal}
              opties={(['Grote zaal', 'Kleine zaal'] as Zaal[]).map((z) => {
                const vol = voorstellingen.some((v) => v.datum === datum && v.zaal === z && actief(v))
                return { id: z, label: <>{z === 'Grote zaal' ? 'GZ' : 'KZ'} <span className="font-normal opacity-80">{z}</span>{vol && <span className="ml-1 rounded-full bg-amber-50 px-1.5 text-[10px] font-bold text-amber-800">bezet</span>}</> }
              })}
            />
          </div>
          {bezet.length > 0 ? (
            <p className="mt-3 rounded-2xl bg-citroen p-3 text-sm">
              Let op: de {zaal} is deze dag al in gebruik door <b>{bezet.map((v) => `${v.titel} (${v.tijd})`).join(', ')}</b>. Je kunt er toch iets bij plannen, bijvoorbeeld een middagvoorstelling.
            </p>
          ) : (
            <p className="mt-3 text-ink-2">De {zaal} is nog vrij. Kies een voorstelling uit het aanbod of vul er zelf een in.</p>
          )}

          {[{ titel: 'Uit het aanbod, op precies deze datum', items: sorteer(exact), direct: true }, { titel: 'Tourt in deze periode (datum navragen)', items: sorteer(inPeriode), direct: false }].map((groep) => (
            <div key={groep.titel} className="mt-5">
              <h3 className="mb-2 font-bold">{groep.titel}</h3>
              {!groep.items.length && <p className="text-sm text-muted">Geen aanbod gevonden voor de {zaal}.</p>}
              <div className="space-y-2">
                {groep.items.map((a, i) => (
                  <div key={a.id} className="verschijn flex items-center gap-3 rounded-2xl bg-oppervlak p-3 ring-1 ring-line" style={staffel(i)}>
                    <button className="min-w-0 flex-1 text-left" onClick={() => toonAanbod(a.id)}>
                      <div className="truncate font-semibold hover:underline">{a.titel}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-2"><PastBijOns score={matches.get(a.id)?.score ?? 0} klein /> {a.genre}</div>
                    </button>
                    {groep.direct && (
                      <button className="knop knop-primair !px-3 !py-1.5" onClick={() => { zetOptie(a.id, datum, zaal); klaar(a.titel) }}>
                        <Plus size={14} /> Zet als optie
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <form
            className="mt-6 rounded-3xl bg-vlak p-4 ring-1 ring-line"
            onSubmit={(e) => { e.preventDefault(); voegEigenToe() }}
          >
            <h3 className="mb-3 flex items-center gap-2 font-bold"><PencilSimple size={18} className="text-violet" /> Zelf een voorstelling invullen</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-ink-2">Titel</span>
                <input required className="invoer" value={eigen.titel} onChange={(e) => setEigen({ ...eigen, titel: e.target.value })} placeholder="Bijvoorbeeld: Kerstconcert" />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-ink-2">Genre</span>
                <select className="invoer" value={eigen.genre} onChange={(e) => setEigen({ ...eigen, genre: e.target.value, tijd: e.target.value === 'Jeugd & Familie' ? '14:00' : eigen.tijd })}>
                  {GENRES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-ink-2">Aanvang</span>
                <input type="time" className="invoer" value={eigen.tijd} onChange={(e) => setEigen({ ...eigen, tijd: e.target.value })} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-ink-2">Belangrijkste doelgroep</span>
                <select className="invoer" value={eigen.doelgroep} onChange={(e) => setEigen({ ...eigen, doelgroep: e.target.value })}>
                  <option value="">Nog niet bekend</option>
                  {DOELGROEPEN.map((d) => <option key={d.naam} value={d.naam}>{d.kort} · {d.naam}</option>)}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-ink-2">Belangrijkste motivatie</span>
                <select className="invoer" value={eigen.motivatie} onChange={(e) => setEigen({ ...eigen, motivatie: e.target.value })}>
                  <option value="">Nog niet bekend</option>
                  {MOTIVATIES.map((m) => <option key={m.naam} value={m.naam}>{m.naam}</option>)}
                </select>
              </label>
            </div>
            <button className="knop knop-primair mt-4"><Plus size={16} /> Zet als optie in de {zaal}</button>
          </form>
        </>
      )}
    </Lade>
  )
}
