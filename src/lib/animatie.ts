import { useEffect, useRef, useState, type CSSProperties } from 'react'

export const minderBeweging = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Telt vloeiend op naar een nieuwe waarde (vanaf 0 bij de eerste keer). */
export function useOptellen(doel: number, duur = 900) {
  const [waarde, setWaarde] = useState(minderBeweging() ? doel : 0)
  const vorige = useRef(minderBeweging() ? doel : 0)
  useEffect(() => {
    if (minderBeweging()) {
      vorige.current = doel
      setWaarde(doel)
      return
    }
    const start = performance.now()
    const van = vorige.current
    let frame = 0
    const stap = (nu: number) => {
      const t = Math.min(1, (nu - start) / duur)
      const e = 1 - Math.pow(1 - t, 3)
      const w = van + (doel - van) * e
      vorige.current = w
      setWaarde(w)
      if (t < 1) frame = requestAnimationFrame(stap)
    }
    frame = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(frame)
  }, [doel, duur])
  return waarde
}

/** Stijl voor gestaffelde animaties: element i start iets later dan element i - 1. */
export const staffel = (i: number): CSSProperties => ({ ['--i' as string]: i })
