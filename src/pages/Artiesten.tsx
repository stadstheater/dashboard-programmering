import { ArrowDownRight, ArrowUpRight, Minus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GenreLabel, Kaart, KpiTegel, Paginakop, ScoreRing, Tabs, cx } from '../components/ui'
import { naarDatum } from '../data/generate'
import { GENRES, IMPRESARIATEN, SEIZOENEN } from '../data/vocab'
import { actief, datumKort, euroKort, getal, isVerleden, marge, procent, som, vandaag } from '../lib/calc'
import { useArtiesten, useMatches, useSelectie } from '../lib/hooks'
import { OORDEEL_KLEUR, type ArtiestProfiel, type Oordeel } from '../lib/inzichten'
import { useStore } from '../store/useStore'

function Trend({ t }: { t: number | null }) {
  if (t === null) return <span className="text-muted">·</span>
  if (t > 0.03) return <span className="inline-flex items-center text-emerald-700"><ArrowUpRight size={16} />{Math.round(t * 100)}</span>
  if (t < -0.03) return <span className="inline-flex items-center text-rose-700"><ArrowDownRight size={16} />{Math.round(Math.abs(t) * 100)}</span>
  return <span className="inline-flex items-center text-ink-2"><Minus size={14} /></span>
}

function OordeelLabel({ o }: { o: Oordeel }) {
  const k = OORDEEL_KLEUR[o]
  return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: k.zacht, color: k.kleur }}>{k.emoji} {o}</span>
}

function jaar(iso: string) {
  return `${datumKort(iso)} ${naarDatum(iso).getFullYear()}`
}

