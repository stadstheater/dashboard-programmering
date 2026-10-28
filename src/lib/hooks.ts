import { useMemo } from 'react'
import { create } from 'zustand'
import { PLAN_SEIZOEN } from '../data/vocab'
import { useSeizoen, useStore } from '../store/useStore'
import { artiestProfielen, berekenMatch, maakMatchContext, type Match } from './inzichten'

/** Welke voorstelling of welk aanbod open staat in het detailpaneel. */
export const useSelectie = create<{
  voorstellingId: string | null
  aanbodId: string | null
  toonVoorstelling: (id: string | null) => void
  toonAanbod: (id: string | null) => void
}>((set) => ({
  voorstellingId: null,
  aanbodId: null,
  toonVoorstelling: (voorstellingId) => set({ voorstellingId, aanbodId: null }),
  toonAanbod: (aanbodId) => set({ aanbodId, voorstellingId: null }),
}))

/** Matchscores voor al het aanbod, tegen het planseizoen inclusief scenario. */
export function useMatches() {
  const plan = useSeizoen(PLAN_SEIZOEN, true)
  const alle = useStore((s) => s.dataset.voorstellingen)
  const doelen = useStore((s) => s.dataset.doelen)
  const aanbod = useStore((s) => s.dataset.aanbod)
  return useMemo(() => {
    const ctx = maakMatchContext(plan, alle, doelen)
    const uit = new Map<string, Match>()
    for (const a of aanbod) uit.set(a.id, berekenMatch(a, ctx))
    return uit
  }, [plan, alle, doelen, aanbod])
}

export function useArtiesten() {
  const alle = useStore((s) => s.dataset.voorstellingen)
  return useMemo(() => artiestProfielen(alle), [alle])
}
