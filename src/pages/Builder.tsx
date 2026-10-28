import { ArrowsClockwise, DiceFive, X, DownloadSimple, FileJs, FileXls, Hammer, Lightbulb, MagicWand, PencilSimple, Plus, Target, Ticket, Trash, Tray, UploadSimple, type Icon } from '@phosphor-icons/react'
import { wisAlleUitleg } from '../components/Rondleiding'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CdmLabel, GenreLabel, Kaart, KpiTegel, Paginakop, SegmentChip, StatusLabel, Tabs, Venster, cx } from '../components/ui'
import { STANDAARD_DOELEN, seizoenVanDatum } from '../data/generate'
import type { Aanbod, AanbodStatus, Dataset, Doelen, Status, Voorstelling, Zaal } from '../data/types'
import {
  AANBOD_STATUSSEN, DOELGROEPEN, GEMIDDELDE_PRIJS, GENRES, GENRE_FAMILIES, IMPRESARIATEN, MOTIVATIES, SEIZOENEN, STATUSSEN, ZALEN, capaciteitVan, inktVoor,
} from '../data/vocab'
import { datumKort, euro, getal } from '../lib/calc'
import { downloadJson, exporteerExcel, leesProgrammeringExcel } from '../lib/excel'
import { useStore } from '../store/useStore'

type Tab = 'voorstellingen' | 'aanbod' | 'doelen' | 'dataset'

function SegmentIconen({ namen }: { namen: string[] }) {
  return (
    <span className="flex gap-1">
      {namen.map((n) => <CdmLabel key={n} naam={n} />)}
    </span>
  )
}

function Veld({ label, children, breed }: { label: string; children: ReactNode; breed?: boolean }) {
  return (
    <label className={cx('block', breed && 'sm:col-span-2')}>
      <span className="mb-1 block text-xs font-semibold text-ink-2">{label}</span>
      {children}
    </label>
  )
}

