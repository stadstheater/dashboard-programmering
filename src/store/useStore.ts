import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { genereerDataset, seizoenVanDatum } from '../data/generate'
import type { Aanbod, AanbodStatus, Dataset, Doelen, Status, Voorstelling, Zaal } from '../data/types'
import { HUIDIG_SEIZOEN, capaciteitVan } from '../data/vocab'

export interface ScenarioItem {
  aanbodId: string
  datum: string
  zaal: Zaal
}

export interface Filters {
  genres: string[]
  zalen: string[]
  statussen: string[]
  doelgroepen: string[]
  motivaties: string[]
  zoek: string
}

export const LEGE_FILTERS: Filters = { genres: [], zalen: [], statussen: [], doelgroepen: [], motivaties: [], zoek: '' }

export type Modus = 'eenvoudig' | 'uitgebreid'
export type Thema = 'licht' | 'donker'

interface State {
  dataset: Dataset
  modus: Modus
  setModus: (m: Modus) => void
  thema: Thema
  setThema: (t: Thema) => void
  zetOptie: (aanbodId: string, datum: string, zaal: Zaal) => void
  seizoen: string
  filters: Filters
  scenario: ScenarioItem[]
  setSeizoen: (s: string) => void
  setFilters: (f: Partial<Filters>) => void
  wisFilters: () => void
  genereer: (seed: number) => void
  laadDataset: (d: Dataset) => void
  upsertVoorstelling: (v: Voorstelling) => void
  verwijderVoorstelling: (id: string) => void
  upsertAanbod: (a: Aanbod) => void
  verwijderAanbod: (id: string) => void
  setAanbodStatus: (id: string, status: AanbodStatus) => void
  setDoelen: (d: Doelen) => void
  voegScenarioToe: (item: ScenarioItem) => void
  verwijderScenario: (aanbodId: string, datum: string) => void
  wisScenario: () => void
  bevestigScenario: () => number
}

/** Opslag in de browser die nooit een fout gooit (privévenster, geblokkeerde opslag). */
const veiligeOpslag = createJSONStorage(() => ({
  getItem: (k) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* opslag vol of geblokkeerd: dan werkt het dashboard zonder bewaren */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* negeren */
    }
  },
}))

