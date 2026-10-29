import { Armchair, ArrowRight, CalendarDots, SunHorizon, Ticket, UsersThree } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import Info from '../components/Info'
import { CdmLabel, Getal, IcoonBol, Kaart, Paginakop, cx } from '../components/ui'
import { HUIDIG_SEIZOEN, PLAN_SEIZOEN, familieVan } from '../data/vocab'
import {
  MAANDNAMEN, actief, bezoekers, datumLang, gemiddeldeBezetting, getal, isVerleden, maandVan, procent, som, vandaag, verkochtTotNu,
} from '../lib/calc'
import { staffel } from '../lib/animatie'
import { useSelectie } from '../lib/hooks'
import { doelgroepAfwijkingen, maakSignalen } from '../lib/inzichten'
import { useSeizoen, useStore } from '../store/useStore'

function begroeting() {
  const uur = new Date().getHours()
  return uur < 12 ? 'Goedemorgen' : uur < 18 ? 'Goedemiddag' : 'Goedenavond'
}

/** Knoptekst in gewone taal voor elke signalering. */
const KNOP: Record<string, string> = {
  '/aanbod': 'Bekijk passend aanbod',
  '/kalender': 'Open de kalender',
  '/publiek': 'Bekijk het publiek',
}

function GroteCijfer({ label, waarde, opmaak, zin, goed, icoon: I, kleur, info, i }: {
  label: string
  waarde: number
  opmaak: (n: number) => string
  zin: string
  goed?: boolean
  icoon: typeof Ticket
  kleur: string
  info: string
  i: number
}) {
  return (
    <div className="kaart verschijn group p-6" style={staffel(i)}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-base font-semibold text-ink-2">{label} <Info>{info}</Info></span>
        <IcoonBol icoon={I} kleur={kleur} grootte={44} />
      </div>
      <div className="font-display mt-3 text-5xl font-extrabold tracking-tight tabular-nums"><Getal waarde={waarde} opmaak={opmaak} /></div>
      <div className="mt-3 flex items-center gap-2">
        {goed !== undefined && <span className={cx('rounded-full px-3 py-1 text-sm font-bold', goed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800')}>{goed ? 'Goed' : 'Let op'}</span>}
        <span className="text-[15px] text-ink-2">{zin}</span>
      </div>
    </div>
  )
}

export default function Vandaag() {
  const seizoen = useStore((s) => s.seizoen)
  const doelen = useStore((s) => s.dataset.doelen)
  const lijst = useSeizoen()
  const toon = useSelectie((s) => s.toonVoorstelling)
  const peil = vandaag()

  const a = useMemo(() => lijst.filter(actief), [lijst])
  const signalen = useMemo(() => maakSignalen(lijst, doelen, seizoen).filter((s) => s.soort !== 'goed').slice(0, 3), [lijst, doelen, seizoen])
  const achterblijvers = useMemo(() => doelgroepAfwijkingen(lijst, doelen).sort((x, y) => x.verschil - y.verschil).filter((x) => x.verschil < -1).slice(0, 3), [lijst, doelen])
  const komend = a.filter((v) => !isVerleden(v, peil)).slice(0, 5)
  const bez = gemiddeldeBezetting(lijst, peil)
  const totaal = som(a, (v) => bezoekers(v, peil))
  const bezGoed = bez * 100 >= doelen.bezetting - 3
  const aantalGoed = a.length >= doelen.aantal * 0.9 || seizoen === PLAN_SEIZOEN
  const welkSeizoen = seizoen === HUIDIG_SEIZOEN ? 'Dit seizoen' : seizoen === PLAN_SEIZOEN ? 'Volgend seizoen' : `In seizoen ${seizoen}`
  const vol = <b className="text-ink">{procent(bez)}</b>
  const zin = seizoen === PLAN_SEIZOEN
    ? <>{welkSeizoen} ({seizoen}) verwachten we de zalen gemiddeld {vol} vol te krijgen, met wat er nu gepland staat.</>
    : seizoen < HUIDIG_SEIZOEN
      ? <>{welkSeizoen} zaten de zalen gemiddeld {vol} vol{bezGoed ? ', dat ging goed.' : `, het doel was ${doelen.bezetting}%.`}</>
      : <>{welkSeizoen} ({seizoen}) zitten de zalen gemiddeld {vol} vol{bezGoed ? ', dat gaat goed.' : `, ons doel is ${doelen.bezetting}%.`}</>

  return (
    <div className="text-[15.5px]">
      <Paginakop
        titel={`${begroeting()}!`}
        icoon={SunHorizon}
        kleur="#ff6b57"
        sub={<>Het is {datumLang(peil)}. {zin}</>}
      />

      <div data-uitleg="vandaag-cijfers" className="grid gap-5 md:grid-cols-3">
        <GroteCijfer i={0} label="Voorstellingen" waarde={a.length} opmaak={getal} icoon={Ticket} kleur="#ff6b57" goed={aantalGoed}
          zin={seizoen === PLAN_SEIZOEN ? 'al gepland of in optie' : `doel: ${doelen.aantal}`}
          info="Alle voorstellingen van dit seizoen die niet geannuleerd zijn, inclusief opties." />
        <GroteCijfer i={1} label="Bezoekers" waarde={totaal} opmaak={getal} icoon={UsersThree} kleur="#d48a00"
          zin={seizoen < HUIDIG_SEIZOEN ? 'echte bezoekers' : 'geteld en verwacht'}
          info="Voor voorstellingen die al geweest zijn tellen we de echte bezoekers, voor de rest wat we verwachten." />
        <GroteCijfer i={2} label="Zalen gemiddeld vol" waarde={bez} opmaak={(n) => procent(n)} icoon={Armchair} kleur="#139a78" goed={bezGoed}
          zin={`doel: ${doelen.bezetting}%`}
          info="Het percentage stoelen dat gemiddeld bezet is, over alle zalen en voorstellingen samen." />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Kaart i={3} uitleg="vandaag-aandacht" titel="Dit vraagt je aandacht" sub="De belangrijkste punten op een rij">
          {!signalen.length && <p className="text-ink-2">Niets bijzonders: alles ziet er goed uit.</p>}
          <div className="space-y-3">
            {signalen.map((s, i) => (
              <div key={s.titel} className="verschijn flex flex-wrap items-center gap-4 rounded-2xl bg-vlak p-4 ring-1 ring-line" style={staffel(i + 4)}>
                <IcoonBol icoon={s.icoon} kleur={s.kleur} grootte={44} />
                <div className="min-w-[13rem] flex-1">
                  <div className="text-base font-bold">{s.titel}</div>
                  <p className="mt-0.5 text-sm text-ink-2">{s.tekst}</p>
                </div>
                {s.link && (
                  <Link to={s.link} className="knop knop-primair w-full justify-center !px-4 !py-2.5 text-[15px] sm:w-auto">
                    {KNOP[s.link] ?? 'Bekijken'} <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </Kaart>

        <Kaart i={4} titel="Binnenkort" sub="De eerstvolgende voorstellingen en hoeveel kaarten er al verkocht zijn" actie={<Link to="/kalender" className="knop knop-zacht"><CalendarDots size={16} /> Kalender</Link>}>
          {!komend.length && <p className="text-ink-2">Geen komende voorstellingen in dit seizoen.</p>}
          <ul className="space-y-2">
            {komend.map((v, i) => {
              const verkocht = verkochtTotNu(v, peil)
              const f = familieVan(v.genre)
              return (
                <li key={v.id} className="verschijn" style={staffel(i + 5)}>
                  <button onClick={() => toon(v.id)} className="group flex w-full items-center gap-4 rounded-2xl p-2 text-left transition hover:bg-zacht">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-center leading-tight transition group-hover:scale-105" style={{ background: f.kleur + '1f' }}>
                      <div>
                        <div className="font-display text-xl font-extrabold">{Number(v.datum.slice(8, 10))}</div>
                        <div className="text-[11px] font-semibold uppercase text-ink-2">{MAANDNAMEN[maandVan(v.datum)]}</div>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-semibold">{v.titel}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-ink-2">
                        <div className="h-2 w-28 rounded-full bg-spoor">
                          <div className="groei h-full rounded-full" style={{ width: `${(verkocht / v.capaciteit) * 100}%`, background: f.kleur, ...staffel(i + 5) }} />
                        </div>
                        {procent(verkocht / v.capaciteit)} verkocht
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Kaart>
      </div>

      <Kaart i={5} className="mt-6" titel="Publiek in balans" sub="Deze groepen uit het Cultureel Doelgroepenmodel bereiken we nu te weinig" actie={<Link to="/publiek" className="knop knop-zacht"><UsersThree size={16} /> Bekijk het publiek</Link>}>
        {!achterblijvers.length && <p className="text-ink-2">Alle groepen zitten rond hun doel. Mooi!</p>}
        <div className="grid gap-4 md:grid-cols-3">
          {achterblijvers.map((x, i) => (
            <div key={x.segment.naam} className="verschijn rounded-2xl p-4 ring-1 ring-line" style={{ ...staffel(i + 6), background: x.segment.kleur + '14' }}>
              <div className="flex items-center gap-3">
                <IcoonBol icoon={x.segment.icoon} kleur={x.segment.kleur} grootte={40} />
                <div className="min-w-0">
                  <CdmLabel segment={x.segment} groot />
                  <div className="mt-1 truncate text-sm font-semibold">{x.segment.naam}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-ink-2">
                Nu <b className="text-ink">{Math.round(x.aandeel)}%</b> van ons publiek, we willen <b className="text-ink">{x.doel}%</b>.
              </p>
            </div>
          ))}
        </div>
      </Kaart>
    </div>
  )
}
