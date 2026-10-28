import {
  BarChart3, CalendarDays, FlaskConical, Gauge, Hammer, Inbox, Lightbulb, Star, Users,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SEIZOENEN, HUIDIG_SEIZOEN, PLAN_SEIZOEN } from '../data/vocab'
import { useStore } from '../store/useStore'
import { AanbodLade, VoorstellingLade } from './Details'
import { cx } from './ui'

const NAV = [
  { to: '/', label: 'Cockpit', icoon: Gauge, kleur: '#ff6b57', zacht: '#ffe7df' },
  { to: '/kalender', label: 'Kalender', icoon: CalendarDays, kleur: '#2a78d6', zacht: '#e0f3ff' },
  { to: '/aanbod', label: 'Aanbod', icoon: Inbox, kleur: '#d97706', zacht: '#fff4c7' },
  { to: '/scenario', label: 'Seizoensbouwer', icoon: FlaskConical, kleur: '#8b5cf6', zacht: '#eee8ff' },
  { to: '/doelgroepen', label: 'Doelgroepen', icoon: Users, kleur: '#0f9f84', zacht: '#d6f7ef' },
  { to: '/motivaties', label: 'Motivaties', icoon: Lightbulb, kleur: '#db2777', zacht: '#ffe3f0' },
  { to: '/historie', label: 'Historie & profiel', icoon: BarChart3, kleur: '#0284c7', zacht: '#e0f3ff' },
  { to: '/artiesten', label: 'Artiestengeheugen', icoon: Star, kleur: '#ca8a04', zacht: '#fff4c7' },
  { to: '/builder', label: 'Databuilder', icoon: Hammer, kleur: '#475569', zacht: '#eef2f6' },
]

export function SeizoenKiezer() {
  const seizoen = useStore((s) => s.seizoen)
  const setSeizoen = useStore((s) => s.setSeizoen)
  return (
    <div className="dun-scroll flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-white p-1 shadow-sm">
      {SEIZOENEN.map((s) => (
        <button
          key={s}
          onClick={() => setSeizoen(s)}
          className={cx(
            'relative whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition',
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

export default function Layout() {
  const { pathname } = useLocation()
  const actief = NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
  return (
    <div className="min-h-full lg:flex">
      <aside className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white/80 px-4 py-6 backdrop-blur lg:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-koraal via-roze to-violet text-xl text-white shadow-lg">🎭</div>
          <div>
            <div className="font-display text-xl font-extrabold leading-none">Coulisse</div>
            <div className="mt-1 text-xs text-ink-2">Programmeringsdashboard</div>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                cx('group flex items-center gap-3 rounded-2xl px-2.5 py-2 text-[15px] font-semibold transition', isActive ? 'bg-ink text-white shadow-md' : 'text-ink-2 hover:bg-[#fff3ea] hover:text-ink')
              }
            >
              {({ isActive }) => (
                <>
                  <span className="grid h-8 w-8 place-items-center rounded-xl transition group-hover:scale-110" style={{ background: isActive ? 'rgb(255 255 255 / .14)' : n.zacht, color: isActive ? 'white' : n.kleur }}>
                    <n.icoon size={17} strokeWidth={2.3} />
                  </span>
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-citroen to-perzik p-4 text-xs text-ink-2">
          <div className="font-display mb-1 text-sm font-bold text-ink">Prototype</div>
          Gevuld met dummy data op basis van de programmeringsexport. Pas alles aan in de Databuilder.
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-line/70 bg-bg/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-koraal via-roze to-violet text-white">🎭</div>
              <span className="font-display text-lg font-extrabold">Coulisse</span>
            </div>
            <div className="hidden items-center gap-2 text-sm text-ink-2 lg:flex">
              {actief && <span className="font-semibold text-ink">{actief.label}</span>}
              <span className="rounded-full bg-citroen px-2 py-0.5 text-[11px] font-bold text-amber-800">dummy data</span>
            </div>
            <SeizoenKiezer />
          </div>
          <nav className="dun-scroll flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) => cx('flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold', isActive ? 'bg-ink text-white' : 'bg-white text-ink-2')}
              >
                <n.icoon size={15} style={{ color: undefined }} />
                {n.label}
              </NavLink>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
      <VoorstellingLade />
      <AanbodLade />
    </div>
  )
}
