import { CalendarBlank, CalendarDots, CaretDown, Moon, Question, Sun, SunHorizon, Target, Tray, UsersThree } from '@phosphor-icons/react'
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { uitlegSleutel, uitlegVoor } from '../data/uitleg'
import { HUIDIG_SEIZOEN, PLAN_SEIZOEN, SEIZOENEN } from '../data/vocab'
import { useStore } from '../store/useStore'
import { AanbodLade, VoorstellingLade } from './Details'
import Info from './Info'
import Logo from './Logo'
import Rondleiding, { useAutomatischeUitleg, useUitleg } from './Rondleiding'
import { cx } from './ui'

export const NAV = [
  { to: '/', label: 'Vandaag', icoon: SunHorizon, kleur: '#ff6b57' },
  { to: '/kalender', label: 'Kalender', icoon: CalendarDots, kleur: '#2a78d6' },
  { to: '/aanbod', label: 'Aanbod', icoon: Tray, kleur: '#d97706' },
  { to: '/publiek', label: 'Publiek', icoon: UsersThree, kleur: '#0f9f84' },
  { to: '/doelen', label: 'Doelen', icoon: Target, kleur: '#7c5cf0' },
]

const RONDE_KNOP = 'grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-oppervlak text-ink-2 transition hover:bg-zacht hover:text-ink'

/** Kleur van de statusbalk van de telefoon, gelijk aan de achtergrond van het thema. */
const STATUSBALK = { licht: '#fff8f1', donker: '#13111c' }

