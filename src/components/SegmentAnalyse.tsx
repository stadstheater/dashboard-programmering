import { Palette, Tray, Trophy } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import type { Voorstelling } from '../data/types'
import {
  DOELGROEPEN, DOELGROEP_GEWICHTEN, GENRE_FAMILIES, HOOFDGROEPEN, MOTIVATIES, MOTIVATIE_GEWICHTEN, donkerder, familieVan, isLicht, type Segment,
} from '../data/vocab'
import { staffel } from '../lib/animatie'
import { aandelen, actief, bereikPerDoelgroep, bereikPerMotivatie, getal, isVerleden, procent } from '../lib/calc'
import { useMatches, useSelectie } from '../lib/hooks'
import { useSeizoen, useStore } from '../store/useStore'
import { CdmLabel, GenreLabel, IcoonBol, PastBijOns, cx } from './ui'

type Soort = 'doelgroep' | 'motivatie'

/** Aandeel van één doelgroep of motivatie in een voorstelling (40/30/20/10 of 60/40, herschaald). */
function gewichtVoor(v: Voorstelling, naam: string, soort: Soort) {
  const lijst = soort === 'doelgroep' ? v.doelgroepen : v.motivaties
  const gew = soort === 'doelgroep' ? DOELGROEP_GEWICHTEN : MOTIVATIE_GEWICHTEN
  const i = lijst.indexOf(naam)
  if (i < 0) return 0
  const totaal = gew.slice(0, lijst.length).reduce((a, b) => a + b, 0)
  return gew[i] / totaal
}

export function oordeelVan(verschil: number) {
  return verschil < -1.5
    ? { tekst: 'Te weinig bereikt', klasse: 'bg-rose-50 text-rose-700' }
    : verschil > 1.5
      ? { tekst: 'Ruim bereikt', klasse: 'bg-emerald-50 text-emerald-700' }
      : { tekst: 'Op doel', klasse: 'bg-emerald-50 text-emerald-700' }
}

