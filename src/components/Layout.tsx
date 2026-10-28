import {
  CalendarDots, ChartLineUp, Flask, Gauge, Hammer, Lightbulb, MaskHappy, Question, Star, Tray, UsersThree,
} from '@phosphor-icons/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { UITLEG } from '../data/uitleg'
import { HUIDIG_SEIZOEN, PLAN_SEIZOEN, SEIZOENEN } from '../data/vocab'
import { useStore } from '../store/useStore'
import { AanbodLade, VoorstellingLade } from './Details'
import Rondleiding, { useAutomatischeUitleg, useUitleg } from './Rondleiding'
import { cx } from './ui'

const NAV = [
  { to: '/', label: 'Cockpit', icoon: Gauge, kleur: '#ff6b57' },
  { to: '/kalender', label: 'Kalender', icoon: CalendarDots, kleur: '#2a78d6' },
  { to: '/aanbod', label: 'Aanbod', icoon: Tray, kleur: '#d97706' },
  { to: '/scenario', label: 'Seizoensbouwer', icoon: Flask, kleur: '#8b5cf6' },
  { to: '/doelgroepen', label: 'Doelgroepen', icoon: UsersThree, kleur: '#0f9f84' },
  { to: '/motivaties', label: 'Motivaties', icoon: Lightbulb, kleur: '#db2777' },
  { to: '/historie', label: 'Historie & profiel', icoon: ChartLineUp, kleur: '#0284c7' },
  { to: '/artiesten', label: 'Artiestengeheugen', icoon: Star, kleur: '#ca8a04' },
  { to: '/builder', label: 'Databuilder', icoon: Hammer, kleur: '#475569' },
]

export function SeizoenKiezer() {
  const seizoen = useStore((s) => s.seizoen)
  const setSeizoen = useStore((s) => s.setSeizoen)
  return (
    <div data-uitleg="seizoenkiezer" className="dun-scroll flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-white p-1 shadow-sm">
      {SEIZOENEN.map((s) => (
        <button
          key={s}
          onClick={() => setSeizoen(s)}
          className={cx(
            'relative whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition active:scale-95',
            seizoen === s ? 'bg-ink text-white shadow' : 'text-ink-2 hover:bg-perzik/60',
          )}
        >
          {s}
          {s === HUIDIG_SEIZOEN && <span className="ml-1.5 rounded-full bg-mint px-1.5 py-px text-[10px] font-bold text-white">nu</span>}
          {s === PLAN_SEIZOEN && <span className="ml-1.5 rounded-full bg-violet px-1.5 py-px text-[10px] font-bold text-white">plan</span>}
        </button>
      ))}
    </div>
  )
}

function Logo({ klein }: { klein?: boolean }) {
  return (
    <div className={cx('zweef grid place-items-center bg-gradient-to-br from-koraal via-roze to-violet text-white shadow-lg', klein ? 'h-9 w-9 rounded-xl' : 'h-11 w-11 rounded-2xl')}>
      <MaskHappy weight="fill" size={klein ? 20 : 24} />
    </div>
  )
}

/** Zijbalk met een indicator die meeschuift naar het actieve onderdeel. */
function Zijnavigatie({ pathname }: { pathname: string }) {
  const navRef = useRef<HTMLElement>(null)
  const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null)
  useLayoutEffect(() => {
    const actief = navRef.current?.querySelector<HTMLElement>('a[aria-current="page"]')
    setIndicator(actief ? { top: actief.offsetTop, height: actief.offsetHeight } : null)
  }, [pathname])
  return (
    <nav ref={navRef} className="relative flex flex-1 flex-col gap-1">
      {indicator && (
        <div className="absolute left-0 right-0 rounded-2xl bg-ink shadow-md transition-all duration-500 ease-[cubic-bezier(.3,1.3,.5,1)]" style={indicator} />
      )}
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          className={({ isActive }) =>
            cx('group relative z-10 flex items-center gap-3 rounded-2xl px-2.5 py-2 text-[15px] font-semibold transition-colors duration-300', isActive ? 'text-white' : 'text-ink-2 hover:bg-[#fff3ea] hover:text-ink')
          }
        >
          {({ isActive }) => (
            <>
              <span className="wip grid h-8 w-8 place-items-center rounded-xl transition-colors duration-300" style={{ background: isActive ? 'rgb(255 255 255 / .14)' : n.kleur + '1f', color: isActive ? 'white' : n.kleur }}>
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
  const actief = NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
  const startUitleg = useUitleg((s) => s.start)
  useAutomatischeUitleg()
  return (
    <div className="min-h-full lg:flex">
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white/80 px-4 py-6 backdrop-blur lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <Logo />
          <div>
            <div className="font-display text-xl font-extrabold leading-none">Coulisse</div>
            <div className="mt-1 text-xs text-ink-2">Programmeringsdashboard</div>
          </div>
        </div>
        <Zijnavigatie pathname={pathname} />
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-citroen to-perzik p-4 text-xs text-ink-2">
          <div className="font-display mb-1 text-sm font-bold text-ink">Prototype</div>
          Gevuld met dummy data op basis van de programmeringsexport. Pas alles aan in de Databuilder.
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <Logo klein />
              <span className="font-display text-lg font-extrabold">Coulisse</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-ink-2 lg:flex">
              {actief && <span className="font-semibold text-ink">{actief.label}</span>}
              <span className="rounded-full bg-citroen px-2 py-0.5 text-[11px] font-bold text-amber-800">dummy data</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              {UITLEG[pathname] && (
                <button
                  data-uitleg="uitleg-knop"
                  onClick={() => startUitleg(pathname)}
                  className="wip grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-white text-violet shadow-sm transition hover:bg-lavendel"
                  aria-label="Uitleg van deze pagina"
                  title="Uitleg van deze pagina"
                >
                  <Question weight="fill" size={22} />
                </button>
              )}
              <SeizoenKiezer />
            </div>
          </div>
          <nav className="dun-scroll flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => cx('flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition', isActive ? 'bg-ink text-white' : 'bg-white text-ink-2')}
              >
                {({ isActive }) => (
                  <>
                    <n.icoon weight="fill" size={15} style={{ color: isActive ? 'white' : n.kleur }} />
                    {n.label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </header>
        <main key={pathname} className="pagina-in mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <VoorstellingLade />
      <AanbodLade />
      <Rondleiding />
    </div>
  )
}