/** Wissel tussen licht en donker thema. */
function ThemaSchakelaar() {
  const thema = useStore((s) => s.thema)
  const setThema = useStore((s) => s.setThema)
  const donker = thema === 'donker'
  return (
    <button
      onClick={() => setThema(donker ? 'licht' : 'donker')}
      className={RONDE_KNOP}
      aria-label={donker ? 'Licht thema' : 'Donker thema'}
      title={donker ? 'Licht thema' : 'Donker thema'}
    >
      {donker ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  )
}

const OVER_DEZE_APP = 'Deze app is gemaakt door Scottey met behulp van AI.'

/** Seizoenkeuze: dit seizoen, volgend seizoen of een eerder seizoen. */
function SeizoenKiezer() {
  const seizoen = useStore((s) => s.seizoen)
  const setSeizoen = useStore((s) => s.setSeizoen)
  const eerder = SEIZOENEN.filter((s) => s < HUIDIG_SEIZOEN)
  const isEerder = eerder.includes(seizoen)
  const knop = (actief: boolean) => cx('whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition active:scale-95', actief ? 'bg-ink text-op-ink' : 'text-ink-2 hover:bg-zacht')
  return (
    <div data-uitleg="seizoenkiezer" className="dun-scroll hidden sm:flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-oppervlak p-1">
      <button className={knop(seizoen === HUIDIG_SEIZOEN)} onClick={() => setSeizoen(HUIDIG_SEIZOEN)}>Dit seizoen</button>
      <button className={knop(seizoen === PLAN_SEIZOEN)} onClick={() => setSeizoen(PLAN_SEIZOEN)}>Volgend seizoen</button>
      <select
        aria-label="Eerder seizoen"
        value={isEerder ? seizoen : ''}
        onChange={(e) => e.target.value && setSeizoen(e.target.value)}
        className={cx('cursor-pointer appearance-none rounded-full px-3.5 py-1.5 text-center text-sm font-semibold outline-none [field-sizing:content] [text-align-last:center]', isEerder ? 'bg-ink text-op-ink' : 'bg-transparent text-ink-2 hover:bg-zacht')}
      >
        <option value="">Eerder</option>
        {[...eerder].reverse().map((s) => <option key={s} value={s}>Seizoen {s}</option>)}
      </select>
    </div>
  )
}

/** Seizoenkeuze voor de telefoon: een compact knopje dat de keuzelijst van de telefoon zelf opent. */
function SeizoenKiezerMobiel() {
  const seizoen = useStore((s) => s.seizoen)
  const setSeizoen = useStore((s) => s.setSeizoen)
  const anders = seizoen !== HUIDIG_SEIZOEN
  return (
    <label
      data-uitleg="seizoenkiezer"
      className={cx('relative flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold sm:hidden', anders ? 'border-ink bg-ink text-op-ink' : 'border-line bg-oppervlak text-ink')}
    >
      <CalendarBlank size={17} />
      {seizoen}
      <CaretDown size={13} weight="bold" />
      <select aria-label="Seizoen" value={seizoen} onChange={(e) => setSeizoen(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0">
        {[...SEIZOENEN].reverse().map((s) => (
          <option key={s} value={s}>{s === HUIDIG_SEIZOEN ? `Dit seizoen (${s})` : s === PLAN_SEIZOEN ? `Volgend seizoen (${s})` : `Seizoen ${s}`}</option>
        ))}
      </select>
    </label>
  )
}

/** Tabbalk onderaan het scherm van een telefoon of tablet, binnen bereik van je duim. */
function Tabbalk() {
  return (
    <nav data-uitleg="tabbalk" aria-label="Onderdelen" className="veilig-onder fixed inset-x-0 bottom-0 z-40 border-t border-line bg-oppervlak/90 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) => cx('flex flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-semibold transition-colors', isActive ? 'text-ink' : 'text-ink-2')}
          >
            {({ isActive }) => (
              <>
                <span
                  className="grid h-8 w-14 place-items-center rounded-full transition-colors duration-300"
                  style={{ background: isActive ? n.kleur + '29' : 'transparent', color: n.kleur }}
                >
                  <n.icoon weight="fill" size={isActive ? 23 : 22} />
                </span>
                {n.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

/** Zijbalk met een indicator die meeschuift naar het actieve onderdeel. */
function Zijnavigatie({ pathname }: { pathname: string }) {
  const navRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const meet = () => {
      const actief = navRef.current?.querySelector<HTMLElement>('a[aria-current="page"]')
      setIndicator(actief ? { top: actief.offsetTop, height: actief.offsetHeight } : null)
    }
    meet()
    const frame = requestAnimationFrame(meet)
    window.addEventListener('resize', meet)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', meet)
    }
  }, [pathname])
  return (
    <nav ref={navRef} className="relative flex flex-col gap-1">
      {indicator && (
        <div className="absolute left-0 right-0 rounded-2xl bg-ink transition-all duration-500 ease-[cubic-bezier(.3,1.2,.5,1)]" style={indicator} />
      )}
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          className={({ isActive }) =>
            cx('relative z-10 flex items-center gap-3 rounded-2xl px-2.5 py-2 text-[15px] font-semibold transition-colors duration-300', isActive ? 'text-op-ink' : 'text-ink-2 hover:bg-zacht hover:text-ink')
          }
        >
          {({ isActive }) => (
            <>
              <span className="grid h-8 w-8 place-items-center rounded-xl transition-colors duration-300" style={{ background: isActive ? 'color-mix(in srgb, var(--color-op-ink) 16%, transparent)' : n.kleur + '1f', color: isActive ? 'var(--color-op-ink)' : n.kleur }}>
                <n.icoon weight="fill" size={18} />
              </span>
              {n.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  const thema = useStore((s) => s.thema)
  useEffect(() => {
    document.documentElement.classList.toggle('donker', thema === 'donker')
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', thema === 'donker' ? STATUSBALK.donker : STATUSBALK.licht)
  }, [thema])
  const startUitleg = useUitleg((s) => s.start)
  const sleutel = uitlegSleutel(pathname)
  useAutomatischeUitleg()
  return (
    <div className="min-h-full lg:flex">
      <aside className="sticky top-0 z-30 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-oppervlak/80 px-4 py-6 backdrop-blur lg:flex">
        <div className="mb-9 px-2.5"><Logo /></div>
        <Zijnavigatie pathname={pathname} />
        <div className="mt-auto px-1">
          <Info boven links>{OVER_DEZE_APP}</Info>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 lg:hidden">
              <Logo klein />
              <Info links>{OVER_DEZE_APP}</Info>
            </div>
            <span className="hidden rounded-full bg-citroen px-2.5 py-0.5 text-[11px] font-bold text-amber-800 lg:inline">voorbeelddata</span>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <ThemaSchakelaar />
              {uitlegVoor(sleutel) && (
                <button
                  data-uitleg="uitleg-knop"
                  onClick={() => startUitleg(sleutel)}
                  className={RONDE_KNOP}
                  aria-label="Uitleg van deze pagina"
                  title="Uitleg van deze pagina"
                >
                  <Question weight="fill" size={21} />
                </button>
              )}
              <SeizoenKiezer />
              <SeizoenKiezerMobiel />
            </div>
          </div>
        </header>
        <main key={pathname} className="pagina-in mx-auto max-w-[1400px] px-4 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:px-8 lg:py-8">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Tabbalk />
      <VoorstellingLade />
      <AanbodLade />
      <Rondleiding />
    </div>
  )
}