export default function SegmentAnalyse({ soort }: { soort: Soort }) {
  const doelen = useStore((s) => s.dataset.doelen)
  const alle = useStore((s) => s.dataset.voorstellingen)
  const aanbod = useStore((s) => s.dataset.aanbod)
  const lijst = useSeizoen()
  const toonV = useSelectie((s) => s.toonVoorstelling)
  const toonA = useSelectie((s) => s.toonAanbod)
  const matches = useMatches()
  const segmenten = soort === 'doelgroep' ? DOELGROEPEN : MOTIVATIES
  const doelMap = soort === 'doelgroep' ? doelen.doelgroepen : doelen.motivaties
  const bereik = soort === 'doelgroep' ? bereikPerDoelgroep : bereikPerMotivatie
  const [focus, setFocus] = useState<Segment>(segmenten[0])
  const groepen: { titel?: string; uitleg?: string; segmenten: Segment[] }[] =
    soort === 'doelgroep'
      ? HOOFDGROEPEN.map((h) => ({ titel: h.naam, uitleg: h.uitleg, segmenten: DOELGROEPEN.filter((d) => d.hoofdgroep === h.naam) }))
      : [{ segmenten: MOTIVATIES }]

  const aandeel = useMemo(() => aandelen(bereik(lijst)), [lijst, bereik])
  const verleden = useMemo(() => alle.filter((v) => actief(v) && isVerleden(v)), [alle])
  const toppers = useMemo(
    () =>
      verleden
        .filter((v) => (soort === 'doelgroep' ? v.doelgroepen.slice(0, 2) : v.motivaties.slice(0, 1)).includes(focus.naam))
        .sort((a, b) => Math.round((b.eindstand / b.capaciteit) * 50) - Math.round((a.eindstand / a.capaciteit) * 50) || b.eindstand - a.eindstand)
        .filter((v, i, arr) => arr.findIndex((x) => x.artiest === v.artiest) === i)
        .slice(0, 5),
    [verleden, focus, soort],
  )
  const seizoenen = Math.max(1, new Set(verleden.map((v) => v.seizoen)).size)
  const genresVoorFocus = GENRE_FAMILIES.map((f) => {
    const vs = verleden.filter((v) => familieVan(v.genre).naam === f.naam)
    return { naam: f.naam, kleur: f.kleur, bereik: vs.reduce((s, v) => s + v.eindstand * gewichtVoor(v, focus.naam, soort), 0) / seizoenen }
  }).filter((g) => g.bereik > 0).sort((a, b) => b.bereik - a.bereik).slice(0, 5)
  const aanbodVoorFocus = aanbod
    .filter((a) => a.status !== 'Afgewezen' && a.status !== 'Ingepland' && (soort === 'doelgroep' ? a.doelgroepen.slice(0, 2) : a.motivaties.slice(0, 1)).includes(focus.naam))
    .sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0))
    .slice(0, 5)

  return (
    <div>
      {groepen.map((g, gi) => (
        <div key={g.titel ?? 'alle'} className={cx(gi > 0 && 'mt-8')}>
          {g.titel && (
            <div className="mb-3 flex flex-wrap items-baseline gap-x-3">
              <h2 className="font-display text-xl font-extrabold">{g.titel}</h2>
              <span className="text-sm text-ink-2">{g.uitleg}</span>
            </div>
          )}
          <div data-uitleg={gi === 0 ? 'segmenten' : undefined} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {g.segmenten.map((s, i) => {
              const a = aandeel[s.naam] ?? 0
              const doel = doelMap[s.naam] ?? 0
              const oordeel = oordeelVan(a - doel)
              return (
                <button
                  key={s.naam}
                  onClick={() => setFocus(s)}
                  className={cx('kaart verschijn group p-5 text-left transition hover:-translate-y-0.5', focus.naam === s.naam && 'ring-2 ring-offset-2')}
                  style={{ ...staffel(gi * 4 + i), ...(focus.naam === s.naam ? ({ '--tw-ring-color': s.hoofdgroep ? donkerder(s.kleur, 0.85) : s.kleur } as React.CSSProperties) : {}) }}
                >
                  <div className="flex items-start gap-3">
                    <IcoonBol icoon={s.icoon} kleur={s.kleur} grootte={44} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 font-display font-bold leading-tight">{s.naam} {s.hoofdgroep && <CdmLabel segment={s} />}</div>
                      <p className="mt-1 line-clamp-2 text-xs text-ink-2">{s.omschrijving}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className={cx('rounded-full px-3 py-1 text-sm font-bold', oordeel.klasse)}>{oordeel.tekst}</span>
                    <span className="text-sm text-ink-2"><b className="text-ink">{Math.round(a)}%</b> · doel {doel}%</span>
                  </div>
                  <div className="relative mt-3 h-2.5 rounded-full bg-spoor">
                    <div className={cx('groei h-full rounded-full', isLicht(s.kleur) && 'ring-1 ring-inset ring-black/15')} style={{ width: `${Math.min(100, (a / Math.max(doel * 1.6, 1)) * 100)}%`, background: s.kleur, ...staffel(i) }} />
                    <div className="absolute -top-1 h-[18px] w-[3px] rounded-full bg-ink" style={{ left: `calc(${Math.min(100, (doel / Math.max(doel * 1.6, 1)) * 100)}% - 1px)` }} title={`Doel ${doel}%`} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div key={focus.naam} data-uitleg="spotlight" className="verschijn mt-8 rounded-3xl bg-oppervlak p-5 ring-1 ring-line sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <IcoonBol icoon={focus.icoon} kleur={focus.kleur} grootte={48} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-muted">Meer over</div>
            <h2 className="font-display flex flex-wrap items-center gap-2 text-2xl font-extrabold">{focus.naam} {focus.hoofdgroep && <CdmLabel segment={focus} groot />}</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-bold"><Trophy size={18} className="text-amber-500" /> Wat eerder goed werkte</h3>
            {!toppers.length && <p className="text-sm text-ink-2">Nog geen gespeelde voorstellingen voor deze groep.</p>}
            <ul className="space-y-1">
              {toppers.map((v) => (
                <li key={v.id}>
                  <button onClick={() => toonV(v.id)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-zacht">
                    <span className="w-11 shrink-0 rounded-lg bg-munt px-1 text-center text-xs font-bold text-emerald-800">{procent(v.eindstand / v.capaciteit)}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{v.titel}</span>
                    <span className="shrink-0 text-xs text-muted">{v.seizoen}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-bold"><Palette size={18} className="text-violet" /> Genres die deze groep trekken</h3>
            <div className="space-y-2">
              {genresVoorFocus.map((g, i) => (
                <div key={g.naam} className="flex items-center gap-2 text-sm" title={`${getal(g.bereik)} bezoeken per seizoen`}>
                  <span className="w-28 shrink-0 truncate">{g.naam}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-spoor"><div className="groei h-full rounded-full" style={{ width: `${(g.bereik / (genresVoorFocus[0].bereik || 1)) * 100}%`, background: g.kleur, ...staffel(i) }} /></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-bold"><Tray size={18} className="text-lucht" /> Passend aanbod</h3>
            {!aanbodVoorFocus.length && <p className="text-sm text-ink-2">Geen passend aanbod gevonden.</p>}
            <ul className="space-y-1">
              {aanbodVoorFocus.map((a) => (
                <li key={a.id}>
                  <button onClick={() => toonA(a.id)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-zacht">
                    <span className="min-w-0 flex-1 truncate font-medium">{a.titel}</span>
                    <GenreLabel genre={a.genre} klein />
                    <PastBijOns score={matches.get(a.id)?.score ?? 0} klein />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
