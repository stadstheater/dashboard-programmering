import { useMemo } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar,
  RadarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Legenda, TipKaart } from '../components/charts'
import { ChartLineUp } from '@phosphor-icons/react'
import { Kaart, Paginakop, cx } from '../components/ui'
import { staffel } from '../lib/animatie'
import { naarDatum } from '../data/generate'
import { GENRE_FAMILIES, HUIDIG_SEIZOEN, PLAN_SEIZOEN, SEIZOENEN, familieVan } from '../data/vocab'
import {
  DAGNAMEN, aandelen, actief, bereikPerFamilie, bezoekers, euroKort, gemiddeldeBezetting, getal, isVerleden, marge,
  procent, recette, som,
} from '../lib/calc'
import { useSelectie } from '../lib/hooks'
import { useStore } from '../store/useStore'

export default function Historie() {
  const alle = useStore((s) => s.dataset.voorstellingen)
  const huidig = useStore((s) => s.seizoen)
  const toon = useSelectie((s) => s.toonVoorstelling)

  const perSeizoen = useMemo(
    () =>
      SEIZOENEN.map((s) => {
        const vs = alle.filter((v) => v.seizoen === s && actief(v))
        const gespeeld = vs.filter((v) => isVerleden(v))
        return {
          seizoen: s,
          aantal: vs.length,
          Gerealiseerd: som(gespeeld, (v) => v.eindstand),
          Prognose: som(vs.filter((v) => !isVerleden(v)), (v) => v.verwacht),
          bezetting: gemiddeldeBezetting(vs) * 100,
          recette: som(vs, (v) => recette(v)),
          saldo: som(vs, (v) => marge(v)),
          geannuleerd: alle.filter((v) => v.seizoen === s && !actief(v)).length,
        }
      }),
    [alle],
  )

  const genreTrend = useMemo(
    () => SEIZOENEN.map((s) => ({ seizoen: s, ...aandelen(bereikPerFamilie(alle.filter((v) => v.seizoen === s)) ) })),
    [alle],
  )

  const verleden = useMemo(() => alle.filter((v) => actief(v) && isVerleden(v)), [alle])

  const inschatting = GENRE_FAMILIES.map((f) => {
    const vs = verleden.filter((v) => familieVan(v.genre).naam === f.naam)
    const ratio = som(vs, (v) => v.eindstand) / Math.max(1, som(vs, (v) => v.verwacht))
    return { naam: f.naam, Realisatie: Math.round(ratio * 100) }
  })

  const weekdagen = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const vs = verleden.filter((v) => naarDatum(v.datum).getDay() === d)
    return { dag: DAGNAMEN[d], Bezetting: vs.length ? (som(vs, (v) => v.eindstand) / som(vs, (v) => v.capaciteit)) * 100 : 0, aantal: vs.length }
  })

  const vorigeSeizoenen = SEIZOENEN.filter((s) => s < HUIDIG_SEIZOEN)
  const dnaHistorie = aandelen(bereikPerFamilie(alle.filter((v) => vorigeSeizoenen.includes(v.seizoen as typeof SEIZOENEN[number]))))
  const dnaNu = aandelen(bereikPerFamilie(alle.filter((v) => v.seizoen === huidig)))
  const dna = GENRE_FAMILIES.map((f) => ({ naam: f.naam, Historie: dnaHistorie[f.naam] ?? 0, [`Seizoen ${huidig}`]: dnaNu[f.naam] ?? 0 }))

  const topBezoekers = useMemo(() => {
    const per = new Map<string, { titel: string; bezoekers: number; aantal: number; id: string }>()
    for (const v of verleden) {
      const x = per.get(v.artiest) ?? { titel: v.artiest, bezoekers: 0, aantal: 0, id: v.id }
      x.bezoekers += v.eindstand
      x.aantal += 1
      per.set(v.artiest, x)
    }
    return [...per.values()].sort((a, b) => b.bezoekers - a.bezoekers).slice(0, 10)
  }, [verleden])

  return (
    <div>
      <Paginakop titel="Historie & profiel" icoon={ChartLineUp} kleur="#0284c7" sub="Vijf seizoenen terug en één vooruit. Hoe ontwikkelt ons theaterprofiel zich, hoe goed schatten we in en wat zijn de publiekstrekkers?" />

      <div className="grid gap-6 xl:grid-cols-2">
        <Kaart i={0} uitleg="seizoenen-grafiek" titel="Bezoekers per seizoen" sub="Gerealiseerd en prognose voor de rest van het seizoen">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={perSeizoen} margin={{ top: 8, right: 8, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-raster)" />
                <XAxis dataKey="seizoen" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} width={44} />
                <Tooltip cursor={{ fill: 'var(--color-zacht)' }} content={<TipKaart formatter={(v) => getal(v)} />} />
                <Bar animationDuration={900} dataKey="Gerealiseerd" stackId="a" fill="#2a78d6" stroke="var(--color-oppervlak)" strokeWidth={2} maxBarSize={56} />
                <Bar animationDuration={900} dataKey="Prognose" stackId="a" fill="#9ec5f4" stroke="var(--color-oppervlak)" strokeWidth={2} radius={[6, 6, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legenda items={[{ naam: 'Gerealiseerd', kleur: '#2a78d6' }, { naam: 'Prognose', kleur: '#9ec5f4' }]} />
        </Kaart>
        <Kaart i={1} titel="Bezettingsgraad per seizoen" sub="Gemiddeld over alle voorstellingen">
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={perSeizoen} margin={{ top: 16, right: 16, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-raster)" />
                <XAxis dataKey="seizoen" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }} />
                <YAxis tickLine={false} axisLine={false} unit="%" domain={[50, 90]} ticks={[50, 60, 70, 80, 90]} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} width={48} />
                <Tooltip content={<TipKaart formatter={(v) => `${v.toFixed(1).replace('.', ',')}%`} />} />
                <Line animationDuration={900} dataKey="bezetting" name="Bezetting" stroke="#1baf7a" strokeWidth={2.5} dot={{ r: 5, fill: '#1baf7a', stroke: 'var(--color-oppervlak)', strokeWidth: 2 }} activeDot={{ r: 7 }} label={{ position: 'top', fontSize: 11, fill: 'var(--color-ink-2)', formatter: (v: unknown) => `${Math.round(Number(v))}%` }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Kaart>
      </div>

      <Kaart i={2} className="mt-6" titel="Seizoenen naast elkaar" sub={`${PLAN_SEIZOEN} is in opbouw, ${HUIDIG_SEIZOEN} loopt nu`}>
        <div className="dun-scroll overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-2">
              <tr className="border-b border-line">
                <th className="px-3 py-2">Seizoen</th><th className="px-3 py-2 text-right">Voorstellingen</th><th className="px-3 py-2 text-right">Bezoekers</th>
                <th className="px-3 py-2 text-right">Bezetting</th><th className="px-3 py-2 text-right">Recette</th><th className="px-3 py-2 text-right">Saldo</th><th className="px-3 py-2 text-right">Geannuleerd</th>
              </tr>
            </thead>
            <tbody>
              {perSeizoen.map((s, i) => (
                <tr key={s.seizoen} style={staffel(i + 2)} className={cx('verschijn border-b border-line/60 transition hover:bg-zacht', s.seizoen === huidig && 'bg-citroen/50')}>
                  <td className="px-3 py-2.5 font-display font-bold">{s.seizoen}{s.seizoen === HUIDIG_SEIZOEN && <span className="ml-2 rounded-full bg-mint px-1.5 text-[10px] text-white">nu</span>}{s.seizoen === PLAN_SEIZOEN && <span className="ml-2 rounded-full bg-violet px-1.5 text-[10px] text-white">plan</span>}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{getal(s.aantal)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{getal(s.Gerealiseerd + s.Prognose)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{s.bezetting.toFixed(1).replace('.', ',')}%</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{euroKort(s.recette)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{euroKort(s.saldo)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-2">{s.geannuleerd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Kaart>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Kaart i={3} titel="Genremix door de jaren" sub="Aandeel bezoekers per genrefamilie (%)">
          <div className="h-80">
            <ResponsiveContainer>
              <AreaChart data={genreTrend} margin={{ top: 8, right: 8, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-raster)" />
                <XAxis dataKey="seizoen" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }} />
                <YAxis tickLine={false} axisLine={false} unit="%" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} allowDataOverflow tick={{ fontSize: 12, fill: 'var(--color-muted)' }} width={44} />
                <Tooltip content={<TipKaart formatter={(v) => `${v.toFixed(1).replace('.', ',')}%`} />} />
                {GENRE_FAMILIES.map((f) => (
                  <Area animationDuration={900} key={f.naam} dataKey={f.naam} stackId="a" stroke="var(--color-oppervlak)" strokeWidth={2} fill={f.kleur} fillOpacity={0.9} type="monotone" />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <Legenda className="mt-3" items={GENRE_FAMILIES.map((f) => ({ naam: f.naam, kleur: f.kleur, icoon: f.icoon }))} />
        </Kaart>
        <Kaart i={4} uitleg="dna" titel="Theater-DNA" sub={`Genreprofiel ${huidig} versus het gemiddelde van eerdere seizoenen`}>
          <div className="h-80">
            <ResponsiveContainer>
              <RadarChart data={dna} outerRadius="70%">
                <PolarGrid stroke="var(--color-raster)" />
                <PolarAngleAxis dataKey="naam" tick={{ fontSize: 11, fill: 'var(--color-ink-2)' }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar animationDuration={900} name="Historie" dataKey="Historie" stroke="#eb6834" fill="#eb6834" fillOpacity={0.12} strokeWidth={2} />
                <Radar animationDuration={900} name={`Seizoen ${huidig}`} dataKey={`Seizoen ${huidig}`} stroke="#6250d6" fill="#6250d6" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip content={<TipKaart formatter={(v) => `${v.toFixed(1).replace('.', ',')}%`} />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <Legenda items={[{ naam: `Seizoen ${huidig}`, kleur: '#6250d6' }, { naam: 'Historie', kleur: '#eb6834' }]} />
        </Kaart>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Kaart i={5} uitleg="inschatting" titel="Hoe goed schatten we in?" sub="Werkelijke bezoekers als % van de verwachting">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={inschatting} layout="vertical" margin={{ left: 8, right: 30 }}>
                <CartesianGrid horizontal={false} stroke="var(--color-raster)" />
                <XAxis type="number" domain={[60, 130]} unit="%" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--color-muted)' }} />
                <YAxis type="category" dataKey="naam" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }} />
                <ReferenceLine x={100} stroke="var(--color-ink)" strokeDasharray="4 4" />
                <Tooltip cursor={{ fill: 'var(--color-zacht)' }} content={<TipKaart formatter={(v) => `${v}%`} />} />
                <Bar animationDuration={900} dataKey="Realisatie" radius={[0, 6, 6, 0]} barSize={14} label={{ position: 'right', fontSize: 11, fill: 'var(--color-ink-2)', formatter: (v: unknown) => `${v}%` }}>
                  {inschatting.map((i) => <Cell key={i.naam} fill={i.Realisatie >= 100 ? '#1baf7a' : i.Realisatie >= 92 ? '#eda100' : '#e34948'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-ink-2">Groen: we schatten voorzichtig in. Rood: we zijn te optimistisch.</p>
        </Kaart>
        <Kaart i={6} titel="Beste speeldagen" sub="Gerealiseerde bezetting per weekdag">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={weekdagen} margin={{ top: 20, right: 8, left: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-raster)" />
                <XAxis dataKey="dag" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-ink-2)' }} />
                <YAxis tickLine={false} axisLine={false} unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-muted)' }} width={44} />
                <Tooltip cursor={{ fill: 'var(--color-zacht)' }} content={<TipKaart formatter={(v) => `${v.toFixed(0)}%`} titel={(l, p) => `${l} (${p?.aantal} voorstellingen)`} />} />
                <Bar animationDuration={900} dataKey="Bezetting" fill="#6250d6" radius={[6, 6, 0, 0]} maxBarSize={40} label={{ position: 'top', fontSize: 11, fill: 'var(--color-ink-2)', formatter: (v: unknown) => `${Math.round(Number(v))}%` }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Kaart>
        <Kaart i={7} titel="Publiekstrekkers aller tijden" sub="Meeste bezoekers sinds 22/23">
          <ol className="space-y-1.5">
            {topBezoekers.map((t, i) => (
              <li key={t.titel} className="verschijn" style={staffel(i + 6)}>
                <button onClick={() => toon(t.id)} className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-zacht">
                  <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold', i < 3 ? 'bg-zon text-ink' : 'bg-vlak text-ink-2')}>{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{t.titel}</span>
                  <span className="shrink-0 tabular-nums text-ink-2">{getal(t.bezoekers)}</span>
                  <span className="w-8 shrink-0 text-right text-xs text-muted">{t.aantal}x</span>
                </button>
              </li>
            ))}
          </ol>
        </Kaart>
      </div>
      <p className="mt-6 text-center text-xs text-muted">Alle cijfers zijn dummy data. Gemiddelde bezetting historie: {procent(gemiddeldeBezetting(verleden))}, {getal(som(verleden, (v) => bezoekers(v)))} bezoekers in totaal.</p>
    </div>
  )
}
