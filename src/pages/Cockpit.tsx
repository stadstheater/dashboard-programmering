import { ArrowRight, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Legenda, TipKaart } from '../components/charts'
import { DoelBalk, GenreLabel, Kaart, KpiTegel, Paginakop, StatusLabel, cx } from '../components/ui'
import { DOELGROEPEN, GENRE_FAMILIES, HUIDIG_SEIZOEN, MOTIVATIES, PLAN_SEIZOEN, familieVan } from '../data/vocab'
import {
  MAANDNAMEN, SEIZOENSMAANDEN, actief, aandelen, bereikPerDoelgroep, bereikPerFamilie, bereikPerMotivatie, bezoekers,
  datumKort, euroKort, gemiddeldeBezetting, getal, isVerleden, maandVan, marge, procent, recette, som, vandaag, verkochtTotNu,
} from '../lib/calc'
import { useSelectie } from '../lib/hooks'
import { maakSignalen } from '../lib/inzichten'
import { useSeizoen, useStore } from '../store/useStore'

export default function Cockpit() {
  const seizoen = useStore((s) => s.seizoen)
  const doelen = useStore((s) => s.dataset.doelen)
  const lijst = useSeizoen(undefined, seizoen === PLAN_SEIZOEN)
  const toon = useSelectie((s) => s.toonVoorstelling)
  const peil = vandaag()

  const a = useMemo(() => lijst.filter(actief), [lijst])
  const dg = useMemo(() => aandelen(bereikPerDoelgroep(lijst)), [lijst])
  const mot = useMemo(() => aandelen(bereikPerMotivatie(lijst)), [lijst])
  const fam = useMemo(() => aandelen(bereikPerFamilie(lijst)), [lijst])
  const signalen = useMemo(() => maakSignalen(lijst, doelen, seizoen), [lijst, doelen, seizoen])

  const perMaand = useMemo(
    () =>
      SEIZOENSMAANDEN.map((m) => {
        const rij: Record<string, number | string> = { maand: MAANDNAMEN[m] }
        for (const f of GENRE_FAMILIES) rij[f.naam] = 0
        for (const v of a) if (maandVan(v.datum) === m) rij[familieVan(v.genre).naam] = (rij[familieVan(v.genre).naam] as number) + bezoekers(v, peil)
        return rij
      }),
    [a, peil],
  )

  const komend = a.filter((v) => !isVerleden(v, peil)).slice(0, 7)
  const toppers = [...a].filter((v) => isVerleden(v, peil)).sort((x, y) => y.eindstand / y.capaciteit - x.eindstand / x.capaciteit).slice(0, 7)
  const totaalBezoekers = som(a, (v) => bezoekers(v, peil))
  const gerealiseerd = som(a.filter((v) => isVerleden(v, peil)), (v) => v.eindstand)
  const bez = gemiddeldeBezetting(lijst, peil)
  const open = lijst.filter((v) => v.status === 'Optie' || v.status === 'Concept').length
  const titelTekst = seizoen === HUIDIG_SEIZOEN ? 'lopend seizoen' : seizoen === PLAN_SEIZOEN ? 'seizoen in opbouw' : 'afgerond seizoen'

  return (
    <div>
      <Paginakop titel={`Cockpit ${seizoen}`} emoji="🎛️" sub={<>Alles over het {titelTekst} in één oogopslag: bezoekers, balans in doelgroepen en motivaties, en wat er aandacht nodig heeft.</>}>
        <Link to="/scenario" className="knop knop-koraal shadow-md"><Sparkles size={16} /> Seizoen bouwen</Link>
      </Paginakop>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <KpiTegel label="Voorstellingen" waarde={getal(a.length)} sub={`${open} opties en concepten`} icoon="🎟️" kleur="perzik" voortgang={a.length / doelen.aantal} />
        <KpiTegel label="Bezoekers" waarde={getal(totaalBezoekers)} sub={`${getal(gerealiseerd)} al gerealiseerd`} icoon="👥" kleur="citroen" />
        <KpiTegel label="Bezettingsgraad" waarde={procent(bez)} sub={`doel ${doelen.bezetting}%`} icoon="💺" kleur="munt" voortgang={bez / (doelen.bezetting / 100)} />
        <KpiTegel label="Recette" waarde={euroKort(som(a, (v) => recette(v, peil)))} sub="realisatie en prognose" icoon="💶" kleur="lavendel" />
        <KpiTegel label="Saldo na uitkoop" waarde={euroKort(som(a, (v) => marge(v, peil)))} sub="recette min uitkoopsom" icoon="📈" kleur="ijs" />
        <KpiTegel label="Voorverkoop" waarde={getal(som(a.filter((v) => !isVerleden(v, peil)), (v) => verkochtTotNu(v, peil)))} sub="kaarten voor komende voorstellingen" icoon="🛒" kleur="snoep" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Kaart
          titel={komend.length ? 'Binnenkort op de planken' : 'Toppers van dit seizoen'}
          sub={komend.length ? 'Voorverkoop van de eerstvolgende voorstellingen' : 'Hoogste bezettingsgraad'}
          actie={<Link to="/kalender" className="knop knop-zacht">Kalender <ArrowRight size={15} /></Link>}
        >
          <ul className="divide-y divide-line">
            {(komend.length ? komend : toppers).map((v) => {
              const verkocht = komend.length ? verkochtTotNu(v, peil) : v.eindstand
              const f = familieVan(v.genre)
              return (
                <li key={v.id}>
                  <button onClick={() => toon(v.id)} className="flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left transition hover:bg-[#fff6ee]">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-center leading-tight" style={{ background: f.kleur + '1f' }}>
                      <div>
                        <div className="font-display text-xl font-extrabold">{Number(v.datum.slice(8, 10))}</div>
                        <div className="text-[11px] font-semibold uppercase text-ink-2">{MAANDNAMEN[maandVan(v.datum)]}</div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{v.titel}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-2">
                        <GenreLabel genre={v.genre} klein /> <span>{v.zaal}</span> <StatusLabel status={v.status} klein />
                      </div>
                    </div>
                    <div className="hidden w-40 shrink-0 sm:block">
                      <div className="mb-1 flex justify-between text-xs text-ink-2">
                        <span>{getal(verkocht)} / {getal(v.capaciteit)}</span>
                        <b className="text-ink">{procent(verkocht / v.capaciteit)}</b>
                      </div>
                      <div className="h-2 rounded-full bg-[#f6efe6]">
                        <div className="h-full rounded-full" style={{ width: `${(verkocht / v.capaciteit) * 100}%`, background: f.kleur }} />
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Kaart>

        <Kaart titel="Signaleringen" sub="Kansen en aandachtspunten, automatisch berekend">
          <div className="space-y-3">
            {signalen.map((s) => {
              const inhoud = (
                <div className={cx('rounded-2xl p-4 transition hover:-translate-y-0.5', s.soort === 'kans' ? 'bg-munt' : s.soort === 'let op' ? 'bg-citroen' : 'bg-ijs')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold">{s.titel}</div>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-2">{s.soort}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-2">{s.tekst}</p>
                </div>
              )
              return s.link ? <Link key={s.titel} to={s.link} className="block">{inhoud}</Link> : <div key={s.titel}>{inhoud}</div>
            })}
          </div>
        </Kaart>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Kaart titel="Balans in doelgroepen" sub="Aandeel in het bereik ten opzichte van het seizoensdoel (zwart streepje)" actie={<Link to="/doelgroepen" className="knop knop-zacht">Verdiepen <ArrowRight size={15} /></Link>}>
          <div className="space-y-3.5">
            {DOELGROEPEN.map((d) => (
              <DoelBalk key={d.naam} label={d.naam} emoji={d.emoji} kleur={d.kleur} aandeel={dg[d.naam] ?? 0} doel={doelen.doelgroepen[d.naam] ?? 0} max={35} />
            ))}
          </div>
        </Kaart>
        <Kaart titel="Motivatiemix" sub="Waarom komt ons publiek? Aandeel versus doel" actie={<Link to="/motivaties" className="knop knop-zacht">Verdiepen <ArrowRight size={15} /></Link>}>
          <div className="space-y-3.5">
            {MOTIVATIES.map((m) => (
              <DoelBalk key={m.naam} label={m.naam} emoji={m.emoji} kleur={m.kleur} aandeel={mot[m.naam] ?? 0} doel={doelen.motivaties[m.naam] ?? 0} max={45} />
            ))}
          </div>
        </Kaart>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Kaart titel="Bezoekers per maand" sub="Gestapeld per genrefamilie">
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={perMaand} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1e9df" />
                <XAxis dataKey="maand" tickLine={false} axisLine={false} tick={{ fill: '#55526f', fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#8a87a2', fontSize: 12 }} tickFormatter={(v) => getal(v)} width={56} />
                <Tooltip cursor={{ fill: '#fff3ea' }} content={<TipKaart formatter={(v) => getal(v)} />} />
                {GENRE_FAMILIES.map((f, i) => (
                  <Bar key={f.naam} dataKey={f.naam} stackId="a" fill={f.kleur} stroke="#fff" strokeWidth={2} radius={i === GENRE_FAMILIES.length - 1 ? [6, 6, 0, 0] : 0} maxBarSize={44} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legenda className="mt-3" items={GENRE_FAMILIES.map((f) => ({ naam: f.naam, kleur: f.kleur, emoji: f.emoji }))} />
        </Kaart>
        <Kaart titel="Genremix versus doel" sub="Aandeel bezoekers per genrefamilie">
          <div className="space-y-3.5">
            {GENRE_FAMILIES.map((f) => (
              <DoelBalk key={f.naam} label={f.naam} emoji={f.emoji} kleur={f.kleur} aandeel={fam[f.naam] ?? 0} doel={doelen.genres[f.naam] ?? 0} max={40} />
            ))}
          </div>
        </Kaart>
      </div>
      <p className="mt-6 text-center text-xs text-muted">Peildatum {datumKort(peil)}. Bezoekers zijn werkelijk voor gespeelde voorstellingen en verwacht voor de rest van het seizoen.</p>
    </div>
  )
}
