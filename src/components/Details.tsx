import { CalendarPlus, Check, CheckCircle, Eye, Lightning, MinusCircle, PencilSimple, Star, ThumbsDown } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { naarDatum } from '../data/generate'
import type { Zaal } from '../data/types'
import { DOELGROEPEN, DOELGROEP_GEWICHTEN, MOTIVATIES, segmentVan } from '../data/vocab'
import {
  bezetting, datumKort, datumLang, euro, getal, isVerleden, marge, procent, recette, verkochtTotNu, voorverkoopIndex,
} from '../lib/calc'
import { useArtiesten, useMatches, useSelectie } from '../lib/hooks'
import { MATCH_GEWICHTEN, OORDEEL_KLEUR, vindKannibalisatie } from '../lib/inzichten'
import { useStore } from '../store/useStore'
import { staffel } from '../lib/animatie'
import { GenreLabel, IcoonBol, Lade, ScoreRing, SegmentChip, StatusLabel, cx } from './ui'

function Feit({ label, waarde, sub }: { label: string; waarde: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-line">
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
  const artiesten = useArtiesten()
  const navigate = useNavigate()
  const v = alle.find((x) => x.id === id)
  const conflicten = useMemo(
    () => (v ? vindKannibalisatie(alle.filter((x) => x.seizoen === v.seizoen)).filter((c) => c.a.id === v.id || c.b.id === v.id) : []),
    [v, alle],
  )
  if (!v) return <Lade open={false} onSluit={() => toon(null)} titel="">{null}</Lade>
  const profiel = artiesten.find((p) => p.artiest === v.artiest)
  const verleden = isVerleden(v)
  const verkocht = verkochtTotNu(v)
  const index = voorverkoopIndex(v)
  return (
    <Lade open onSluit={() => toon(null)} titel={v.titel}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusLabel status={v.status} />
        <GenreLabel genre={v.genre} />
        {v.leeftijd && <span className="rounded-full bg-munt px-2.5 py-1 text-xs font-semibold">{v.leeftijd}</span>}
        <span className="rounded-full bg-lavendel px-2.5 py-1 text-xs font-semibold">Seizoen {v.seizoen}</span>
      </div>
      <p className="mt-3 text-ink-2">
        <b className="text-ink">{datumLang(v.datum)}</b> om {v.tijd} in de {v.zaal}
        <br />
        {v.artiest !== v.titel && <>{v.artiest} · </>}via {v.impresariaat}
      </p>

      <div className="mt-5 rounded-3xl bg-gradient-to-br from-ijs to-lavendel p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm font-semibold text-ink-2">{verleden ? 'Bezoekers (werkelijk)' : 'Verkocht tot nu'}</div>
            <div className="font-display text-4xl font-extrabold">{getal(verkocht)}<span className="text-lg text-ink-2"> / {getal(v.capaciteit)}</span></div>
          </div>
          <div className="text-right text-sm text-ink-2">
            Verwacht {getal(v.verwacht)}
            {index !== null && (
              <div className={cx('mt-1 rounded-full px-2 py-0.5 text-xs font-bold', index >= 1 ? 'bg-emerald-100 text-emerald-800' : index >= 0.85 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')}>
                {index >= 1 ? 'Loopt voor op schema' : index >= 0.85 ? 'Op schema' : 'Loopt achter'}
              </div>
            )}
          </div>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/70">
          <div className="h-full rounded-full bg-gradient-to-r from-lucht to-violet" style={{ width: `${Math.min(100, (verkocht / v.capaciteit) * 100)}%` }} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Feit label={verleden ? 'Bezetting' : 'Verw. bezetting'} waarde={procent(bezetting(v))} />
        <Feit label="Recette" waarde={euro(recette(v))} sub={`à ${euro(v.prijs)}`} />
        <Feit label="Uitkoopsom" waarde={euro(v.uitkoopsom)} />
        <Feit label="Saldo" waarde={<span className={marge(v) >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{euro(marge(v))}</span>} />
      </div>

      <h3 className="mt-6 mb-2 font-bold">Doelgroepen</h3>
      <div className="space-y-2">
        {v.doelgroepen.map((d, i) => {
          const s = segmentVan(DOELGROEPEN, d)
          if (!s) return null
          return (
            <div key={d} className="verschijn flex items-center gap-3" style={staffel(i + 2)}>
              <IcoonBol icoon={s.icoon} kleur={s.kleur} grootte={28} rond />
              <span className="flex-1 text-sm">{s.naam}</span>
              <div className="h-2 w-24 rounded-full bg-[#f6efe6]">
                <div className="groei h-full rounded-full" style={{ width: `${DOELGROEP_GEWICHTEN[i] * 250}%`, background: s.kleur, ...staffel(i + 2) }} />
              </div>
              <span className="w-10 text-right text-xs tabular-nums text-ink-2">{DOELGROEP_GEWICHTEN[i] * 100}%</span>
            </div>
          )
        })}
      </div>
      <h3 className="mt-5 mb-2 font-bold">Motivaties</h3>
      <div className="flex flex-wrap gap-2">
        {v.motivaties.map((m) => {
          const s = segmentVan(MOTIVATIES, m)
          return s ? <SegmentChip key={m} segment={s} /> : null
        })}
      </div>

      {conflicten.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-bold text-amber-900"><Lightning size={18} className="wip text-amber-600" /> Let op kannibalisatie</div>
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

      {profiel && (
        <div className="mt-6 rounded-2xl p-4" style={{ background: OORDEEL_KLEUR[profiel.oordeel].zacht }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold"><IcoonBol icoon={OORDEEL_KLEUR[profiel.oordeel].icoon} kleur={OORDEEL_KLEUR[profiel.oordeel].kleur} grootte={28} rond style={{ background: 'white' }} /> Artiestengeheugen: {profiel.oordeel}</div>
            <span className="text-sm text-ink-2">{profiel.gespeeld}x gespeeld</span>
          </div>
          <p className="mt-1 text-sm text-ink-2">
            {profiel.bezetting !== null ? `Gemiddeld ${procent(profiel.bezetting)} bezetting over ${profiel.seizoenen.length} seizoen(en). ` : ''}
            {profiel.advies}.
            {profiel.terugVanaf && ` Terugboeken vanaf ${datumKort(profiel.terugVanaf)} ${naarDatum(profiel.terugVanaf).getFullYear()}.`}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button className="knop knop-primair" onClick={() => { toon(null); navigate(`/builder?bewerk=${v.id}`) }}>
          <PencilSimple size={16} /> Bewerken
        </button>
        <button className="knop knop-zacht" onClick={() => { toon(null); navigate(`/artiesten?zoek=${encodeURIComponent(v.artiest)}`) }}>
          <Star size={16} /> Naar artiest
        </button>
      </div>
    </Lade>
  )
}

export function MatchUitleg({ aanbodId }: { aanbodId: string }) {
  const m = useMatches().get(aanbodId)
  if (!m) return null
  const delen: { sleutel: keyof typeof MATCH_GEWICHTEN; label: string; kleur: string }[] = [
    { sleutel: 'doelgroep', label: 'Doelgroepgat', kleur: '#2a78d6' },
    { sleutel: 'motivatie', label: 'Motivatiegat', kleur: '#e87ba4' },
    { sleutel: 'historie', label: 'Historisch succes', kleur: '#1baf7a' },
    { sleutel: 'kalender', label: 'Past in kalender', kleur: '#eda100' },
    { sleutel: 'financieel', label: 'Financieel', kleur: '#6250d6' },
  ]
  return (
    <div className="rounded-3xl bg-gradient-to-br from-munt to-ijs p-5">
      <div className="flex items-center gap-4">
        <ScoreRing score={m.score} grootte={72} />
        <div>
          <div className="font-display text-lg font-bold">Matchscore</div>
          <div className="text-sm text-ink-2">Hoe goed dit aanbod past bij seizoen 27/28, de doelen en onze historie.</div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {delen.map((d, i) => (
          <div key={d.sleutel} className="flex items-center gap-3 text-sm">
            <span className="w-36 shrink-0 text-ink-2">{d.label}</span>
            <div className="h-2.5 flex-1 rounded-full bg-white/70">
              <div className="groei h-full rounded-full" style={{ width: `${m.delen[d.sleutel] * 100}%`, background: d.kleur, ...staffel(i) }} />
            </div>
            <span className="w-14 text-right tabular-nums text-ink-2">{Math.round(m.delen[d.sleutel] * MATCH_GEWICHTEN[d.sleutel])}/{MATCH_GEWICHTEN[d.sleutel]}</span>
          </div>
        ))}
      </div>
      <ul className="mt-4 space-y-1 text-sm">
        {m.redenen.map((r, i) => (
          <li key={r.tekst} className="verschijn flex items-center gap-2" style={staffel(i + 4)}>
            {r.type === 'plus' ? <CheckCircle size={18} className="shrink-0 text-emerald-600" /> : <MinusCircle size={18} className="shrink-0 text-slate-400" />}
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
  const voegToe = useStore((s) => s.voegScenarioToe)
  const scenario = useStore((s) => s.scenario)
  const matches = useMatches()
  const [zaal, setZaal] = useState<Zaal | null>(null)
  if (!a) return <Lade open={false} onSluit={() => toon(null)} titel="">{null}</Lade>
  const m = matches.get(a.id)
  const gekozenZaal = zaal && a.zalen.includes(zaal) ? zaal : a.zalen[0]
  const inScenario = scenario.filter((s) => s.aanbodId === a.id).map((s) => s.datum)
  return (
    <Lade open onSluit={() => toon(null)} titel={a.titel} breed>
      <div className="flex flex-wrap items-center gap-2">
        <StatusLabel status={a.status} />
        <GenreLabel genre={a.genre} />
        {a.premiere && <span className="rounded-full bg-snoep px-2.5 py-1 text-xs font-bold text-pink-700">Première</span>}
        {m && !m.bekend && <span className="rounded-full bg-citroen px-2.5 py-1 text-xs font-bold text-amber-800">Nieuw in Zoetermeer</span>}
      </div>
      <p className="mt-3 text-ink-2">{a.omschrijving}</p>
      <p className="mt-2 text-sm text-ink-2">
        {a.artiest} via <b className="text-ink">{a.impresariaat}</b> · ontvangen {datumKort(a.ontvangen)}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Feit label="Uitkoopsom" waarde={euro(a.uitkoopsom)} />
        <Feit label="Prijsindicatie" waarde={euro(a.prijsIndicatie)} />
        <Feit label="Verwacht" waarde={getal(a.verwacht)} sub="bezoekers" />
        <Feit label="Duur" waarde={`${a.duur} min`} />
      </div>

      <div className="mt-5">
        <MatchUitleg aanbodId={a.id} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 font-bold">Doelgroepen</h3>
          <div className="flex flex-wrap gap-1.5">
            {a.doelgroepen.map((d) => {
              const s = segmentVan(DOELGROEPEN, d)
              return s ? <SegmentChip key={d} segment={s} klein /> : null
            })}
          </div>
        </div>
        <div>
          <h3 className="mb-2 font-bold">Motivaties</h3>
          <div className="flex flex-wrap gap-1.5">
            {a.motivaties.map((x) => {
              const s = segmentVan(MOTIVATIES, x)
              return s ? <SegmentChip key={x} segment={s} klein /> : null
            })}
          </div>
        </div>
      </div>

      <h3 className="mt-6 mb-1 font-bold">Beschikbare data</h3>
      <p className="mb-3 text-sm text-ink-2">
        Speelperiode {datumKort(a.periodeStart)} tot {datumKort(a.periodeEind)}. Klik een datum om hem in de seizoensbouwer te zetten.
      </p>
      {a.zalen.length > 1 && (
        <div className="mb-3 flex gap-2">
          {a.zalen.map((z) => (
            <button key={z} onClick={() => setZaal(z)} className={cx('rounded-full px-3 py-1 text-sm font-semibold', gekozenZaal === z ? 'bg-ink text-white' : 'bg-white ring-1 ring-line')}>{z}</button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {a.beschikbareData.map((d) => {
          const vrij = m?.vrijeData.includes(d)
          const gekozen = inScenario.includes(d)
          return (
            <button
              key={d}
              disabled={!vrij && !gekozen}
              onClick={() => voegToe({ aanbodId: a.id, datum: d, zaal: gekozenZaal })}
              className={cx(
                'flex items-center gap-1.5 rounded-2xl px-3 py-2 text-sm font-semibold transition',
                gekozen ? 'bg-violet text-white' : vrij ? 'bg-white ring-1 ring-line hover:-translate-y-0.5 hover:ring-violet' : 'cursor-not-allowed bg-slate-100 text-slate-400 line-through',
              )}
              title={vrij ? 'Vrij: klik om in te plannen' : 'Zaal is bezet'}
            >
              {gekozen ? <Check size={14} /> : <CalendarPlus size={14} />}
              {datumKort(d)}
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
        <button className="knop knop-zacht" onClick={() => setStatus(a.id, 'Shortlist')}><Star size={16} className="wip text-amber-500" /> Op shortlist</button>
        <button className="knop knop-zacht" onClick={() => setStatus(a.id, 'Bekeken')}><Eye size={16} /> Bekeken</button>
        <button className="knop knop-zacht" onClick={() => setStatus(a.id, 'Afgewezen')}><ThumbsDown size={16} className="text-rose-500" /> Afwijzen</button>
      </div>
    </Lade>
  )
}
