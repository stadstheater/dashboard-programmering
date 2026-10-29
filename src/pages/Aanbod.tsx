import { CheckCircle, MagnifyingGlass, Star, Tray } from '@phosphor-icons/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CdmLabel, GenreLabel, Leeg, Paginakop, PastBijOns, cx } from '../components/ui'
import { GENRES, HUIDIG_SEIZOEN, MOTIVATIES, PLAN_SEIZOEN, segmentVan } from '../data/vocab'
import { staffel } from '../lib/animatie'
import { seizoenVanAanbod, useMatches, useSelectie } from '../lib/hooks'
import { useStore } from '../store/useStore'

export default function Aanbod() {
  const aanbod = useStore((s) => s.dataset.aanbod)
  const setStatus = useStore((s) => s.setAanbodStatus)
  const toon = useSelectie((s) => s.toonAanbod)
  const matches = useMatches()
  const [zoek, setZoek] = useState('')
  const [genre, setGenre] = useState('')
  const [alleenGoed, setAlleenGoed] = useState(false)
  const [alleenBewaard, setAlleenBewaard] = useState(false)
  const [aantal, setAantal] = useState(24)
  const gekozenSeizoen = useStore((s) => s.seizoen)
  const setSeizoen = useStore((s) => s.setSeizoen)
  const seizoen = gekozenSeizoen === HUIDIG_SEIZOEN ? HUIDIG_SEIZOEN : PLAN_SEIZOEN
  const afgelopen = gekozenSeizoen < HUIDIG_SEIZOEN

  const meer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = meer.current
    if (!el) return
    const kijker = new IntersectionObserver(([e]) => e.isIntersecting && setAantal((n) => n + 24), { rootMargin: '400px' })
    kijker.observe(el)
    return () => kijker.disconnect()
  })

  const seizoenAanbod = useMemo(() => aanbod.filter((a) => seizoenVanAanbod(a) === seizoen && a.status !== 'Afgewezen'), [aanbod, seizoen])
  const bewaard = seizoenAanbod.filter((a) => a.status === 'Shortlist').length

  const lijst = useMemo(() => {
    const q = zoek.trim().toLowerCase()
    return seizoenAanbod
      .filter(
        (a) =>
          (!genre || a.genre === genre) &&
          (!alleenBewaard || a.status === 'Shortlist') &&
          (!alleenGoed || (matches.get(a.id)?.score ?? 0) >= 70) &&
          (!q || `${a.titel} ${a.artiest} ${a.impresariaat}`.toLowerCase().includes(q)),
      )
      .sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0))
  }, [seizoenAanbod, genre, alleenBewaard, alleenGoed, zoek, matches])

  return (
    <div>
      <Paginakop
        titel="Aanbod"
        icoon={Tray}
        kleur="#d97706"
        sub={`Wat impresariaten ons aanbieden voor ${seizoen === HUIDIG_SEIZOEN ? 'dit seizoen, vanaf vandaag' : 'volgend seizoen'}. Bovenaan staat wat het best bij ons past.`}
      />

      {afgelopen && (
        <div className="verschijn mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-citroen px-4 py-3 text-sm font-medium">
          Voor afgelopen seizoenen is er geen aanbod meer. Je ziet nu het aanbod voor volgend seizoen.
          <div className="flex gap-2">
            <button className="knop knop-zacht !py-1.5" onClick={() => setSeizoen(HUIDIG_SEIZOEN)}>Dit seizoen</button>
            <button className="knop knop-primair !py-1.5" onClick={() => setSeizoen(PLAN_SEIZOEN)}>Volgend seizoen</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="relative w-full sm:w-auto sm:min-w-56 sm:flex-1">
          <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="invoer !rounded-full !py-3 !pl-10 !text-base" aria-label="Zoeken" placeholder="Zoek een voorstelling of artiest" value={zoek} onChange={(e) => setZoek(e.target.value)} />
        </div>
        <div className="dun-scroll -mx-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 pb-0.5 sm:contents">
        <select className="invoer !w-auto shrink-0 !rounded-full !py-2.5 sm:!py-3 !text-base" aria-label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">Alle genres</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <button onClick={() => setAlleenGoed(!alleenGoed)} aria-pressed={alleenGoed} className={cx('knop shrink-0 whitespace-nowrap !px-4 !py-2.5 sm:!py-3 text-[15px]', alleenGoed ? 'knop-primair' : 'knop-zacht')}>
          <CheckCircle size={18} /> Past goed
        </button>
        <button onClick={() => setAlleenBewaard(!alleenBewaard)} aria-pressed={alleenBewaard} className={cx('knop shrink-0 whitespace-nowrap !px-4 !py-2.5 sm:!py-3 text-[15px]', alleenBewaard ? 'knop-primair' : 'knop-zacht')}>
          <Star size={18} /> Bewaard ({bewaard})
        </button>
        </div>
      </div>

      <div className="mt-4 text-sm text-ink-2">{lijst.length} voorstellingen</div>
      {!lijst.length && <div className="mt-3"><Leeg>Geen aanbod met deze keuzes.</Leeg></div>}

      <div className="mt-3 grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lijst.slice(0, aantal).map((a, i) => {
          const m = matches.get(a.id)
          const plus = m?.redenen.find((r) => r.type === 'plus')
          return (
            <article key={a.id} data-uitleg={i === 0 ? 'aanbod-kaart' : undefined} style={staffel(i % 24)} className="kaart verschijn flex cursor-pointer flex-col p-4 transition sm:p-5 duration-300 hover:-translate-y-1" onClick={() => toon(a.id)}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <PastBijOns score={m?.score ?? 0} />
                    {a.status === 'Ingepland' && <span className="rounded-full bg-lavendel px-2.5 py-1 text-xs font-bold text-violet-700">Ingepland</span>}
                  </div>
                  <h3 className="font-display text-lg font-bold leading-snug">{a.titel}</h3>
                  <div className="text-sm text-ink-2">{a.impresariaat}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setStatus(a.id, a.status === 'Shortlist' ? 'Bekeken' : 'Shortlist') }}
                  className={cx('tik grid h-10 w-10 shrink-0 place-items-center rounded-full transition', a.status === 'Shortlist' ? 'bg-citroen text-amber-500' : 'bg-vlak text-muted hover:text-amber-500')}
                  aria-label={a.status === 'Shortlist' ? 'Niet meer bewaren' : 'Bewaren'}
                  aria-pressed={a.status === 'Shortlist'}
                  title={a.status === 'Shortlist' ? 'Bewaard' : 'Bewaren'}
                  data-uitleg={i === 0 ? 'shortlist' : undefined}
                >
                  <Star key={a.status} size={18} weight={a.status === 'Shortlist' ? 'fill' : 'bold'} className={a.status === 'Shortlist' ? 'spring' : ''} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1">
                <GenreLabel genre={a.genre} klein />
                {a.doelgroepen.map((d) => <CdmLabel key={d} naam={d} groot />)}
                <span className="ml-auto flex gap-1">{a.motivaties.map((x) => { const s = segmentVan(MOTIVATIES, x); return s ? <span key={x} title={s.naam}><s.icoon size={16} style={{ color: s.kleur }} /></span> : null })}</span>
              </div>
              {plus && <p className="mt-3 text-sm text-ink-2">{plus.tekst}</p>}
              <div className="mt-auto pt-3 text-sm font-semibold text-violet-700">Bekijk en plan in →</div>
            </article>
          )
        })}
      </div>
      {lijst.length > aantal && (
        <div ref={meer} className="mt-6 text-center">
          <button className="knop knop-zacht" onClick={() => setAantal(aantal + 24)}>Toon meer ({lijst.length - aantal} over)</button>
        </div>
      )}
    </div>
  )
}
