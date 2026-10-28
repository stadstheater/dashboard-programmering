import { useEffect, useMemo, useState } from 'react'
import { PALET } from '../data/vocab'
import { minderBeweging } from '../lib/animatie'

/** Korte confetti-explosie vanuit het midden van het scherm. Start opnieuw bij elke nieuwe `sleutel`. */
export default function Confetti({ sleutel }: { sleutel: number }) {
  const [zichtbaar, setZichtbaar] = useState(false)
  useEffect(() => {
    if (!sleutel || minderBeweging()) return
    setZichtbaar(true)
    const t = setTimeout(() => setZichtbaar(false), 1700)
    return () => clearTimeout(t)
  }, [sleutel])
  const stukken = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => {
        const hoek = (i / 70) * Math.PI * 2 + Math.random() * 0.4
        const afstand = 180 + Math.random() * 320
        return {
          x: `${Math.cos(hoek) * afstand}px`,
          y: `${Math.sin(hoek) * afstand - 80}px`,
          r: `${Math.round(Math.random() * 720 - 360)}deg`,
          kleur: PALET[i % PALET.length],
          rond: i % 3 === 0,
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sleutel],
  )
  if (!zichtbaar) return null
  return (
    <>
      {stukken.map((s, i) => (
        <span
          key={i}
          className="confetti-stuk"
          style={{ background: s.kleur, borderRadius: s.rond ? '999px' : '3px', ['--x' as string]: s.x, ['--y' as string]: s.y, ['--r' as string]: s.r }}
        />
      ))}
    </>
  )
}