export default function Artiesten() {
  const profielen = useArtiesten()
  const aanbod = useStore((s) => s.dataset.aanbod)
  const alle = useStore((s) => s.dataset.voorstellingen)
  const matches = useMatches()
  const toonV = useSelectie((s) => s.toonVoorstelling)
  const toonA = useSelectie((s) => s.toonAanbod)
  const [params] = useSearchParams()
  const [zoek, setZoek] = useState(params.get('zoek') ?? '')
  const [oordeel, setOordeel] = useState<'Alle' | Oordeel>('Alle')
  const [genre, setGenre] = useState('')
  const [open, setOpen] = useState<string | null>(params.get('zoek'))
  const [tab, setTab] = useState<'artiesten' | 'impresariaten'>('artiesten')
  const peil = vandaag()

  const inAanbod = useMemo(() => new Map(aanbod.map((a) => [a.artiest, a])), [aanbod])
  const metHistorie = profielen.filter((p) => p.gespeeld > 0)
  const terugTeBoeken = metHistorie
    .filter((p) => (p.oordeel === 'Topper' || p.oordeel === 'Solide') && p.gespeeld >= 2 && !p.volgende && p.terugVanaf && p.terugVanaf <= '2028-06-30')
    .sort((a, b) => (b.bezetting ?? 0) * Math.min(b.gespeeld, 4) - (a.bezetting ?? 0) * Math.min(a.gespeeld, 4))

  const lijst = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    return profielen
      .filter((p) => (oordeel === 'Alle' || p.oordeel === oordeel) && (!genre || p.genre === genre) && (!q || `${p.artiest} ${p.impresariaat}`.toLowerCase().includes(q)))
      .sort((a, b) => b.gespeeld - a.gespeeld || (b.bezetting ?? 0) - (a.bezetting ?? 0))
      .slice(0, 120)
  }, [profielen, zoek, oordeel, genre])

  const impresariaten = useMemo(
    () =>
      IMPRESARIATEN.map((naam) => {
        const vs = alle.filter((v) => v.impresariaat === naam && actief(v) && isVerleden(v, peil))
        const ab = aanbod.filter((a) => a.impresariaat === naam)
        const scores = ab.map((a) => matches.get(a.id)?.score ?? 0)
        return {
          naam,
          gespeeld: vs.length,
          bezetting: vs.length ? som(vs, (v) => v.eindstand) / som(vs, (v) => v.capaciteit) : 0,
          saldo: som(vs, (v) => marge(v, peil)),
          aanbod: ab.length,
          shortlist: ab.filter((a) => a.status === 'Shortlist' || a.status === 'Ingepland').length,
          match: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        }
      }).sort((a, b) => b.gespeeld - a.gespeeld),
    [alle, aanbod, matches, peil],
  )

  const tel = (o: Oordeel) => metHistorie.filter((p) => p.oordeel === o).length

  return (
    <div>
      <Paginakop titel="Artiestengeheugen" emoji="🌟" sub="Wie speelde er wanneer, hoe liep het en wanneer is het weer tijd? Met terugboekadvies per artiest en een scorekaart per impresariaat.">
        <Tabs waarde={tab} onChange={setTab} opties={[{ id: 'artiesten', label: '🎤 Artiesten' }, { id: 'impresariaten', label: '🏢 Impresariaten' }]} />
      </Paginakop>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiTegel label="Artiesten met historie" waarde={getal(metHistorie.length)} icoon="🎤" kleur="lavendel" />
        <KpiTegel label="Toppers" waarde={getal(tel('Topper'))} sub="85% bezetting of meer" icoon="🏆" kleur="munt" />
        <KpiTegel label="Solide" waarde={getal(tel('Solide'))} sub="70 tot 85%" icoon="👍" kleur="ijs" />
        <KpiTegel label="Risico" waarde={getal(tel('Risico'))} sub="onder 50%" icoon="⚠️" kleur="perzik" />
        <KpiTegel label="Klaar om terug te boeken" waarde={getal(terugTeBoeken.length)} sub="toppers en solide, nog niet geboekt" icoon="🔁" kleur="citroen" />
      </div>

      {tab === 'artiesten' ? (
        <>
          <Kaart className="mt-6" titel="🔁 Tijd voor een terugkeer" sub="Sterke artiesten zonder nieuwe boeking, waarvan het terugboekmoment voor eind seizoen 27/28 valt">
            <div className="dun-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
              {terugTeBoeken.slice(0, 14).map((p) => {
                const a = inAanbod.get(p.artiest)
                return (
                  <button key={p.artiest} onClick={() => { setZoek(p.artiest); setOpen(p.artiest) }} className="w-60 shrink-0 rounded-2xl bg-gradient-to-br from-white to-[#fff7ef] p-4 text-left ring-1 ring-line transition hover:-translate-y-1 hover:shadow-md">
                    <div className="flex items-center justify-between"><OordeelLabel o={p.oordeel} /><span className="font-display text-xl font-extrabold">{procent(p.bezetting ?? 0)}</span></div>
                    <div className="mt-2 truncate font-bold">{p.artiest}</div>
                    <div className="text-xs text-ink-2">{p.genre} · {p.gespeeld}x gespeeld</div>
                    <div className="mt-2 text-xs text-ink-2">Terug vanaf <b className="text-ink">{p.terugVanaf && jaar(p.terugVanaf)}</b></div>
                    {a && <div className="mt-2 rounded-lg bg-munt px-2 py-1 text-[11px] font-bold text-emerald-800">📬 Zit in het aanbod 27/28</div>}
                  </button>
                )
              })}
            </div>
          </Kaart>

          <Kaart className="mt-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-56 flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input className="invoer !rounded-full !pl-9" placeholder="Zoek artiest of impresariaat" value={zoek} onChange={(e) => setZoek(e.target.value)} />
              </div>
              <select className="invoer !w-auto !rounded-full" value={genre} onChange={(e) => setGenre(e.target.value)}>
                <option value="">Alle genres</option>
                {GENRES.map((g) => <option key={g}>{g}</option>)}
              </select>
              <Tabs<'Alle' | Oordeel> waarde={oordeel} onChange={setOordeel} opties={(['Alle', 'Topper', 'Solide', 'Twijfel', 'Risico', 'Onbekend'] as const).map((o) => ({ id: o, label: o === 'Alle' ? 'Alle' : `${OORDEEL_KLEUR[o].emoji} ${o}` }))} />
            </div>
            <div className="dun-scroll overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-ink-2">
                  <tr className="border-b border-line">
                    <th className="px-3 py-2">Artiest</th><th className="px-3 py-2">Genre</th><th className="px-3 py-2">Seizoenen</th><th className="px-3 py-2 text-right">Gespeeld</th>
                    <th className="px-3 py-2">Bezetting</th><th className="px-3 py-2">Trend</th><th className="px-3 py-2">Oordeel</th><th className="px-3 py-2">Terug vanaf</th>
                  </tr>
                </thead>
                <tbody>
                  {lijst.map((p) => (
                    <ArtiestRij key={p.artiest} p={p} open={open === p.artiest} onToggle={() => setOpen(open === p.artiest ? null : p.artiest)} onVoorstelling={toonV} aanbodId={inAanbod.get(p.artiest)?.id} onAanbod={toonA} />
                  ))}
                </tbody>
              </table>
            </div>
          </Kaart>
        </>
      ) : (
        <Kaart className="mt-6" titel="Scorekaart impresariaten" sub="Historische prestaties en de kwaliteit van het huidige aanbod">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {impresariaten.map((i) => (
              <div key={i.naam} className="rounded-3xl bg-gradient-to-br from-white to-[#fff7ef] p-5 ring-1 ring-line">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-lg font-bold leading-tight">{i.naam}</div>
                    <div className="text-xs text-ink-2">{i.gespeeld} voorstellingen gespeeld</div>
                  </div>
                  <ScoreRing score={Math.round(i.match)} grootte={50} />
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-ink-2"><span>Gem. bezetting</span><b className="text-ink">{procent(i.bezetting)}</b></div>
                  <div className="h-2.5 rounded-full bg-[#f6efe6]"><div className="h-full rounded-full bg-gradient-to-r from-mint to-lucht" style={{ width: `${i.bezetting * 100}%` }} /></div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-white p-2 ring-1 ring-line"><div className="text-muted">Saldo</div><div className="font-bold">{euroKort(i.saldo)}</div></div>
                  <div className="rounded-xl bg-white p-2 ring-1 ring-line"><div className="text-muted">Aanbod</div><div className="font-bold">{i.aanbod}</div></div>
                  <div className="rounded-xl bg-white p-2 ring-1 ring-line"><div className="text-muted">Shortlist</div><div className="font-bold">{i.shortlist}</div></div>
                </div>
                <div className="mt-2 text-[11px] text-muted">De ring toont de gemiddelde matchscore van hun aanbod.</div>
              </div>
            ))}
          </div>
        </Kaart>
      )}
    </div>
  )
}