/** Kies segmenten in volgorde; de eerste keuze telt het zwaarst. */
function SegmentKiezer({ lijst, gekozen, max, onChange }: { lijst: typeof DOELGROEPEN; gekozen: string[]; max: number; onChange: (g: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {lijst.map((s) => {
        const i = gekozen.indexOf(s.naam)
        return (
          <button
            type="button"
            key={s.naam}
            onClick={() => onChange(i >= 0 ? gekozen.filter((g) => g !== s.naam) : gekozen.length < max ? [...gekozen, s.naam] : gekozen)}
            className={cx('flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition', i >= 0 ? 'border-transparent' : 'border-line bg-white text-ink-2 hover:bg-[#fff6ee]')}
            style={i >= 0 ? { background: s.kleur, color: inktVoor(s.kleur) } : undefined}
          >
            {i >= 0 && <span className="grid h-4 w-4 place-items-center rounded-full bg-white/30 text-[10px]">{i + 1}</span>}
            {i < 0 && <s.icoon size={14} style={{ color: s.kleur }} />}
            {s.naam}
          </button>
        )
      })}
    </div>
  )
}

const nieuweVoorstelling = (): Voorstelling => ({
  id: `b-${Date.now().toString(36)}`,
  seizoen: '27/28',
  status: 'Optie',
  datum: '2027-10-15',
  tijd: '20:15',
  titel: '',
  artiest: '',
  impresariaat: IMPRESARIATEN[0],
  genre: 'Cabaret',
  leeftijd: null,
  zaal: 'Grote zaal',
  capaciteit: 760,
  verwacht: 560,
  eindstand: 560,
  prijs: 31,
  uitkoopsom: 9000,
  motivaties: [],
  doelgroepen: [],
  bron: 'builder',
})

function VoorstellingFormulier({ start, onOpslaan, onSluit }: { start: Voorstelling; onOpslaan: (v: Voorstelling) => void; onSluit: () => void }) {
  const [v, setV] = useState(start)
  const zet = (p: Partial<Voorstelling>) => setV((x) => ({ ...x, ...p }))
  const slimAanvullen = () => {
    const cap = capaciteitVan(v.zaal)
    const verwacht = Math.round(cap * 0.74 / 10) * 10
    const prijs = GEMIDDELDE_PRIJS[v.genre] ?? 30
    zet({
      capaciteit: cap,
      verwacht,
      eindstand: verwacht,
      prijs,
      uitkoopsom: Math.round((verwacht * prijs * 0.55) / 50) * 50,
      artiest: v.artiest || v.titel,
      tijd: v.genre === 'Jeugd & Familie' ? '14:00' : v.tijd,
    })
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onOpslaan({ ...v, artiest: v.artiest || v.titel, seizoen: seizoenVanDatum(v.datum), capaciteit: capaciteitVan(v.zaal), eindstand: Math.min(v.eindstand, capaciteitVan(v.zaal)) })
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Veld label="Titel" breed><input required className="invoer" value={v.titel} onChange={(e) => zet({ titel: e.target.value })} placeholder="Bijvoorbeeld: Sanne de Vries: Ongefilterd" /></Veld>
        <Veld label="Artiest of gezelschap"><input className="invoer" value={v.artiest} onChange={(e) => zet({ artiest: e.target.value })} placeholder="Leeg = zelfde als titel" /></Veld>
        <Veld label="Impresariaat">
          <input className="invoer" list="impresariaten" value={v.impresariaat} onChange={(e) => zet({ impresariaat: e.target.value })} />
        </Veld>
        <Veld label="Genre"><select className="invoer" value={v.genre} onChange={(e) => zet({ genre: e.target.value })}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></Veld>
        <Veld label="Status"><select className="invoer" value={v.status} onChange={(e) => zet({ status: e.target.value as Status })}>{STATUSSEN.map((s) => <option key={s.naam}>{s.naam}</option>)}</select></Veld>
        <Veld label="Datum"><input type="date" required className="invoer" value={v.datum} onChange={(e) => zet({ datum: e.target.value })} /></Veld>
        <Veld label="Aanvang"><input type="time" className="invoer" value={v.tijd} onChange={(e) => zet({ tijd: e.target.value })} /></Veld>
        <Veld label="Zaal"><select className="invoer" value={v.zaal} onChange={(e) => zet({ zaal: e.target.value as Zaal })}>{ZALEN.map((z) => <option key={z.naam}>{z.naam}</option>)}</select></Veld>
        <Veld label="Leeftijdsadvies"><input className="invoer" value={v.leeftijd ?? ''} onChange={(e) => zet({ leeftijd: e.target.value || null })} placeholder="Bijvoorbeeld 6+" /></Veld>
        <Veld label={`Verwacht aantal bezoekers (max ${capaciteitVan(v.zaal)})`}><input type="number" min={0} className="invoer" value={v.verwacht} onChange={(e) => zet({ verwacht: Number(e.target.value) })} /></Veld>
        <Veld label="Eindstand bezoekers (dummy)"><input type="number" min={0} className="invoer" value={v.eindstand} onChange={(e) => zet({ eindstand: Number(e.target.value) })} /></Veld>
        <Veld label="Gem. ticketprijs (€)"><input type="number" min={0} step={0.5} className="invoer" value={v.prijs} onChange={(e) => zet({ prijs: Number(e.target.value) })} /></Veld>
        <Veld label="Uitkoopsom (€)"><input type="number" min={0} step={50} className="invoer" value={v.uitkoopsom} onChange={(e) => zet({ uitkoopsom: Number(e.target.value) })} /></Veld>
        <Veld label="Doelgroepen (maximaal 4, in volgorde van belang)" breed>
          <SegmentKiezer lijst={DOELGROEPEN} gekozen={v.doelgroepen} max={4} onChange={(doelgroepen) => zet({ doelgroepen })} />
        </Veld>
        <Veld label="Motivaties (maximaal 2)" breed>
          <SegmentKiezer lijst={MOTIVATIES} gekozen={v.motivaties} max={2} onChange={(motivaties) => zet({ motivaties })} />
        </Veld>
        <Veld label="Notitie" breed><textarea className="invoer" rows={2} value={v.notitie ?? ''} onChange={(e) => zet({ notitie: e.target.value })} /></Veld>
      </div>
      <datalist id="impresariaten">{IMPRESARIATEN.map((i) => <option key={i} value={i} />)}</datalist>
      <div className="mt-6 flex flex-wrap justify-between gap-2">
        <button type="button" className="knop knop-zacht" onClick={slimAanvullen}><MagicWand size={16} className="text-violet" /> Slim aanvullen</button>
        <div className="flex gap-2">
          <button type="button" className="knop knop-zacht" onClick={onSluit}>Annuleren</button>
          <button className="knop knop-primair">Opslaan</button>
        </div>
      </div>
    </form>
  )
}

const nieuwAanbod = (): Aanbod => ({
  id: `ab-${Date.now().toString(36)}`,
  titel: '',
  artiest: '',
  impresariaat: IMPRESARIATEN[0],
  genre: 'Cabaret',
  omschrijving: '',
  zalen: ['Grote zaal'],
  periodeStart: '2027-10-01',
  periodeEind: '2028-01-31',
  beschikbareData: [],
  uitkoopsom: 9000,
  prijsIndicatie: 31,
  duur: 100,
  verwacht: 560,
  motivaties: [],
  doelgroepen: [],
  premiere: false,
  status: 'Nieuw',
  ontvangen: new Date().toISOString().slice(0, 10),
})

function AanbodFormulier({ start, onOpslaan, onSluit }: { start: Aanbod; onOpslaan: (a: Aanbod) => void; onSluit: () => void }) {
  const [a, setA] = useState(start)
  const [nieuweDatum, setNieuweDatum] = useState('')
  const zet = (p: Partial<Aanbod>) => setA((x) => ({ ...x, ...p }))
  return (
    <form onSubmit={(e) => { e.preventDefault(); onOpslaan({ ...a, artiest: a.artiest || a.titel }) }}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Veld label="Titel" breed><input required className="invoer" value={a.titel} onChange={(e) => zet({ titel: e.target.value })} /></Veld>
        <Veld label="Artiest of gezelschap"><input className="invoer" value={a.artiest} onChange={(e) => zet({ artiest: e.target.value })} placeholder="Leeg = zelfde als titel" /></Veld>
        <Veld label="Impresariaat"><input className="invoer" list="impresariaten-a" value={a.impresariaat} onChange={(e) => zet({ impresariaat: e.target.value })} /></Veld>
        <Veld label="Genre"><select className="invoer" value={a.genre} onChange={(e) => zet({ genre: e.target.value })}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></Veld>
        <Veld label="Status"><select className="invoer" value={a.status} onChange={(e) => zet({ status: e.target.value as AanbodStatus })}>{AANBOD_STATUSSEN.map((s) => <option key={s.naam}>{s.naam}</option>)}</select></Veld>
        <Veld label="Omschrijving" breed><textarea className="invoer" rows={2} value={a.omschrijving} onChange={(e) => zet({ omschrijving: e.target.value })} /></Veld>
        <Veld label="Geschikte zalen" breed>
          <div className="flex gap-2">
            {ZALEN.map((z) => (
              <label key={z.naam} className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-line">
                <input type="checkbox" className="accent-violet-600" checked={a.zalen.includes(z.naam)} onChange={(e) => zet({ zalen: e.target.checked ? [...a.zalen, z.naam] : a.zalen.filter((x) => x !== z.naam) })} />
                {z.naam}
              </label>
            ))}
          </div>
        </Veld>
        <Veld label="Speelperiode vanaf"><input type="date" className="invoer" value={a.periodeStart} onChange={(e) => zet({ periodeStart: e.target.value })} /></Veld>
        <Veld label="Speelperiode tot"><input type="date" className="invoer" value={a.periodeEind} onChange={(e) => zet({ periodeEind: e.target.value })} /></Veld>
        <Veld label="Beschikbare data" breed>
          <div className="flex flex-wrap items-center gap-2">
            {a.beschikbareData.map((d) => (
              <button type="button" key={d} onClick={() => zet({ beschikbareData: a.beschikbareData.filter((x) => x !== d) })} className="rounded-full bg-lavendel px-2.5 py-1 text-xs font-semibold hover:bg-rose-100" title="Klik om te verwijderen">
                <span className="inline-flex items-center gap-1">{datumKort(d)} <X size={11} weight="bold" /></span>
              </button>
            ))}
            <input type="date" className="invoer !w-auto" value={nieuweDatum} onChange={(e) => setNieuweDatum(e.target.value)} />
            <button type="button" className="knop knop-zacht !py-1.5" onClick={() => { if (nieuweDatum && !a.beschikbareData.includes(nieuweDatum)) zet({ beschikbareData: [...a.beschikbareData, nieuweDatum].sort() }); setNieuweDatum('') }}>
              <Plus size={14} /> Datum
            </button>
          </div>
        </Veld>
        <Veld label="Uitkoopsom (€)"><input type="number" min={0} step={50} className="invoer" value={a.uitkoopsom} onChange={(e) => zet({ uitkoopsom: Number(e.target.value) })} /></Veld>
        <Veld label="Prijsindicatie (€)"><input type="number" min={0} step={0.5} className="invoer" value={a.prijsIndicatie} onChange={(e) => zet({ prijsIndicatie: Number(e.target.value) })} /></Veld>
        <Veld label="Verwacht aantal bezoekers"><input type="number" min={0} className="invoer" value={a.verwacht} onChange={(e) => zet({ verwacht: Number(e.target.value) })} /></Veld>
        <Veld label="Duur (minuten)"><input type="number" min={0} className="invoer" value={a.duur} onChange={(e) => zet({ duur: Number(e.target.value) })} /></Veld>
        <Veld label="Doelgroepen (maximaal 4)" breed><SegmentKiezer lijst={DOELGROEPEN} gekozen={a.doelgroepen} max={4} onChange={(doelgroepen) => zet({ doelgroepen })} /></Veld>
        <Veld label="Motivaties (maximaal 2)" breed><SegmentKiezer lijst={MOTIVATIES} gekozen={a.motivaties} max={2} onChange={(motivaties) => zet({ motivaties })} /></Veld>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-violet-600" checked={a.premiere} onChange={(e) => zet({ premiere: e.target.checked })} /> Première</label>
      </div>
      <datalist id="impresariaten-a">{IMPRESARIATEN.map((i) => <option key={i} value={i} />)}</datalist>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="knop knop-zacht" onClick={onSluit}>Annuleren</button>
        <button className="knop knop-primair">Opslaan</button>
      </div>
    </form>
  )
}

function DoelSchuif({ label, icoon: I, kleur, waarde, onChange, max = 40 }: { label: string; icoon?: Icon; kleur: string; waarde: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex w-56 shrink-0 items-center gap-2 truncate text-sm">{I && <I size={16} style={{ color: kleur }} />} {label}</span>
      <input type="range" min={0} max={max} value={waarde} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" style={{ accentColor: kleur }} />
      <span className="w-12 text-right font-semibold tabular-nums">{waarde}%</span>
    </div>
  )
}

function SomLabel({ som }: { som: number }) {
  return <span className={cx('rounded-full px-2.5 py-1 text-xs font-bold', som === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>totaal {som}%{som !== 100 && ', streef naar 100%'}</span>
}

export default function Builder() {
  const dataset = useStore((s) => s.dataset)
  const upsertV = useStore((s) => s.upsertVoorstelling)
  const verwijderV = useStore((s) => s.verwijderVoorstelling)
  const upsertA = useStore((s) => s.upsertAanbod)
  const verwijderA = useStore((s) => s.verwijderAanbod)
  const setDoelen = useStore((s) => s.setDoelen)
  const genereer = useStore((s) => s.genereer)
  const laad = useStore((s) => s.laadDataset)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('voorstellingen')
  const [zoek, setZoek] = useState('')
  const [seizoenFilter, setSeizoenFilter] = useState('26/27')
  const [aantal, setAantal] = useState(60)
  const [bewerkV, setBewerkV] = useState<Voorstelling | null>(null)
  const [bewerkA, setBewerkA] = useState<Aanbod | null>(null)
  const [seed, setSeed] = useState(dataset.seed)
  const [melding, setMelding] = useState<string | null>(null)
  const excelRef = useRef<HTMLInputElement>(null)
  const jsonRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = params.get('bewerk')
    if (!id) return
    const v = dataset.voorstellingen.find((x) => x.id === id)
    if (v) {
      setTab('voorstellingen')
      setBewerkV(v)
    }
    setParams({}, { replace: true })
  }, [params, setParams, dataset.voorstellingen])

  const voorstellingen = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    return dataset.voorstellingen.filter((v) => (!seizoenFilter || v.seizoen === seizoenFilter) && (!q || `${v.titel} ${v.artiest} ${v.impresariaat}`.toLowerCase().includes(q)))
  }, [dataset.voorstellingen, seizoenFilter, zoek])
  const aanbod = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    return dataset.aanbod.filter((a) => !q || `${a.titel} ${a.artiest} ${a.impresariaat}`.toLowerCase().includes(q))
  }, [dataset.aanbod, zoek])

  const doelen = dataset.doelen
  const zetDoel = (soort: 'doelgroepen' | 'motivaties' | 'genres', naam: string, w: number) => setDoelen({ ...doelen, [soort]: { ...doelen[soort], [naam]: w } } as Doelen)
  const somVan = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0)

  const importeerExcel = async (bestand: File) => {
    try {
      const { voorstellingen: nieuw, overgeslagen } = await leesProgrammeringExcel(bestand)
      const seizoenen = new Set(nieuw.map((v) => v.seizoen))
      laad({ ...dataset, voorstellingen: [...dataset.voorstellingen.filter((v) => !seizoenen.has(v.seizoen)), ...nieuw].sort((a, b) => a.datum.localeCompare(b.datum)) })
      setMelding(`${nieuw.length} voorstellingen ingelezen voor seizoen ${[...seizoenen].sort().join(', ')}${overgeslagen ? `, ${overgeslagen} regels overgeslagen` : ''}. Bestaande voorstellingen van die seizoenen zijn vervangen.`)
    } catch (e) {
      setMelding(`Inlezen mislukt: ${(e as Error).message}`)
    }
  }
  const importeerJson = async (bestand: File) => {
    try {
      const d = JSON.parse(await bestand.text()) as Dataset
      if (!Array.isArray(d.voorstellingen) || !Array.isArray(d.aanbod) || !d.doelen) throw new Error('Geen geldige Coulisse-dataset')
      laad(d)
      setMelding(`Dataset ingeladen: ${d.voorstellingen.length} voorstellingen en ${d.aanbod.length} aanbiedingen.`)
    } catch (e) {
      setMelding(`Inlezen mislukt: ${(e as Error).message}`)
    }
  }

  return (
    <div>
      <Paginakop titel="Databuilder" icoon={Hammer} kleur="#475569" sub="Maak, bewerk en verwijder voorstellingen en aanbod, stel seizoensdoelen in en genereer met één klik een nieuwe dummy dataset. Alles wordt bewaard in deze browser.">
        <Tabs<Tab> uitleg="builder-tabs" waarde={tab} onChange={setTab} opties={[{ id: 'voorstellingen', label: <><Ticket size={16} /> Voorstellingen</> }, { id: 'aanbod', label: <><Tray size={16} /> Aanbod</> }, { id: 'doelen', label: <><Target size={16} /> Doelen</> }, { id: 'dataset', label: <><DiceFive size={16} /> Dataset</> }]} />
      </Paginakop>

      {melding && <div className="verschijn mb-4 rounded-2xl bg-citroen px-4 py-3 text-sm font-medium">{melding}</div>}

      {(tab === 'voorstellingen' || tab === 'aanbod') && (
        <Kaart>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input className="invoer max-w-xs !rounded-full" placeholder="Zoeken" value={zoek} onChange={(e) => setZoek(e.target.value)} />
            {tab === 'voorstellingen' && (
              <select className="invoer !w-auto !rounded-full" value={seizoenFilter} onChange={(e) => setSeizoenFilter(e.target.value)}>
                <option value="">Alle seizoenen</option>
                {SEIZOENEN.map((s) => <option key={s} value={s}>Seizoen {s}</option>)}
              </select>
            )}
            <span className="text-sm text-ink-2">{tab === 'voorstellingen' ? voorstellingen.length : aanbod.length} regels</span>
            <button data-uitleg="builder-nieuw" className="knop knop-koraal ml-auto" onClick={() => (tab === 'voorstellingen' ? setBewerkV(nieuweVoorstelling()) : setBewerkA(nieuwAanbod()))}>
              <Plus size={16} /> {tab === 'voorstellingen' ? 'Nieuwe voorstelling' : 'Nieuw aanbod'}
            </button>
          </div>
          <div className="dun-scroll overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-ink-2">
                <tr className="border-b border-line">
                  {tab === 'voorstellingen'
                    ? ['Datum', 'Titel', 'Genre', 'Zaal', 'Status', 'Verwacht', 'Doelgroepen', ''].map((k) => <th key={k} className="px-3 py-2">{k}</th>)
                    : ['Titel', 'Impresariaat', 'Genre', 'Periode', 'Uitkoop', 'Status', 'Doelgroepen', ''].map((k) => <th key={k} className="px-3 py-2">{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {tab === 'voorstellingen'
                  ? voorstellingen.slice(0, aantal).map((v) => (
                      <tr key={v.id} className="border-b border-line/60 hover:bg-[#fff6ee]">
                        <td className="whitespace-nowrap px-3 py-2 text-ink-2">{datumKort(v.datum)} {v.datum.slice(0, 4)}</td>
                        <td className="px-3 py-2 font-semibold">{v.titel}</td>
                        <td className="px-3 py-2"><GenreLabel genre={v.genre} klein /></td>
                        <td className="px-3 py-2 text-ink-2">{v.zaal}</td>
                        <td className="px-3 py-2"><StatusLabel status={v.status} klein /></td>
                        <td className="px-3 py-2 tabular-nums">{getal(v.verwacht)}</td>
                        <td className="px-3 py-2"><SegmentIconen namen={v.doelgroepen} /></td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button className="rounded-full p-2 hover:bg-white" onClick={() => setBewerkV(v)} aria-label="Bewerken"><PencilSimple size={15} /></button>
                          <button className="rounded-full p-2 text-rose-600 hover:bg-rose-50" onClick={() => confirm(`"${v.titel}" verwijderen?`) && verwijderV(v.id)} aria-label="Verwijderen"><Trash size={15} /></button>
                        </td>
                      </tr>
                    ))
                  : aanbod.slice(0, aantal).map((a) => (
                      <tr key={a.id} className="border-b border-line/60 hover:bg-[#fff6ee]">
                        <td className="px-3 py-2 font-semibold">{a.titel}</td>
                        <td className="px-3 py-2 text-ink-2">{a.impresariaat}</td>
                        <td className="px-3 py-2"><GenreLabel genre={a.genre} klein /></td>
                        <td className="whitespace-nowrap px-3 py-2 text-ink-2">{datumKort(a.periodeStart)} tot {datumKort(a.periodeEind)}</td>
                        <td className="px-3 py-2 tabular-nums">{euro(a.uitkoopsom)}</td>
                        <td className="px-3 py-2"><StatusLabel status={a.status} klein /></td>
                        <td className="px-3 py-2"><SegmentIconen namen={a.doelgroepen} /></td>
                        <td className="whitespace-nowrap px-3 py-2 text-right">
                          <button className="rounded-full p-2 hover:bg-white" onClick={() => setBewerkA(a)} aria-label="Bewerken"><PencilSimple size={15} /></button>
                          <button className="rounded-full p-2 text-rose-600 hover:bg-rose-50" onClick={() => confirm(`"${a.titel}" verwijderen?`) && verwijderA(a.id)} aria-label="Verwijderen"><Trash size={15} /></button>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
          {(tab === 'voorstellingen' ? voorstellingen.length : aanbod.length) > aantal && (
            <div className="mt-4 text-center"><button className="knop knop-zacht" onClick={() => setAantal(aantal + 100)}>Meer tonen</button></div>
          )}
        </Kaart>
      )}

      {tab === 'doelen' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Kaart titel="Doelgroepen" sub="Streefaandeel in het bereik per seizoen" actie={<SomLabel som={somVan(doelen.doelgroepen)} />}>
            <div className="space-y-3">
              {DOELGROEPEN.map((d) => <DoelSchuif key={d.naam} label={d.naam} icoon={d.icoon} kleur={d.kleur} waarde={doelen.doelgroepen[d.naam] ?? 0} onChange={(w) => zetDoel('doelgroepen', d.naam, w)} />)}
            </div>
          </Kaart>
          <Kaart i={1} titel="Motivaties" sub="Streefaandeel per motivatie" actie={<SomLabel som={somVan(doelen.motivaties)} />}>
            <div className="space-y-3">
              {MOTIVATIES.map((d) => <DoelSchuif key={d.naam} label={d.naam} icoon={d.icoon} kleur={d.kleur} waarde={doelen.motivaties[d.naam] ?? 0} onChange={(w) => zetDoel('motivaties', d.naam, w)} max={50} />)}
            </div>
          </Kaart>
          <Kaart i={2} titel="Genrefamilies" sub="Streefaandeel bezoekers per genrefamilie" actie={<SomLabel som={somVan(doelen.genres)} />}>
            <div className="space-y-3">
              {GENRE_FAMILIES.map((d) => <DoelSchuif key={d.naam} label={d.naam} icoon={d.icoon} kleur={d.kleur} waarde={doelen.genres[d.naam] ?? 0} onChange={(w) => zetDoel('genres', d.naam, w)} />)}
            </div>
          </Kaart>
          <Kaart i={3} titel="Seizoensdoelen" sub="Algemene ambities">
            <div className="grid gap-4 sm:grid-cols-2">
              <Veld label="Bezettingsgraad (%)"><input type="number" className="invoer" value={doelen.bezetting} onChange={(e) => setDoelen({ ...doelen, bezetting: Number(e.target.value) })} /></Veld>
              <Veld label="Aantal voorstellingen"><input type="number" className="invoer" value={doelen.aantal} onChange={(e) => setDoelen({ ...doelen, aantal: Number(e.target.value) })} /></Veld>
            </div>
            <button className="knop knop-zacht mt-5" onClick={() => setDoelen(STANDAARD_DOELEN)}><ArrowsClockwise size={16} /> Standaarddoelen herstellen</button>
          </Kaart>
        </div>
      )}

      {tab === 'dataset' && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Kaart i={0} titel={<><DiceFive size={20} className="text-violet" /> Dummy dataset genereren</>} sub="Dezelfde seed geeft altijd dezelfde dataset. Het huidige seizoen is gebaseerd op de programmeringsexport.">
            <div className="grid grid-cols-2 gap-3">
              <KpiTegel i={1} label="Voorstellingen" waarde={dataset.voorstellingen.length} kleur="perzik" icoon={Ticket} />
              <KpiTegel i={2} label="Aanbod" waarde={dataset.aanbod.length} kleur="munt" icoon={Tray} />
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-3">
              <Veld label="Seed"><input type="number" className="invoer !w-36" value={seed} onChange={(e) => setSeed(Number(e.target.value))} /></Veld>
              <button className="knop knop-zacht" onClick={() => setSeed(Math.floor(Math.random() * 99999))}><MagicWand size={16} /> Willekeurig</button>
              <button className="knop knop-primair" onClick={() => { if (confirm('Alle data en wijzigingen vervangen door een nieuwe dummy dataset?')) { genereer(seed); setMelding(`Nieuwe dataset gegenereerd met seed ${seed}.`) } }}>
                <ArrowsClockwise size={16} /> Genereer opnieuw
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">Huidige seed {dataset.seed}, gemaakt op {new Date(dataset.gegenereerdOp).toLocaleString('nl-NL')}.</p>
          </Kaart>
          <Kaart i={1} titel={<><UploadSimple size={20} className="text-lucht" /> Importeren en exporteren</>} sub="Excel in het formaat van de programmeringsexport, of de complete dataset als JSON">
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="knop knop-zacht justify-center !py-3" onClick={() => excelRef.current?.click()}><UploadSimple size={16} /> Programmering (.xlsx) inlezen</button>
              <button className="knop knop-zacht justify-center !py-3" onClick={() => exporteerExcel(dataset)}><FileXls size={16} /> Exporteer naar Excel</button>
              <button className="knop knop-zacht justify-center !py-3" onClick={() => jsonRef.current?.click()}><FileJs size={16} /> Dataset (.json) inlezen</button>
              <button className="knop knop-zacht justify-center !py-3" onClick={() => downloadJson(dataset)}><DownloadSimple size={16} /> Download als JSON</button>
            </div>
            <input ref={excelRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importeerExcel(f); e.target.value = '' }} />
            <input ref={jsonRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importeerJson(f); e.target.value = '' }} />
            <div className="mt-4 rounded-2xl bg-ijs p-4 text-xs text-ink-2">
              Verwachte kolommen bij Excel-import: Theaterseizoen, Status, Datum, Titel, Genre, Leeftijdsadvies, Locatie, Verwacht aantal bezoekers, Bezoekersmotivatie (2x), Toegewezen doelgroep (4x) en ID. Voorstellingen van de seizoenen in het bestand worden vervangen.
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {DOELGROEPEN.slice(0, 4).map((d) => <SegmentChip key={d.naam} segment={d} klein />)}
              <span className="text-xs text-muted">en meer worden automatisch herkend</span>
            </div>
          </Kaart>
          <Kaart i={2} titel={<><Lightbulb size={20} className="text-amber-500" /> Uitleg</>} sub="Elk onderdeel toont één keer een korte rondleiding. Wil je ze allemaal opnieuw zien?">
            <button className="knop knop-zacht" onClick={() => { wisAlleUitleg(); setMelding('Alle uitleg staat weer aan. Je ziet hem bij je volgende bezoek aan elk onderdeel.') }}>
              <ArrowsClockwise size={16} /> Alle uitleg opnieuw tonen
            </button>
          </Kaart>
        </div>
      )}

      <Venster open={!!bewerkV} onSluit={() => setBewerkV(null)} titel={bewerkV?.titel ? `Bewerk: ${bewerkV.titel}` : 'Nieuwe voorstelling'}>
        {bewerkV && <VoorstellingFormulier start={bewerkV} onSluit={() => setBewerkV(null)} onOpslaan={(v) => { upsertV(v); setBewerkV(null); setMelding(`"${v.titel}" opgeslagen.`) }} />}
      </Venster>
      <Venster open={!!bewerkA} onSluit={() => setBewerkA(null)} titel={bewerkA?.titel ? `Bewerk: ${bewerkA.titel}` : 'Nieuw aanbod'}>
        {bewerkA && <AanbodFormulier start={bewerkA} onSluit={() => setBewerkA(null)} onOpslaan={(a) => { upsertA(a); setBewerkA(null); setMelding(`"${a.titel}" opgeslagen.`) }} />}
      </Venster>
    </div>
  )
}
