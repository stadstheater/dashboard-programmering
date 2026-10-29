import { ArrowLeft, ArrowRight, Lightbulb, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { create } from 'zustand'
import { padVanSleutel, uitlegSleutel, uitlegVoor } from '../data/uitleg'
import { cx } from './ui'

const SLEUTEL = 'coulisse-uitleg-v2'

function gezien(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SLEUTEL) ?? '[]')
  } catch {
    return []
  }
}
function markeer(route: string) {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify([...new Set([...gezien(), route])]))
  } catch {
    /* zonder opslag verschijnt de uitleg gewoon opnieuw */
  }
}
export function wisAlleUitleg() {
  try {
    localStorage.removeItem(SLEUTEL)
  } catch {
    /* negeren */
  }
}

export const useUitleg = create<{ route: string | null; start: (r: string) => void; stop: () => void }>((set) => ({
  route: null,
  start: (route) => set({ route }),
  stop: () => set({ route: null }),
}))

interface Kader {
  top: number
  left: number
  width: number
  height: number
}

function zoekDoel(doel?: string) {
  if (!doel) return null
  const kandidaten = [...document.querySelectorAll<HTMLElement>(`[data-uitleg="${doel}"]`)]
  return kandidaten.find((el) => {
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }) ?? null
}

/** Start de uitleg automatisch bij het eerste bezoek aan een pagina. */
export function useAutomatischeUitleg() {
  const { pathname } = useLocation()
  const start = useUitleg((s) => s.start)
  useEffect(() => {
    const sleutel = uitlegSleutel(pathname)
    if (!uitlegVoor(sleutel) || gezien().includes(sleutel)) return
    const t = setTimeout(() => start(sleutel), 900)
    return () => clearTimeout(t)
  }, [pathname, start])
}

export default function Rondleiding() {
  const route = useUitleg((s) => s.route)
  const stop = useUitleg((s) => s.stop)
  const { pathname } = useLocation()
  const [stap, setStap] = useState(0)
  const [kader, setKader] = useState<Kader | null>(null)
  const ballonRef = useRef<HTMLDivElement>(null)
  const [ballonHoogte, setBallonHoogte] = useState(220)
  const uitleg = uitlegVoor(route)
  const huidig = uitleg?.stappen[stap]

  useEffect(() => setStap(0), [route])
  useEffect(() => {
    if (route && padVanSleutel(route) !== pathname) stop()
  }, [pathname, route, stop])

  const meet = useCallback(() => {
    const el = zoekDoel(huidig?.doel)
    if (!el) return setKader(null)
    const r = el.getBoundingClientRect()
    const marge = 8
    setKader({ top: r.top - marge, left: r.left - marge, width: r.width + marge * 2, height: Math.min(r.height + marge * 2, window.innerHeight - 40) })
  }, [huidig])

  useLayoutEffect(() => {
    if (!huidig) return
    const el = zoekDoel(huidig.doel)
    if (el) {
      const r = el.getBoundingClientRect()
      const past = r.top >= 90 && r.bottom <= window.innerHeight - 240
      if (!past) {
        const hoog = r.height > window.innerHeight * 0.45
        const doel = hoog ? r.top + window.scrollY - 100 : r.top + window.scrollY - (window.innerHeight - r.height) / 2 + 80
        window.scrollTo({ top: Math.max(0, doel), behavior: 'smooth' })
      }
    }
    meet()
    const t1 = setTimeout(meet, 350)
    const t2 = setTimeout(meet, 800)
    window.addEventListener('resize', meet)
    window.addEventListener('scroll', meet, true)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener('resize', meet)
      window.removeEventListener('scroll', meet, true)
    }
  }, [huidig, meet])

  const klaar = useCallback(() => {
    if (route) markeer(route)
    stop()
  }, [route, stop])

  useEffect(() => {
    if (!uitleg) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') klaar()
      if (e.key === 'ArrowRight') setStap((s) => (s < uitleg.stappen.length - 1 ? s + 1 : s))
      if (e.key === 'ArrowLeft') setStap((s) => Math.max(0, s - 1))
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [uitleg, klaar])

  useLayoutEffect(() => {
    if (ballonRef.current) setBallonHoogte(ballonRef.current.offsetHeight)
  })

  if (!uitleg || !huidig) return null
  const laatste = stap === uitleg.stappen.length - 1
  const mobiel = window.innerWidth < 640

  // Ballon onder het kader als er ruimte is, anders erboven; zonder kader in het midden.
  const ballonBreedte = Math.min(360, window.innerWidth - 32)
  let ballon: React.CSSProperties
  if (!kader || mobiel) {
    ballon = mobiel && kader ? { left: 16, right: 16, bottom: 16 } : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: ballonBreedte + 40 }
  } else {
    const h = ballonHoogte
    const vh = window.innerHeight
    const onder = kader.top + kader.height + 16
    const boven = kader.top - 16 - h
    const naastRechts = kader.left + kader.width + 16
    let top: number
    let left = Math.max(16, Math.min(kader.left, window.innerWidth - ballonBreedte - 16))
    if (onder + h <= vh - 16) top = onder
    else if (boven >= 16) top = boven
    else if (naastRechts + ballonBreedte <= window.innerWidth - 16) {
      left = naastRechts
      top = Math.max(16, Math.min(kader.top, vh - h - 16))
    } else top = vh - h - 16
    ballon = { top, left, width: ballonBreedte }
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Uitleg ${uitleg.naam}`}>
      {kader ? (
        <div
          className="spotlight pointer-events-none absolute rounded-3xl ring-4 ring-oppervlak/80"
          style={{ ...kader, boxShadow: '0 0 0 9999px rgb(29 27 47 / .55)' }}
        />
      ) : (
        <div className="vervaag-in absolute inset-0 bg-black/55 backdrop-blur-[2px]" />
      )}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      <div key={stap} ref={ballonRef} className="plop absolute rounded-3xl bg-oppervlak p-5 shadow-2xl ring-1 ring-black/5" style={ballon}>
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-zon to-koraal text-white shadow">
            <Lightbulb weight="fill" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{uitleg.naam} · stap {stap + 1} van {uitleg.stappen.length}</div>
            <div className="font-display mt-0.5 text-lg font-bold leading-snug">{huidig.titel}</div>
          </div>
          <button onClick={klaar} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:rotate-90 hover:bg-perzik hover:text-ink" aria-label="Uitleg sluiten">
            <X weight="bold" size={14} />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{huidig.tekst}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {uitleg.stappen.map((_, i) => (
              <button key={i} onClick={() => setStap(i)} aria-label={`Stap ${i + 1}`} className={cx('h-2 rounded-full transition-all duration-300', i === stap ? 'w-6 bg-violet' : 'w-2 bg-line hover:bg-violet/40')} />
            ))}
          </div>
          <div className="ml-auto flex gap-2">
            {stap > 0 && (
              <button className="knop knop-zacht !px-3 !py-1.5" onClick={() => setStap(stap - 1)} aria-label="Vorige"><ArrowLeft weight="bold" size={14} /></button>
            )}
            {!laatste && <button className="knop !px-3 !py-1.5 text-ink-2 hover:bg-zacht" onClick={klaar}>Overslaan</button>}
            <button className="knop knop-primair !py-1.5" onClick={() => (laatste ? klaar() : setStap(stap + 1))}>
              {laatste ? 'Aan de slag' : 'Volgende'} {!laatste && <ArrowRight weight="bold" size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
