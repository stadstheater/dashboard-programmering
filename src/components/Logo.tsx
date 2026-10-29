import { cx } from './ui'

/** Beeldmerk van Coulisse: een open C (het toneel) met een spot in het midden. Kleur via currentColor. */
export function Beeldmerk({ grootte = 32, className }: { grootte?: number; className?: string }) {
  return (
    <svg width={grootte} height={grootte} viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path d="M37.6 13.4A16 16 0 1 0 37.6 34.6" fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
      <circle cx={31} cy={24} r={4} fill="currentColor" />
    </svg>
  )
}

/** Beeldmerk met woordmerk. */
export default function Logo({ klein, className }: { klein?: boolean; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5 text-ink', className)} aria-label="Coulisse">
      <Beeldmerk grootte={klein ? 26 : 30} />
      <span className={cx('font-display font-extrabold leading-none tracking-[-0.035em]', klein ? 'text-xl' : 'text-[1.6rem]')}>Coulisse</span>
    </span>
  )
}
