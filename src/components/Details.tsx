import { CalendarPlus, Check, CheckCircle, Lightning, MinusCircle, Star, ThumbsDown, Trash } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import type { Zaal } from '../data/types'
import { DOELGROEPEN, DOELGROEP_GEWICHTEN, MOTIVATIES, segmentVan } from '../data/vocab'
import { staffel } from '../lib/animatie'
import {
  actief, bezetting, datumKort, datumLang, euro, getal, isVerleden, marge, procent, recette, vandaag, verkochtTotNu,
} from '../lib/calc'
import { useArtiesten, useMatches, useSelectie } from '../lib/hooks'
import { vindKannibalisatie } from '../lib/inzichten'
import { useStore } from '../store/useStore'
import { CdmLabel, GenreLabel, Lade, PastBijOns, SegmentChip, StatusLabel, cx } from './ui'

function Feit({ label, waarde, sub }: { label: string; waarde: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-oppervlak p-3 ring-1 ring-line">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="font-display mt-0.5 text-lg font-bold">{waarde}</div>
      {sub && <div className="text-xs text-ink-2">{sub}</div>}
    </div>
  )
}

export function VoorstellingLade() {
  const id = useSelectie((s) => s.voorstellingId)
  const toon = useSelectie((s) => s.toonVoorstelling)
  const alle = useStore((s) => s.dataset.voorstellingen)
  const verwijder = useStore((s) => s.verwijderVoorstelling)
  const artiesten = useArtiesten()
  const v = alle.find((x) => x.id === id)
  const conflicten = useMemo(
    () => (v ? vindKannibalisatie(alle.filter((x) => x.seizoen === v.seizoen)).filter((c) => c.a.id === v.id || c.b.id === v.id) : []),
    [v, alle],
  )
  if (!v) return <Lade open={false} onSluit={() => toon(null)} titel="">{null}</Lade>
  const profiel = artiesten.find((p) => p.artiest === v.artiest)
  const verleden = isVerleden(v)
  const inVerkoop = !['Optie', 'Concept'].includes(v.status)
  const verkocht = verkochtTotNu(v)
  const eigenOptie = v.bron === 'builder' && !verleden
  const totaalGewicht = DOELGROEP_GEWICHTEN.slice(0, v.doelgroepen.length).reduce((a, b) => a + b, 0)
  return (
    <Lade open onSluit={() => toon(null)} titel={v.titel}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusLabel status={v.status} />
        <GenreLabel genre={v.genre} />
        {v.leeftijd && <span className="rounded-full bg-munt px-2.5 py-1 text-xs font-semibold">{v.leeftijd}</span>}
      </div>
      <p className="mt-3 text-ink-2">
        <b className="text-ink">{datumLang(v.datum)}</b> om {v.tijd} in de {v.zaal}
        <br />
        {v.artiest !== v.titel && <>{v.artiest} · </>}via {v.impresariaat}
      </p>

      <div className="mt-5 rounded-3xl bg-gradient-to-br from-ijs to-lavendel p-5">
        {inVerkoop || verleden ? (
          <>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-sm font-semibold text-ink-2">{verleden ? 'Bezoekers' : 'Kaarten verkocht'}</div>
                <div className="font-display text-4xl font-extrabold">{getal(verkocht)}<span className="text-lg text-ink-2"> / {getal(v.capaciteit)}</span></div>
              </div>
              <div className="text-right text-sm text-ink-2">Verwacht {getal(v.verwacht)}</div>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-oppervlak/70">
              <div className="h-full rounded-full bg-gradient-to-r from-lucht to-violet" style={{ width: `${Math.min(100, (verkocht / v.capaciteit) * 100)}%` }} />
            </div>
          </>
        ) : (
          <div>
            <div className="text-sm font-semibold text-ink-2">Nog niet in de verkoop</div>
            <div className="font-display text-2xl font-extrabold">Verwacht {getal(v.verwacht)} bezoekers</div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Feit label={verleden ? 'Zaal vol' : 'Verwacht vol'} waarde={procent(bezetting(v))} />
        <Feit label="Kaartverkoop" waarde={euro(recette(v))} sub={`à ${euro(v.prijs)}`} />
        <Feit label="Kosten artiest" waarde={euro(v.uitkoopsom)} />
        <Feit label="Wat we overhouden" waarde={<span className={marge(v) >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{euro(marge(v))}</span>} />
      </div>

      <h3 className="mt-6 mb-2 font-bold">Publiek</h3>
      <div className="space-y-2">
        {v.doelgroepen.map((d, i) => {
          const s = segmentVan(DOELGROEPEN, d)
          if (!s) return null
          const aandeel = DOELGROEP_GEWICHTEN[i] / totaalGewicht
          return (
            <div key={d} className="verschijn flex items-center gap-3" style={staffel(i + 2)}>
              <span className="flex min-w-0 flex-1 items-center gap-2 text-sm"><CdmLabel segment={s} /> <span className="truncate">{s.naam}</span></span>
              <div className="h-2 w-24 rounded-full bg-spoor">
                <div className="groei h-full rounded-full" style={{ width: `${aandeel * 100}%`, background: s.kleur, ...staffel(i + 2) }} />
              </div>
              <span className="w-10 text-right text-xs tabular-nums text-ink-2">{Math.round(aandeel * 100)}%</span>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {v.motivaties.map((m) => {
          const s = segmentVan(MOTIVATIES, m)
          return s ? <SegmentChip key={m} segment={s} /> : null
        })}
      </div>

      {conflicten.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-bold text-amber-900"><Lightning size={18} className="text-amber-600" /> Lijkt op een voorstelling vlakbij</div>
          <ul className="mt-2 space-y-1 text-sm text-amber-900">
            {conflicten.map((c) => {
              const ander = c.a.id === v.id ? c.b : c.a
              return (
                <li key={ander.id}>
                  <button className="font-semibold underline decoration-dotted" onClick={() => toon(ander.id)}>{ander.titel}</button> op {datumKort(ander.datum)}: {c.reden.toLowerCase()}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {profiel && profiel.gespeeld > 0 && profiel.bezetting !== null && (
        <p className="mt-6 rounded-2xl bg-vlak p-4 text-sm text-ink-2 ring-1 ring-line">
          <b className="text-ink">Eerder bij ons:</b> {profiel.gespeeld}x gespeeld, gemiddeld {procent(profiel.bezetting)} vol.
        </p>
      )}

      {eigenOptie && (
        <div className="mt-6 border-t border-line pt-5">
          <button className="knop knop-zacht text-rose-700" onClick={() => { if (confirm(`"${v.titel}" uit de kalender halen?`)) { verwijder(v.id); toon(null) } }}>
            <Trash size={16} /> Optie verwijderen
          </button>
        </div>
      )}
    </Lade>
  )
}

export function MatchUitleg({ aanbodId }: { aanbodId: string }) {
  const m = useMatches().get(aanbodId)
  if (!m) return null
  return (
    <div className="rounded-3xl bg-gradient-to-br from-munt to-ijs p-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="font-display text-lg font-bold">Past dit bij ons?</div>
        <PastBijOns score={m.score} />
      </div>
      <ul className="mt-3 space-y-1.5 text-[15px]">
        {m.redenen.map((r, i) => (
          <li key={r.tekst} className="verschijn flex items-center gap-2" style={staffel(i + 1)}>
            {r.type === 'plus' ? <CheckCircle size={20} className="shrink-0 text-emerald-600" /> : <MinusCircle size={20} className="shrink-0 text-muted" />}
            <span>{r.tekst}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function AanbodLade() {
  const id = useSelectie((s) => s.aanbodId)
  const toon = useSelectie((s) => s.toonAanbod)
  const a = useStore((s) => s.dataset.aanbod.find((x) => x.id === id))
  const setStatus = useStore((s) => s.setAanbodStatus)
  const zetOptie = useStore((s) => s.zetOptie)
  const voorstellingen = useStore((s) => s.dataset.voorstellingen)
  const matches = useMatches()
  const [zaal, setZaal] = useState<Zaal | null>(null)
  const bezet = useMemo(() => new Set(voorstellingen.filter(actief).map((v) => `${v.datum}|${v.zaal}`)), [voorstellingen])
  if (!a) return <Lade open={false} onSluit={() => toon(null)} titel="">{null}</Lade>
  const m = matches.get(a.id)
  const gekozenZaal = zaal && a.zalen.includes(zaal) ? zaal : a.zalen[0]
  const peil = vandaag()
  return (
    <Lade open onSluit={() => toon(null)} titel={a.titel} breed>
      <div className="flex flex-wrap items-center gap-2">
        <GenreLabel genre={a.genre} />
        {a.premiere && <span className="rounded-full bg-snoep px-2.5 py-1 text-xs font-bold text-pink-700">Première</span>}
        {m && !m.bekend && <span className="rounded-full bg-citroen px-2.5 py-1 text-xs font-bold text-amber-800">Nieuw voor ons</span>}
      </div>
      <p className="mt-3 text-ink-2">{a.omschrijving}</p>
      <p className="mt-2 text-sm text-ink-2">
        {a.artiest} via <b className="text-ink">{a.impresariaat}</b>
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Feit label="Kosten artiest" waarde={euro(a.uitkoopsom)} />
        <Feit label="Kaartprijs" waarde={euro(a.prijsIndicatie)} />
        <Feit label="Verwacht" waarde={getal(a.verwacht)} sub="bezoekers" />
        <Feit label="Duur" waarde={`${a.duur} min`} />
      </div>

      <div className="mt-5">
        <MatchUitleg aanbodId={a.id} />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {a.doelgroepen.map((d) => <CdmLabel key={d} naam={d} groot />)}
        {a.motivaties.map((x) => {
          const s = segmentVan(MOTIVATIES, x)
          return s ? <SegmentChip key={x} segment={s} klein /> : null
        })}
      </div>

      <h3 className="mt-6 mb-1 font-bold">Inplannen</h3>
      <p className="mb-3 text-sm text-ink-2">Kies een vrije datum. De voorstelling komt dan als <b className="text-ink">optie</b> in de kalender.</p>
      {a.zalen.length > 1 && (
        <div className="mb-3 flex gap-2">
          {a.zalen.map((z) => (
            <button key={z} onClick={() => setZaal(z)} className={cx('rounded-full px-3 py-1 text-sm font-semibold', gekozenZaal === z ? 'bg-ink text-op-ink' : 'bg-oppervlak ring-1 ring-line')}>{z}</button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {a.beschikbareData.map((d) => {
          const gekozen = voorstellingen.some((v) => v.id === `o-${a.id}-${d}`)
          const voorbij = d < peil
          const vrij = !voorbij && !bezet.has(`${d}|${gekozenZaal}`)
          return (
            <button
              key={d}
              disabled={!vrij || gekozen}
              onClick={() => zetOptie(a.id, d, gekozenZaal)}
              className={cx(
                'flex items-center gap-1.5 rounded-2xl px-4 py-3 text-[15px] font-semibold transition',
                gekozen ? 'bg-violet text-white' : vrij ? 'bg-oppervlak ring-1 ring-line hover:-translate-y-0.5 hover:ring-violet' : 'cursor-not-allowed bg-vlak text-muted line-through',
              )}
              title={gekozen ? 'Staat als optie in de kalender' : vrij ? `Vrij: klik om in te plannen in de ${gekozenZaal}` : voorbij ? 'Deze datum is voorbij' : `De ${gekozenZaal} is dan bezet`}
            >
              {gekozen ? <Check size={18} className="spring" /> : <CalendarPlus size={18} />}
              {gekozen ? `Optie op ${datumKort(d)}` : datumKort(d)}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
        <button className="knop knop-zacht" onClick={() => setStatus(a.id, 'Shortlist')}><Star size={16} className="text-amber-500" /> Bewaren</button>
        <button className="knop knop-zacht" onClick={() => setStatus(a.id, 'Afgewezen')}><ThumbsDown size={16} className="text-rose-500" /> Niet interessant</button>
      </div>
    </Lade>
  )
}
