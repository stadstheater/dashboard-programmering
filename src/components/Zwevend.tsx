import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'

/**
 * Zwevend blok (dropdown, uitlegballon) dat los van de pagina boven alles wordt getekend.
 * Zo valt het nooit weg onder kaarten, animaties of de bovenbalk. Het blijft binnen het scherm.
 */
export default function Zwevend({ anker, open, onSluit, children, boven, links, className }: {
  anker: RefObject<HTMLElement | null>
  open: boolean
  onSluit?: () => void
  children: ReactNode
  boven?: boolean
  links?: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const meet = () => {
      const a = anker.current?.getBoundingClientRect()
      const el = ref.current
      if (!a || !el) return
      const h = el.offsetHeight
      const w = el.offsetWidth
      const marge = 8
      const onder = a.bottom + marge
      const erboven = a.top - h - marge
      let top = boven ? erboven : onder
      if (!boven && onder + h > window.innerHeight - marge && erboven > marge) top = erboven
      if (boven && erboven < marge) top = onder
      top = Math.max(marge, Math.min(top, window.innerHeight - h - marge))
      const left = Math.max(marge, Math.min(links ? a.left : a.left + a.width / 2 - w / 2, window.innerWidth - w - marge))
      setPos({ top, left })
    }
    meet()
    window.addEventListener('scroll', meet, true)
    window.addEventListener('resize', meet)
    return () => {
      window.removeEventListener('scroll', meet, true)
      window.removeEventListener('resize', meet)
    }
  }, [open, anker, boven, links])

  useEffect(() => {
    if (!open || !onSluit) return
    const buiten = (e: MouseEvent) => {
      const t = e.target as Node
      if (!anker.current?.contains(t) && !ref.current?.contains(t)) onSluit()
    }
    const toets = (e: KeyboardEvent) => e.key === 'Escape' && onSluit()
    document.addEventListener('mousedown', buiten)
    document.addEventListener('keydown', toets)
    return () => {
      document.removeEventListener('mousedown', buiten)
      document.removeEventListener('keydown', toets)
    }
  }, [open, onSluit, anker])

  if (!open) return null
  return createPortal(
    <div ref={ref} className={className} style={{ position: 'fixed', zIndex: 65, top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? 'visible' : 'hidden' }}>
      {children}
    </div>,
    document.body,
  )
}