function ArtiestRij({ p, open, onToggle, onVoorstelling, aanbodId, onAanbod }: {
  p: ArtiestProfiel
  open: boolean
  onToggle: () => void
  onVoorstelling: (id: string) => void
  aanbodId?: string
  onAanbod: (id: string) => void
}) {
  return (
    <>
      <tr onClick={onToggle} className={cx('cursor-pointer border-b border-line/60 transition hover:bg-[#fff6ee]', open && 'bg-[#fff6ee]')}>
        <td className="px-3 py-2.5">
          <div className="font-semibold">{p.artiest}</div>
          <div className="text-xs text-ink-2">{p.impresariaat}</div>
        </td>
        <td className="px-3 py-2.5"><GenreLabel genre={p.genre} klein /></td>
        <td className="px-3 py-2.5">
          <div className="flex gap-1">
            {SEIZOENEN.map((s) => (
              <span key={s} title={s} className={cx('h-3.5 w-3.5 rounded-full', p.seizoenen.includes(s) ? 'bg-violet' : 'bg-[#efe7dc]')} />
            ))}
          </div>
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums">{p.gespeeld}</td>
        <td className="px-3 py-2.5">
          {p.bezetting !== null ? (
            <div className="flex w-36 items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-[#f6efe6]"><div className="h-full rounded-full" style={{ width: `${p.bezetting * 100}%`, background: OORDEEL_KLEUR[p.oordeel].kleur }} /></div>
              <span className="w-9 tabular-nums text-ink-2">{procent(p.bezetting)}</span>
            </div>
          ) : <span className="text-muted">nog niet gespeeld</span>}
        </td>
        <td className="px-3 py-2.5"><Trend t={p.trend} /></td>
        <td className="px-3 py-2.5"><OordeelLabel o={p.oordeel} /></td>
        <td className="whitespace-nowrap px-3 py-2.5 text-ink-2">{p.volgende ? <span className="font-semibold text-emerald-700">Geboekt {datumKort(p.volgende)}</span> : p.terugVanaf ? jaar(p.terugVanaf) : '·'}</td>
      </tr>
      {open && (
        <tr className="bg-[#fffaf5]">
          <td colSpan={8} className="px-3 py-4">
            <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
              <div>
                <div className="font-bold">Advies</div>
                <p className="text-sm text-ink-2">{p.advies}.</p>
                <div className="mt-3 flex items-end gap-2">
                  {p.bezettingPerSeizoen.map((b) => (
                    <div key={b.seizoen} className="flex flex-col items-center gap-1" title={`${b.seizoen}: ${procent(b.bezetting)}`}>
                      <span className="text-[10px] font-semibold text-ink-2">{procent(b.bezetting)}</span>
                      <div className="w-8 rounded-t-md bg-gradient-to-t from-violet to-roze" style={{ height: `${Math.max(6, b.bezetting * 70)}px` }} />
                      <span className="text-[10px] text-muted">{b.seizoen}</span>
                    </div>
                  ))}
                </div>
                {aanbodId && <button onClick={() => onAanbod(aanbodId)} className="knop knop-zacht mt-4">📬 Bekijk aanbod 27/28</button>}
              </div>
              <div>
                <div className="mb-1 font-bold">Alle voorstellingen ({p.voorstellingen.length})</div>
                <div className="dun-scroll max-h-56 space-y-1 overflow-y-auto">
                  {p.voorstellingen.map((v) => (
                    <button key={v.id} onClick={() => onVoorstelling(v.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left text-xs hover:bg-white">
                      <span className="w-24 shrink-0 text-ink-2">{jaar(v.datum)}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{v.titel}</span>
                      <span className="shrink-0 text-ink-2">{v.zaal}</span>
                      <span className="w-20 shrink-0 text-right tabular-nums">{actief(v) ? (isVerleden(v) ? `${getal(v.eindstand)} bez.` : `verw. ${getal(v.verwacht)}`) : 'geannuleerd'}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
