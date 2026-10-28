import { CheckCircle, Package, Rows, Sparkle, SquaresFour, Star, Target, Tray, MagnifyingGlass } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { CdmLabel, GenreLabel, Kaart, KpiTegel, Leeg, Paginakop, PastBijOns, ScoreRing, StatusLabel, Tabs, cx } from '../components/ui'
import { staffel } from '../lib/animatie'
import type { Aanbod as AanbodType, AanbodStatus } from '../data/types'
import { AANBOD_STATUSSEN, DOELGROEPEN, GENRES, IMPRESARIATEN, MOTIVATIES, segmentVan } from '../data/vocab'
import { datumKort, euro, getal } from '../lib/calc'
import { useMatches, useSelectie } from '../lib/hooks'
import { useStore } from '../store/useStore'

type Sortering = 'match' | 'ontvangen' | 'uitkoop' | 'verwacht'

export default function Aanbod() {
  const aanbod = useStore((s) => s.dataset.aanbod)
  const setStatus = useStore((s) => s.setAanbodStatus)
  const toon = useSelectie((s) => s.toonAanbod)
  const matches = useMatches()
  const [zoek, setZoek] = useState('')
  const [status, setStatusFilter] = useState<'Alle' | AanbodStatus>('Alle')
  const [genre, setGenre] = useState('')
  const [impresariaat, setImpresariaat] = useState('')
  const [doelgroep, setDoelgroep] = useState('')
  const [motivatie, setMotivatie] = useState('')
  const [budget, setBudget] = useState(60000)
  const [alleenNieuw, setAlleenNieuw] = useState(false)
  const [sortering, setSortering] = useState<Sortering>('match')
  const [weergave, setWeergave] = useState<'kaarten' | 'tabel'>('kaarten')
  const [aantal, setAantal] = useState(24)
  const eenvoudig = useStore((s) => s.modus) === 'eenvoudig'
  const [alleenGoed, setAlleenGoed] = useState(false)

  const lijst = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    const l = aanbod.filter(
      (a) =>
        (status === 'Alle' || a.status === status) &&
        (!genre || a.genre === genre) &&
        (!impresariaat || a.impresariaat === impresariaat) &&
        (!doelgroep || a.doelgroepen.includes(doelgroep)) &&
        (!motivatie || a.motivaties.includes(motivatie)) &&
        a.uitkoopsom <= budget &&
        (!alleenNieuw || !matches.get(a.id)?.bekend) &&
        (!alleenGoed || (matches.get(a.id)?.score ?? 0) >= 70) &&
        (!q || `${a.titel} ${a.artiest} ${a.impresariaat}`.toLowerCase().includes(q)),
    )
    const s = {
      match: (a: AanbodType, b: AanbodType) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0),
      ontvangen: (a: AanbodType, b: AanbodType) => b.ontvangen.localeCompare(a.ontvangen),
      uitkoop: (a: AanbodType, b: AanbodType) => a.uitkoopsom - b.uitkoopsom,
      verwacht: (a: AanbodType, b: AanbodType) => b.verwacht - a.verwacht,
    }[sortering]
    return l.sort(s)
  }, [aanbod, status, genre, impresariaat, doelgroep, motivatie, budget, alleenNieuw, zoek, sortering, matches])

  const scores = [...matches.values()].map((m) => m.score)
  const gemScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const telStatus = (s: AanbodStatus) => aanbod.filter((a) => a.status === s).length

  return (
    <div>
      <Paginakop
        titel={eenvoudig ? 'Aanbod' : 'Aanbod impresariaten'}
        icoon={Tray}
        kleur="#d97706"
        sub={eenvoudig
          ? 'Voorstellingen die impresariaten ons aanbieden voor volgend seizoen. Bovenaan staat wat het best bij ons publiek en onze agenda past.'
          : 'Alle geïmporteerde producties voor seizoen 27/28. De matchscore weegt doelgroepgaten, motivaties, onze historie, vrije data en de financiële verhouding.'}
      >
        {!eenvoudig && <Tabs waarde={weergave} onChange={setWeergave} opties={[{ id: 'kaarten', label: <span className="flex items-center gap-1.5"><SquaresFour size={15} /> Kaarten</span> }, { id: 'tabel', label: <span className="flex items-center gap-1.5"><Rows size={15} /> Tabel</span> }]} />}
      </Paginakop>

      {eenvoudig ? (
        <div className="verschijn flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-[var(--shadow-zacht)] ring-1 ring-line">
          <div className="relative min-w-56 flex-1">
            <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="invoer !rounded-full !py-3 !pl-10 !text-base" placeholder="Zoek een voorstelling of artiest" value={zoek} onChange={(e) => setZoek(e.target.value)} />
          </div>
          <select className="invoer !w-auto !rounded-full !py-3 !text-base" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Alle genres</option>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <button onClick={() => setAlleenGoed(!alleenGoed)} className={cx('knop !px-4 !py-3 text-[15px]', alleenGoed ? 'knop-primair' : 'knop-zacht')}>
            <CheckCircle size={18} /> Alleen wat goed past
          </button>
          <button onClick={() => setStatusFilter(status === 'Shortlist' ? 'Alle' : 'Shortlist')} className={cx('knop !px-4 !py-3 text-[15px]', status === 'Shortlist' ? 'knop-primair' : 'knop-zacht')}>
            <Star size={18} /> Bewaard ({telStatus('Shortlist')})
          </button>
        </div>
      ) : (<>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiTegel i={0} label="Producties in aanbod" waarde={aanbod.length} icoon={Package} kleur="citroen" />
        <KpiTegel i={1} label="Nieuw binnen" waarde={telStatus('Nieuw')} sub="nog niet bekeken" icoon={Sparkle} kleur="ijs" />
        <KpiTegel i={2} label="Op de shortlist" waarde={telStatus('Shortlist')} icoon={Star} kleur="perzik" />
        <KpiTegel i={3} label="Ingepland" waarde={telStatus('Ingepland')} icoon={CheckCircle} kleur="munt" />
        <KpiTegel i={4} label="Gem. matchscore" waarde={Math.round(gemScore)} sub="van 100" icoon={Target} kleur="lavendel" />
      </div>

      <Kaart className="mt-6" i={5} uitleg="aanbod-filters">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="invoer !rounded-full !pl-9" placeholder="Zoek titel, artiest of impresariaat" value={zoek} onChange={(e) => setZoek(e.target.value)} />
          </div>
          <select className="invoer !w-auto !rounded-full" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Alle genres</option>
            {GENRES.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select className="invoer !w-auto !rounded-full" value={impresariaat} onChange={(e) => setImpresariaat(e.target.value)}>
            <option value="">Alle impresariaten</option>
            {IMPRESARIATEN.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select className="invoer !w-auto !rounded-full" value={doelgroep} onChange={(e) => setDoelgroep(e.target.value)}>
            <option value="">Alle doelgroepen</option>
            {DOELGROEPEN.map((g) => <option key={g.naam} value={g.naam}>{g.naam}</option>)}
          </select>
          <select className="invoer !w-auto !rounded-full" value={motivatie} onChange={(e) => setMotivatie(e.target.value)}>
            <option value="">Alle motivaties</option>
            {MOTIVATIES.map((g) => <option key={g.naam} value={g.naam}>{g.naam}</option>)}
          </select>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <Tabs<'Alle' | AanbodStatus> waarde={status} onChange={setStatusFilter} opties={[{ id: 'Alle', label: 'Alle' }, ...AANBOD_STATUSSEN.map((s) => ({ id: s.naam, label: `${s.naam} ${telStatus(s.naam)}` }))]} />
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2 font-semibold text-ink-2">
              Max. uitkoopsom <b className="w-20 text-ink">{euro(budget)}</b>
              <input type="range" min={2000} max={60000} step={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="accent-violet-600" />
            </label>
            <label className="flex items-center gap-2 font-semibold text-ink-2">
              <input type="checkbox" checked={alleenNieuw} onChange={(e) => setAlleenNieuw(e.target.checked)} className="h-4 w-4 accent-violet-600" /> Alleen nieuw in Zoetermeer
            </label>
            <select className="invoer !w-auto !rounded-full" value={sortering} onChange={(e) => setSortering(e.target.value as Sortering)}>
              <option value="match">Sorteer op matchscore</option>
              <option value="ontvangen">Sorteer op ontvangen</option>
              <option value="uitkoop">Sorteer op uitkoopsom</option>
              <option value="verwacht">Sorteer op verwachte bezoekers</option>
            </select>
          </div>
        </div>
      </Kaart>
      </>)}

      <div className="mt-4 text-sm text-ink-2">{lijst.length} {eenvoudig ? 'voorstellingen' : 'producties'}</div>
      {!lijst.length && <div className="mt-3"><Leeg>Geen aanbod met deze filters.</Leeg></div>}

      {eenvoudig || weergave === 'kaarten' ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lijst.slice(0, aantal).map((a, i) => {
            const m = matches.get(a.id)
            return (
              <article key={a.id} data-uitleg={i === 0 ? 'aanbod-kaart' : undefined} style={staffel(i % 24)} className="kaart verschijn group flex cursor-pointer flex-col p-5 transition duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-hoog)]" onClick={() => toon(a.id)}>
                <div className="flex items-start gap-3">
                  {!eenvoudig && <ScoreRing score={m?.score ?? 0} />}
                  <div className="min-w-0 flex-1">
                    {eenvoudig && <div className="mb-1.5"><PastBijOns score={m?.score ?? 0} /></div>}
                    <h3 className="font-display text-lg font-bold leading-snug">{a.titel}</h3>
                    <div className="text-sm text-ink-2">{a.impresariaat}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setStatus(a.id, a.status === 'Shortlist' ? 'Bekeken' : 'Shortlist') }}
                    className={cx('grid h-9 w-9 place-items-center rounded-full transition', a.status === 'Shortlist' ? 'bg-citroen text-amber-500' : 'bg-[#faf5ef] text-muted hover:text-amber-500')}
                    aria-label={eenvoudig ? 'Bewaren' : 'Shortlist'}
                    title={a.status === 'Shortlist' ? 'Bewaard' : 'Bewaren'}
                    data-uitleg={i === 0 ? 'shortlist' : undefined}
                  >
                    <Star key={a.status} size={18} weight={a.status === 'Shortlist' ? 'fill' : 'bold'} className={a.status === 'Shortlist' ? 'spring' : ''} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <GenreLabel genre={a.genre} klein />
                  {!eenvoudig && <StatusLabel status={a.status} klein />}
                  {a.premiere && <span className="rounded-full bg-snoep px-2 py-0.5 text-[11px] font-bold text-pink-700">Première</span>}
                  {m && !m.bekend && <span className="rounded-full bg-citroen px-2 py-0.5 text-[11px] font-bold text-amber-800">Nieuw voor ons</span>}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-ink-2">{a.omschrijving}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1">
                  {a.doelgroepen.map((d) => <CdmLabel key={d} naam={d} groot />)}
                  <span className="ml-auto flex gap-1">{a.motivaties.map((x) => { const s = segmentVan(MOTIVATIES, x); return s ? <span key={x} title={s.naam}><s.icoon size={16} style={{ color: s.kleur }} /></span> : null })}</span>
                </div>
                {m && m.redenen[0] && <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-munt/70 px-3 py-2 text-xs font-medium text-emerald-900"><Sparkle size={14} className="shrink-0 text-emerald-600" /> {m.redenen.find((r) => r.type === 'plus')?.tekst ?? m.redenen[0].tekst}</div>}
                {!eenvoudig && <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-xs">
                  <div><div className="text-muted">Uitkoop</div><div className="font-bold">{euro(a.uitkoopsom)}</div></div>
                  <div><div className="text-muted">Verwacht</div><div className="font-bold">{getal(a.verwacht)}</div></div>
                  <div><div className="text-muted">Data vrij</div><div className="font-bold">{m?.vrijeData.length ?? 0}/{a.beschikbareData.length}</div></div>
                </div>}
                {eenvoudig && <div className="mt-auto pt-3 text-sm font-semibold text-violet">Bekijk en plan in →</div>}
              </article>
            )
          })}
        </div>
      ) : (
        <Kaart className="mt-3">
          <div className="dun-scroll overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-ink-2">
                <tr className="border-b border-line">
                  <th className="px-3 py-2">Match</th><th className="px-3 py-2">Titel</th><th className="px-3 py-2">Impresariaat</th><th className="px-3 py-2">Genre</th>
                  <th className="px-3 py-2">Periode</th><th className="px-3 py-2">Doelgroepen</th><th className="px-3 py-2 text-right">Uitkoop</th><th className="px-3 py-2 text-right">Verwacht</th><th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {lijst.slice(0, aantal * 2).map((a) => (
                  <tr key={a.id} onClick={() => toon(a.id)} className="cursor-pointer border-b border-line/60 hover:bg-[#fff6ee]">
                    <td className="px-3 py-2"><ScoreRing score={matches.get(a.id)?.score ?? 0} grootte={40} /></td>
                    <td className="px-3 py-2 font-semibold">{a.titel}</td>
                    <td className="px-3 py-2 text-ink-2">{a.impresariaat}</td>
                    <td className="px-3 py-2"><GenreLabel genre={a.genre} klein /></td>
                    <td className="whitespace-nowrap px-3 py-2 text-ink-2">{datumKort(a.periodeStart)} tot {datumKort(a.periodeEind)}</td>
                    <td className="px-3 py-2"><span className="flex gap-1">{a.doelgroepen.map((d) => <CdmLabel key={d} naam={d} />)}</span></td>
                    <td className="px-3 py-2 text-right tabular-nums">{euro(a.uitkoopsom)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{getal(a.verwacht)}</td>
                    <td className="px-3 py-2"><StatusLabel status={a.status} klein /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Kaart>
      )}
      {lijst.length > (weergave === 'kaarten' ? aantal : aantal * 2) && (
        <div className="mt-6 text-center">
          <button className="knop knop-zacht" onClick={() => setAantal(aantal + 24)}>Toon meer ({lijst.length - (weergave === 'kaarten' ? aantal : aantal * 2)} over)</button>
        </div>
      )}
    </div>
  )
}
