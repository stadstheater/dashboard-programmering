import { useMemo } from 'react'
import { create } from 'zustand'
import { seizoenVanDatum } from '../data/generate'
import { scenarioNaarVoorstelling, useStore } from '../store/useStore'
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

/** Seizoen waarin een aanbod speelt (op basis van het begin van de speelperiode). */
export const seizoenVanAanbod = (a: { periodeStart: string }) => seizoenVanDatum(a.periodeStart)

/** Matchscores voor al het aanbod, elk tegen het eigen seizoen inclusief scenario. */
export function useMatches() {
  const alle = useStore((s) => s.dataset.voorstellingen)
  const doelen = useStore((s) => s.dataset.doelen)
  const aanbod = useStore((s) => s.dataset.aanbod)
  const scenario = useStore((s) => s.scenario)
  return useMemo(() => {
    const contexten = new Map<string, ReturnType<typeof maakMatchContext>>()
    const contextVoor = (seizoen: string) => {
      let ctx = contexten.get(seizoen)
      if (!ctx) {
        const extra = scenario.flatMap((item) => {
          const a = aanbod.find((x) => x.id === item.aanbodId)
          return a && seizoenVanDatum(item.datum) === seizoen ? [scenarioNaarVoorstelling(item, a)] : []
        })
        ctx = maakMatchContext([...alle.filter((v) => v.seizoen === seizoen), ...extra], alle, doelen)
        contexten.set(seizoen, ctx)
      }
      return ctx
    }
    const uit = new Map<string, Match>()
    for (const a of aanbod) uit.set(a.id, berekenMatch(a, contextVoor(seizoenVanAanbod(a))))
    return uit
  }, [alle, doelen, aanbod, scenario])
}

export function useArtiesten() {
  const alle = useStore((s) => s.dataset.voorstellingen)
  return useMemo(() => artiestProfielen(alle), [alle])
}
