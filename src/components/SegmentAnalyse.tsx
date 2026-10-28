import { useMemo, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import type { Voorstelling } from '../data/types'
import {
  DOELGROEPEN, DOELGROEP_GEWICHTEN, GENRE_FAMILIES, MOTIVATIES, MOTIVATIE_GEWICHTEN, SEIZOENEN, familieVan, type Segment,
} from '../data/vocab'
import {
  MAANDNAMEN, SEIZOENSMAANDEN, aandelen, actief, bereikPerDoelgroep, bereikPerMotivatie, bezoekers, datumKort, getal,
  isVerleden, maandVan, procent,
} from '../lib/calc'
import { useMatches, useSelectie } from '../lib/hooks'
import { useSeizoen, useStore } from '../store/useStore'
import { Legenda, Matrix, TipKaart } from './charts'
import { Palette, Trophy, Tray } from '@phosphor-icons/react'
import { staffel } from '../lib/animatie'
import { GenreLabel, IcoonBol, Kaart, ScoreRing, cx } from './ui'

type Soort = 'doelgroep' | 'motivatie'

function Sparkline({ waarden, kleur, doel }: { waarden: number[]; kleur: string; doel: number }) {
  const b = 150
  const h = 40
  const max = Math.max(...waarden, doel) * 1.15 || 1
  const pt = (v: number, i: number) => `${(i / Math.max(1, waarden.length - 1)) * (b - 8) + 4},${h - 4 - (v / max) * (h - 8)}`
  return (
    <svg width={b} height={h} className="overflow-visible" aria-hidden>
      <line x1={4} x2={b - 4} y1={h - 4 - (doel / max) * (h - 8)} y2={h - 4 - (doel / max) * (h - 8)} stroke="#1d1b2f" strokeDasharray="3 3" strokeOpacity={0.35} />
      <polyline points={waarden.map(pt).join(' ')} fill="none" stroke={kleur} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {waarden.map((v, i) => {
        const [x, y] = pt(v, i).split(',').map(Number)
        return <circle key={i} cx={x} cy={y} r={i === waarden.length - 1 ? 4 : 2.5} fill={kleur} stroke="#fff" strokeWidth={1.5} />
      })}
    </svg>
  )
}

function gewichtVoor(v: Voorstelling, naam: string, soort: Soort) {
  const lijst = soort === 'doelgroep' ? v.doelgroepen : v.motivaties
  const gew = soort === 'doelgroep' ? DOELGROEP_GEWICHTEN : MOTIVATIE_GEWICHTEN
  const i = lijst.indexOf(naam)
  if (i < 0) return 0
  const totaal = gew.slice(0, lijst.length).reduce((a, b) => a + b, 0)
  return gew[i] / totaal
}

export default function SegmentAnalyse({ soort }: { soort: Soort }) {
  const seizoen = useStore((s) => s.seizoen)
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

  const aandeel = useMemo(() => aandelen(bereik(lijst)), [lijst, bereik])
  const absoluut = useMemo(() => bereik(lijst), [lijst, bereik])
  const trend = useMemo(
    () => SEIZOENEN.map((s) => aandelen(bereik(alle.filter((v) => v.seizoen === s)))),
    [alle, bereik],
  )

  const perFamilie = (naam: string, fam: string) =>
    lijst.filter((v) => actief(v) && familieVan(v.genre).naam === fam).reduce((s, v) => s + bezoekers(v) * gewichtVoor(v, naam, soort), 0)
  const perMaand = (naam: string, maand: string) =>
    lijst.filter((v) => actief(v) && MAANDNAMEN[maandVan(v.datum)] === maand).reduce((s, v) => s + bezoekers(v) * gewichtVoor(v, naam, soort), 0)

  const verleden = useMemo(() => alle.filter((v) => actief(v) && isVerleden(v)), [alle])
  const toppers = useMemo(
    () =>
      verleden
        .filter((v) => (soort === 'doelgroep' ? v.doelgroepen.slice(0, 2) : v.motivaties.slice(0, 1)).includes(focus.naam))
        .sort((a, b) => Math.round((b.eindstand / b.capaciteit) * 50) - Math.round((a.eindstand / a.capaciteit) * 50) || b.eindstand - a.eindstand)
        .filter((v, i, arr) => arr.findIndex((x) => x.artiest === v.artiest) === i)
        .slice(0, 6),
    [verleden, focus, soort],
  )
  const genresVoorFocus = GENRE_FAMILIES.map((f) => {
    const vs = verleden.filter((v) => familieVan(v.genre).naam === f.naam && gewichtVoor(v, focus.naam, soort) > 0)
    return { naam: f.naam, kleur: f.kleur, bereik: vs.reduce((s, v) => s + v.eindstand * gewichtVoor(v, focus.naam, soort), 0) / Math.max(1, new Set(verleden.map((v) => v.seizoen)).size) }
  }).sort((a, b) => b.bereik - a.bereik)
  const aanbodVoorFocus = aanbod
    .filter((a) => a.status !== 'Afgewezen' && (soort === 'doelgroep' ? a.doelgroepen.slice(0, 2) : a.motivaties.slice(0, 1)).includes(focus.naam))
    .sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0))
    .slice(0, 5)

  const bezettingPerSegment = segmenten.map((s) => {
    const vs = verleden.filter((v) => gewichtVoor(v, s.naam, soort) > 0)
    const w = vs.reduce((t, v) => t + gewichtVoor(v, s.naam, soort), 0)
    return { naam: s.kort, voluit: s.naam, kleur: s.kleur, Bezetting: w ? (vs.reduce((t, v) => t + (v.eindstand / v.capaciteit) * gewichtVoor(v, s.naam, soort), 0) / w) * 100 : 0 }
  })

  return (
    <div>
      <div data-uitleg="segmenten" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {segmenten.map((s, i) => {
          const a = aandeel[s.naam] ?? 0
          const doel = doelMap[s.naam] ?? 0
          const verschil = a - doel
          const index = soort === 'doelgroep' && s.marktaandeel ? Math.round((a / s.marktaandeel) * 100) : null
          return (
            <button
              key={s.naam}
              onClick={() => setFocus(s)}
              className={cx('kaart verschijn group p-5 text-left transition hover:-translate-y-1 hover:shadow-[var(--shadow-hoog)]', focus.naam === s.naam && 'ring-2 ring-offset-2')}
              style={{ ...staffel(i), ...(focus.naam === s.naam ? ({ '--tw-ring-color': s.kleur } as React.CSSProperties) : {}) }}
            >
              <div className="flex items-start gap-3">
                <IcoonBol icoon={s.icoon} kleur={s.kleur} grootte={48} className="transition duration-300 group-hover:scale-110 group-hover:rotate-6" />
                <div className="min-w-0">
                  <div className="font-display font-bold leading-tight">{s.naam}</div>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-2">{s.omschrijving}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between gap-2">
                <div>
                  <div className="font-display text-3xl font-extrabold">{a.toFixed(1).replace('.', ',')}%</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
                    doel {doel}%
                    <span className={cx('rounded-full px-1.5 py-0.5 font-bold', Math.abs(verschil) < 1.5 ? 'bg-slate-100 text-slate-600' : verschil > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                      {verschil > 0 ? '+' : ''}{verschil.toFixed(1).replace('.', ',')}
                    </span>
                    {index !== null && <span className={cx('rounded-full px-1.5 py-0.5 font-bold', index >= 100 ? 'bg-ijs text-sky-800' : 'bg-perzik text-orange-800')} title="Index: ons aandeel ten opzichte van het aandeel in het verzorgingsgebied">index {index}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <Sparkline waarden={trend.map((t) => t[s.naam] ?? 0)} kleur={s.kleur} doel={doel} />
                  <div className="text-[10px] text-muted">22/23 tot 27/28</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-ink-2">≈ {getal(absoluut[s.naam] ?? 0)} bezoeken dit seizoen</div>
            </button>
          )
        })}
      </div>

      <div key={focus.naam} data-uitleg="spotlight" className="verschijn mt-6 rounded-3xl p-[2px]" style={{ background: `linear-gradient(135deg, ${focus.kleur}, #ffffff00 70%)` }}>
        <div className="rounded-[22px] bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <IcoonBol icoon={focus.icoon} kleur={focus.kleur} grootte={56} className="plop" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-muted">In de spotlight</div>
              <h2 className="font-display text-2xl font-extrabold">{focus.naam}</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-6 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-bold"><Trophy size={18} className="text-amber-500" /> Wat werkte in het verleden</h3>
              <ul className="space-y-1.5">
                {toppers.map((v, i) => (
                  <li key={v.id} className="verschijn" style={staffel(i + 1)}>
                    <button onClick={() => toonV(v.id)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-[#fff6ee]">
                      <span className="w-10 shrink-0 rounded-lg bg-munt px-1 text-center text-xs font-bold text-emerald-800">{procent(v.eindstand / v.capaciteit)}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{v.titel}</span>
                      <span className="shrink-0 text-xs text-muted">{v.seizoen}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-bold"><Palette size={18} className="text-violet" /> Genres die deze groep bereiken</h3>
              <div className="space-y-2">
                {genresVoorFocus.slice(0, 6).map((g, i) => (
                  <div key={g.naam} className="flex items-center gap-2 text-sm" title={`${getal(g.bereik)} bezoeken per seizoen`}>
                    <span className="w-28 shrink-0 truncate">{g.naam}</span>
                    <div className="h-2.5 flex-1 rounded-full bg-[#f6efe6]"><div className="groei h-full rounded-full" style={{ width: `${(g.bereik / (genresVoorFocus[0].bereik || 1)) * 100}%`, background: g.kleur, ...staffel(i) }} /></div>
                    <span className="w-12 text-right text-xs tabular-nums text-ink-2">{getal(g.bereik)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">Gemiddeld aantal bezoeken per seizoen</p>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-bold"><Tray size={18} className="text-lucht" /> Passend aanbod 27/28</h3>
              <ul className="space-y-1.5">
                {aanbodVoorFocus.map((a, i) => (
                  <li key={a.id} className="verschijn" style={staffel(i + 1)}>
                    <button onClick={() => toonA(a.id)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-[#fff6ee]">
                      <ScoreRing score={matches.get(a.id)?.score ?? 0} grootte={34} />
                      <span className="min-w-0 flex-1 truncate font-medium">{a.titel}</span>
                      <GenreLabel genre={a.genre} klein />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Kaart uitleg="matrix" titel={`${soort === 'doelgroep' ? 'Doelgroep' : 'Motivatie'} × genre`} sub={`Bezoeken in seizoen ${seizoen}, verdeeld naar gewicht`}>
          <Matrix
            rijen={segmenten.map((s) => ({ naam: s.naam, label: <span className="flex items-center gap-1.5"><s.icoon size={15} style={{ color: s.kleur }} />{s.kort}</span> }))}
            kolommen={GENRE_FAMILIES.map((f) => ({ naam: f.naam, label: <span title={f.naam} className="flex flex-col items-center gap-0.5"><f.icoon size={16} style={{ color: f.kleur }} />{f.naam.split(' ')[0]}</span> }))}
            waarde={perFamilie}
            opmaak={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')}k` : getal(v))}
            tint={soort === 'doelgroep' ? 'blauw' : 'violet'}
            onCel={(r) => setFocus(segmenten.find((s) => s.naam === r) ?? focus)}
          />
        </Kaart>
        <Kaart titel={`${soort === 'doelgroep' ? 'Doelgroep' : 'Motivatie'} × maand`} sub="Wanneer bereiken we wie?">
          <Matrix
            rijen={segmenten.map((s) => ({ naam: s.naam, label: <span className="flex items-center gap-1.5"><s.icoon size={15} style={{ color: s.kleur }} />{s.kort}</span> }))}
            kolommen={SEIZOENSMAANDEN.map((m) => ({ naam: MAANDNAMEN[m], label: MAANDNAMEN[m] }))}
            waarde={perMaand}
            opmaak={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')}k` : getal(v))}
            tint="groen"
            onCel={(r) => setFocus(segmenten.find((s) => s.naam === r) ?? focus)}
          />
        </Kaart>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {soort === 'doelgroep' ? (
          <Kaart titel="Ons publiek versus het verzorgingsgebied" sub="Aandeel in ons bereik tegenover het aandeel van het segment in de regio (dummy)">
            <div className="h-96">
              <ResponsiveContainer>
                <RadarChart data={DOELGROEPEN.map((d) => ({ naam: d.kort, voluit: d.naam, 'Ons publiek': aandeel[d.naam] ?? 0, Verzorgingsgebied: d.marktaandeel }))} outerRadius="72%">
                  <PolarGrid stroke="#eadfd2" />
                  <PolarAngleAxis dataKey="naam" tick={{ fontSize: 12, fill: '#55526f' }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar animationDuration={900} name="Verzorgingsgebied" dataKey="Verzorgingsgebied" stroke="#eb6834" fill="#eb6834" fillOpacity={0.12} strokeWidth={2} />
                  <Radar animationDuration={900} name="Ons publiek" dataKey="Ons publiek" stroke="#2a78d6" fill="#2a78d6" fillOpacity={0.25} strokeWidth={2} />
                  <Tooltip content={<TipKaart formatter={(v) => `${v.toFixed(1).replace('.', ',')}%`} titel={(_, p) => String(p?.voluit ?? '')} />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <Legenda items={[{ naam: 'Ons publiek', kleur: '#2a78d6' }, { naam: 'Verzorgingsgebied', kleur: '#eb6834' }]} />
          </Kaart>
        ) : (
          <Kaart titel="Motivatie × doelgroep" sub="Welke drijfveren spelen bij welke groep? (bezoeken dit seizoen)">
            <Matrix
              rijen={MOTIVATIES.map((s) => ({ naam: s.naam, label: <span className="flex items-center gap-1.5"><s.icoon size={15} style={{ color: s.kleur }} />{s.kort}</span> }))}
              kolommen={DOELGROEPEN.map((d) => ({ naam: d.naam, label: <span title={d.naam} className="flex flex-col items-center gap-0.5"><d.icoon size={16} style={{ color: d.kleur }} />{d.kort}</span> }))}
              waarde={(m, d) => lijst.filter(actief).reduce((s, v) => s + bezoekers(v) * gewichtVoor(v, m, 'motivatie') * gewichtVoor(v, d, 'doelgroep'), 0)}
              opmaak={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1).replace('.', ',')}k` : getal(v))}
              tint="koraal"
            />
          </Kaart>
        )}
        <Kaart uitleg="bezetting" titel="Gerealiseerde bezetting" sub={`Gemiddelde bezettingsgraad van gespeelde voorstellingen per ${soort}, alle seizoenen`}>
          <div className="h-96">
            <ResponsiveContainer>
              <BarChart data={bezettingPerSegment} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1e9df" />
                <XAxis dataKey="naam" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#55526f' }} interval={0} angle={-35} textAnchor="end" height={58} />
                <YAxis tickLine={false} axisLine={false} unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: '#8a87a2' }} width={44} />
                <Tooltip cursor={{ fill: '#fff3ea' }} content={<TipKaart formatter={(v) => `${v.toFixed(0)}%`} titel={(_, p) => String(p?.voluit ?? '')} />} />
                <Bar animationDuration={900} dataKey="Bezetting" radius={[6, 6, 0, 0]} maxBarSize={44} label={{ position: 'top', fontSize: 11, fill: '#55526f', formatter: (v: unknown) => `${Math.round(Number(v))}%` }}>
                  {bezettingPerSegment.map((b) => <Cell key={b.naam} fill={b.kleur} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Kaart>
      </div>
      <p className="mt-6 text-center text-xs text-muted">Bereik wordt verdeeld over de toegewezen {soort === 'doelgroep' ? 'doelgroepen (40%, 30%, 20%, 10%)' : 'motivaties (60%, 40%)'}. Peildatum {datumKort(new Date().toISOString().slice(0, 10))}.</p>
    </div>
  )
}
