import { LayoutGrid, Rows3, Search, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { GenreLabel, Kaart, KpiTegel, Leeg, Paginakop, ScoreRing, StatusLabel, Tabs, cx } from '../components/ui'
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
      <Paginakop titel="Aanbod impresariaten" emoji="📬" sub="Alle geïmporteerde producties voor seizoen 27/28. De matchscore weegt doelgroepgaten, motivaties, onze historie, vrije data en de financiële verhouding.">
        <Tabs waarde={weergave} onChange={setWeergave} opties={[{ id: 'kaarten', label: <span className="flex items-center gap-1.5"><LayoutGrid size={15} /> Kaarten</span> }, { id: 'tabel', label: <span className="flex items-center gap-1.5"><Rows3 size={15} /> Tabel</span> }]} />
      </Paginakop>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiTegel label="Producties in aanbod" waarde={getal(aanbod.length)} icoon="📦" kleur="citroen" />
        <KpiTegel label="Nieuw binnen" waarde={getal(telStatus('Nieuw'))} sub="nog niet bekeken" icoon="🆕" kleur="ijs" />
        <KpiTegel label="Op de shortlist" waarde={getal(telStatus('Shortlist'))} icoon="⭐" kleur="perzik" />
        <KpiTegel label="Ingepland" waarde={getal(telStatus('Ingepland'))} icoon="✅" kleur="munt" />
        <KpiTegel label="Gem. matchscore" waarde={Math.round(gemScore)} sub="van 100" icoon="🎯" kleur="lavendel" />
      </div>

      <Kaart className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
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
            {DOELGROEPEN.map((g) => <option key={g.naam} value={g.naam}>{g.emoji} {g.naam}</option>)}
          </select>
          <select className="invoer !w-auto !rounded-full" value={motivatie} onChange={(e) => setMotivatie(e.target.value)}>
            <option value="">Alle motivaties</option>
            {MOTIVATIES.map((g) => <option key={g.naam} value={g.naam}>{g.emoji} {g.naam}</option>)}
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

      <div className="mt-4 text-sm text-ink-2">{lijst.length} producties</div>
      {!lijst.length && <div className="mt-3"><Leeg>Geen aanbod met deze filters.</Leeg></div>}

      {weergave === 'kaarten' ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {lijst.slice(0, aantal).map((a) => {
            const m = matches.get(a.id)
            return (
              <article key={a.id} className="kaart verschijn group flex cursor-pointer flex-col p-5 transition hover:-translate-y-1 hover:shadow-[var(--shadow-hoog)]" onClick={() => toon(a.id)}>
                <div className="flex items-start gap-3">
                  <ScoreRing score={m?.score ?? 0} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-lg font-bold leading-snug">{a.titel}</h3>
                    <div className="text-sm text-ink-2">{a.impresariaat}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setStatus(a.id, a.status === 'Shortlist' ? 'Bekeken' : 'Shortlist') }}
                    className={cx('grid h-9 w-9 place-items-center rounded-full transition', a.status === 'Shortlist' ? 'bg-citroen text-amber-500' : 'bg-[#faf5ef] text-muted hover:text-amber-500')}
                    aria-label="Shortlist"
                  >
                    <Star size={17} fill={a.status === 'Shortlist' ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <GenreLabel genre={a.genre} klein />
                  <StatusLabel status={a.status} klein />
                  {a.premiere && <span className="rounded-full bg-snoep px-2 py-0.5 text-[11px] font-bold text-pink-700">Première</span>}
                  {m && !m.bekend && <span className="rounded-full bg-citroen px-2 py-0.5 text-[11px] font-bold text-amber-800">Nieuw voor ons</span>}
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-ink-2">{a.omschrijving}</p>
                <div className="mt-3 flex items-center gap-1">
                  {a.doelgroepen.map((d) => {
                    const s = segmentVan(DOELGROEPEN, d)
                    return s ? <span key={d} title={s.naam} className="grid h-7 w-7 place-items-center rounded-full text-sm ring-2 ring-white" style={{ background: s.kleur + '33' }}>{s.emoji}</span> : null
                  })}
                  <span className="ml-auto text-xs text-ink-2">{a.motivaties.map((x) => segmentVan(MOTIVATIES, x)?.emoji).join(' ')}</span>
                </div>
                {m && m.redenen[0] && <div className="mt-3 rounded-xl bg-munt/70 px-3 py-2 text-xs font-medium text-emerald-900">✨ {m.redenen.find((r) => r.type === 'plus')?.tekst ?? m.redenen[0].tekst}</div>}
                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-3 text-center text-xs">
                  <div><div className="text-muted">Uitkoop</div><div className="font-bold">{euro(a.uitkoopsom)}</div></div>
                  <div><div className="text-muted">Verwacht</div><div className="font-bold">{getal(a.verwacht)}</div></div>
                  <div><div className="text-muted">Data vrij</div><div className="font-bold">{m?.vrijeData.length ?? 0}/{a.beschikbareData.length}</div></div>
                </div>
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
                    <td className="px-3 py-2">{a.doelgroepen.map((d) => segmentVan(DOELGROEPEN, d)?.emoji).join(' ')}</td>
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