export function scenarioNaarVoorstelling(item: ScenarioItem, a: Aanbod, status: Status = 'Concept'): Voorstelling {
  const capaciteit = capaciteitVan(item.zaal)
  const verwacht = Math.min(capaciteit, a.zalen.includes(item.zaal) ? a.verwacht : Math.round(capaciteit * 0.7))
  return {
    id: `s-${a.id}-${item.datum}`,
    seizoen: seizoenVanDatum(item.datum),
    status,
    datum: item.datum,
    tijd: a.genre === 'Jeugd & Familie' ? '14:00' : '20:15',
    titel: a.titel,
    artiest: a.artiest,
    impresariaat: a.impresariaat,
    genre: a.genre,
    leeftijd: null,
    zaal: item.zaal,
    capaciteit,
    verwacht,
    eindstand: verwacht,
    prijs: a.prijsIndicatie,
    uitkoopsom: a.uitkoopsom,
    motivaties: a.motivaties,
    doelgroepen: a.doelgroepen,
    bron: 'scenario',
  }
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      dataset: genereerDataset(),
      modus: 'eenvoudig',
      setModus: (modus) => set({ modus }),
      thema: 'licht',
      setThema: (thema) => set({ thema }),
      zetOptie: (aanbodId, datum, zaal) => {
        const { dataset } = get()
        const a = dataset.aanbod.find((x) => x.id === aanbodId)
        if (!a) return
        const v = { ...scenarioNaarVoorstelling({ aanbodId, datum, zaal }, a, 'Optie'), id: `o-${a.id}-${datum}`, bron: 'builder' as const }
        set({
          dataset: {
            ...dataset,
            voorstellingen: [...dataset.voorstellingen.filter((x) => x.id !== v.id), v].sort((x, y) => x.datum.localeCompare(y.datum)),
            aanbod: dataset.aanbod.map((x) => (x.id === aanbodId ? { ...x, status: 'Ingepland' } : x)),
          },
        })
      },
      seizoen: HUIDIG_SEIZOEN,
      filters: LEGE_FILTERS,
      scenario: [],
      setSeizoen: (seizoen) => set({ seizoen }),
      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
      wisFilters: () => set({ filters: LEGE_FILTERS }),
      genereer: (seed) => set({ dataset: genereerDataset(seed), scenario: [] }),
      laadDataset: (dataset) => set({ dataset, scenario: [] }),
      upsertVoorstelling: (v) =>
        set(({ dataset }) => {
          const bestaat = dataset.voorstellingen.some((x) => x.id === v.id)
          const voorstellingen = bestaat
            ? dataset.voorstellingen.map((x) => (x.id === v.id ? v : x))
            : [...dataset.voorstellingen, v]
          return { dataset: { ...dataset, voorstellingen: voorstellingen.sort((a, b) => a.datum.localeCompare(b.datum)) } }
        }),
      verwijderVoorstelling: (id) =>
        set(({ dataset }) => ({ dataset: { ...dataset, voorstellingen: dataset.voorstellingen.filter((v) => v.id !== id) } })),
      upsertAanbod: (a) =>
        set(({ dataset }) => {
          const bestaat = dataset.aanbod.some((x) => x.id === a.id)
          return {
            dataset: {
              ...dataset,
              aanbod: bestaat ? dataset.aanbod.map((x) => (x.id === a.id ? a : x)) : [a, ...dataset.aanbod],
            },
          }
        }),
      verwijderAanbod: (id) =>
        set(({ dataset, scenario }) => ({
          dataset: { ...dataset, aanbod: dataset.aanbod.filter((a) => a.id !== id) },
          scenario: scenario.filter((s) => s.aanbodId !== id),
        })),
      setAanbodStatus: (id, status) =>
        set(({ dataset }) => ({
          dataset: { ...dataset, aanbod: dataset.aanbod.map((a) => (a.id === id ? { ...a, status } : a)) },
        })),
      setDoelen: (doelen) => set(({ dataset }) => ({ dataset: { ...dataset, doelen } })),
      voegScenarioToe: (item) =>
        set(({ scenario }) => ({
          scenario: [...scenario.filter((s) => !(s.aanbodId === item.aanbodId && s.datum === item.datum)), item],
        })),
      verwijderScenario: (aanbodId, datum) =>
        set(({ scenario }) => ({ scenario: scenario.filter((s) => !(s.aanbodId === aanbodId && s.datum === datum)) })),
      wisScenario: () => set({ scenario: [] }),
      bevestigScenario: () => {
        const { scenario, dataset } = get()
        const nieuw = scenario.flatMap((item) => {
          const a = dataset.aanbod.find((x) => x.id === item.aanbodId)
          return a ? [{ ...scenarioNaarVoorstelling(item, a, 'Optie'), id: `o-${a.id}-${item.datum}`, bron: 'builder' as const }] : []
        })
        const ingepland = new Set(scenario.map((s) => s.aanbodId))
        set({
          scenario: [],
          dataset: {
            ...dataset,
            voorstellingen: [...dataset.voorstellingen, ...nieuw].sort((a, b) => a.datum.localeCompare(b.datum)),
            aanbod: dataset.aanbod.map((a) => (ingepland.has(a.id) ? { ...a, status: 'Ingepland' } : a)),
          },
        })
        return nieuw.length
      },
    }),
    {
      name: 'coulisse-dashboard-v2',
      storage: veiligeOpslag,
      partialize: ({ dataset, seizoen, scenario, modus, thema }) => ({ dataset, seizoen, scenario, modus, thema }),
    },
  ),
)

/** Voorstellingen van een seizoen, inclusief scenario-items wanneer gevraagd. */
export function useSeizoen(seizoen?: string, metScenario = false) {
  const s = useStore((st) => seizoen ?? st.seizoen)
  const voorstellingen = useStore((st) => st.dataset.voorstellingen)
  const scenario = useStore((st) => st.scenario)
  const aanbod = useStore((st) => st.dataset.aanbod)
  return useMemo(() => {
    const basis = voorstellingen.filter((v) => v.seizoen === s)
    if (!metScenario) return basis
    const extra = scenario.flatMap((item) => {
      const a = aanbod.find((x) => x.id === item.aanbodId)
      return a && seizoenVanDatum(item.datum) === s ? [scenarioNaarVoorstelling(item, a)] : []
    })
    return [...basis, ...extra].sort((a, b) => a.datum.localeCompare(b.datum))
  }, [s, voorstellingen, scenario, aanbod, metScenario])
}

export function pasFiltersToe(lijst: Voorstelling[], f: Filters) {
  const zoek = f.zoek.trim().toLowerCase()
  return lijst.filter(
    (v) =>
      (!f.genres.length || f.genres.includes(v.genre)) &&
      (!f.zalen.length || f.zalen.includes(v.zaal)) &&
      (!f.statussen.length || f.statussen.includes(v.status)) &&
      (!f.doelgroepen.length || v.doelgroepen.some((d) => f.doelgroepen.includes(d))) &&
      (!f.motivaties.length || v.motivaties.some((m) => f.motivaties.includes(m))) &&
      (!zoek || `${v.titel} ${v.artiest} ${v.impresariaat}`.toLowerCase().includes(zoek)),
  )
}
