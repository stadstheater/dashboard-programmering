import type { Icon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cx } from './ui'

/** Tooltip-kaart voor Recharts. */
export function TipKaart({ active, payload, label, formatter, titel }: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; payload?: Record<string, unknown>; dataKey?: string }[]
  label?: ReactNode
  formatter?: (v: number, naam: string) => ReactNode
  titel?: (label: ReactNode, payload: Record<string, unknown> | undefined) => ReactNode
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-40 rounded-2xl border border-line bg-oppervlak/95 px-3.5 py-2.5 text-sm shadow-[var(--shadow-hoog)] backdrop-blur">
      <div className="mb-1.5 font-bold text-ink">{titel ? titel(label, payload[0]?.payload) : label}</div>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={String(p.dataKey ?? p.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="font-semibold tabular-nums text-ink">{formatter ? formatter(Number(p.value), String(p.name)) : p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Legenda({ items, className }: { items: { naam: string; kleur: string; icoon?: Icon }[]; className?: string }) {
  return (
    <div className={cx('flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-2', className)}>
      {items.map((i) => (
        <span key={i.naam} className="flex items-center gap-1.5">
          {i.icoon ? <i.icoon weight="fill" size={14} style={{ color: i.kleur }} /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: i.kleur }} />}
          {i.naam}
        </span>
      ))}
    </div>
  )
}

/** Sequentiële schaal in één tint (licht naar donker). */
export function schaal(t: number, tint: 'blauw' | 'violet' | 'groen' | 'koraal' = 'blauw') {
  const ramps = {
    blauw: ['#f3f8fe', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95'],
    violet: ['#f6f3ff', '#e4dcff', '#c9b9ff', '#a993fb', '#8b6cf0', '#6d4fd6', '#5236aa'],
    groen: ['#f0fbf6', '#c9f0de', '#97e0c0', '#5fca9d', '#2eae7c', '#178c61', '#0d6b4a'],
    koraal: ['#fff5f2', '#ffd9cf', '#ffb5a3', '#ff8d75', '#f4664d', '#d24a33', '#a83524'],
  }[tint]
  const x = Math.max(0, Math.min(0.9999, t)) * (ramps.length - 1)
  const i = Math.floor(x)
  return mix(ramps[i], ramps[i + 1] ?? ramps[i], x - i)
}

function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16))
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`
}

export const inktOp = (t: number) => (t > 0.55 ? 'white' : '#1d1b2f')

/** Matrix (rijen x kolommen) als heatmap met hover-tooltip via title. */
export function Matrix({ rijen, kolommen, waarde, opmaak, tint = 'blauw', onCel }: {
  rijen: { naam: string; label: ReactNode }[]
  kolommen: { naam: string; label: ReactNode }[]
  waarde: (rij: string, kolom: string) => number
  opmaak: (v: number) => string
  tint?: 'blauw' | 'violet' | 'groen' | 'koraal'
  onCel?: (rij: string, kolom: string) => void
}) {
  const alle = rijen.flatMap((r) => kolommen.map((k) => waarde(r.naam, k.naam)))
  const max = Math.max(...alle, 0.0001)
  return (
    <div className="dun-scroll overflow-x-auto">
      <table className="w-full border-separate border-spacing-[3px] text-xs">
        <thead>
          <tr>
            <th />
            {kolommen.map((k) => (
              <th key={k.naam} className="px-1 pb-1 text-center align-bottom font-semibold text-ink-2">{k.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rijen.map((r) => (
            <tr key={r.naam}>
              <th className="whitespace-nowrap pr-2 text-left font-medium text-ink">{r.label}</th>
              {kolommen.map((k) => {
                const v = waarde(r.naam, k.naam)
                const t = v / max
                return (
                  <td
                    key={k.naam}
                    onClick={onCel ? () => onCel(r.naam, k.naam) : undefined}
                    title={`${r.naam} × ${k.naam}: ${opmaak(v)}`}
                    className={cx('h-9 min-w-11 rounded-lg text-center font-semibold tabular-nums transition hover:scale-[1.06] hover:shadow-md', onCel && 'cursor-pointer')}
                    style={{ background: v ? schaal(t, tint) : 'var(--color-vlak)', color: v ? inktOp(t) : 'var(--color-muted)' }}
                  >
                    {v ? opmaak(v) : '·'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
