import { useMemo } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { genereerDataset, seizoenVanDatum, STANDAARD_DOELEN } from '../data/generate'
import type { Aanbod, AanbodStatus, Dataset, Doelen, Voorstelling, Zaal } from '../data/types'
import { HUIDIG_SEIZOEN, SEIZOENEN, capaciteitVan } from '../data/vocab'

export interface Filters {
  genres: string[]
  zalen: string[]
  statussen: string[]
  doelgroepen: string[]
  motivaties: string[]
  zoek: string
}

export const LEGE_FILTERS: Filters = { genres: [], zalen: [], statussen: [], doelgroepen: [], motivaties: [], zoek: '' }

export type Thema = 'licht' | 'donker'

interface State {
  dataset: Dataset
  thema: Thema
  setThema: (t: Thema) => void
  zetOptie: (aanbodId: string, datum: string, zaal: Zaal) => void
  seizoen: string
  filters: Filters
  setSeizoen: (s: string) => void
  setFilters: (f: Partial<Filters>) => void
  wisFilters: () => void
  opnieuwBeginnen: () => void
  upsertVoorstelling: (v: Voorstelling) => void
  verwijderVoorstelling: (id: string) => void
  setAanbodStatus: (id: string, status: AanbodStatus) => void
  setDoelen: (d: Doelen) => void
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

export const OPSLAG_SLEUTEL = 'coulisse-dashboard-v2'

/** Maakt van een aanbod op een datum een voorstelling in de kalender. */
export function aanbodNaarVoorstelling(a: Aanbod, datum: string, zaal: Zaal): Voorstelling {
  const capaciteit = capaciteitVan(zaal)
  const verwacht = Math.min(capaciteit, a.zalen.includes(zaal) ? a.verwacht : Math.round(capaciteit * 0.7))
  return {
    id: `o-${a.id}-${datum}`,
    seizoen: seizoenVanDatum(datum),
    status: 'Optie',
    datum,
    tijd: a.genre === 'Jeugd & Familie' ? '14:00' : '20:15',
    titel: a.titel,
    artiest: a.artiest,
    impresariaat: a.impresariaat,
    genre: a.genre,
    leeftijd: null,
    zaal,
    capaciteit,
    verwacht,
    eindstand: verwacht,
    prijs: a.prijsIndicatie,
    uitkoopsom: a.uitkoopsom,
    motivaties: a.motivaties,
    doelgroepen: a.doelgroepen,
    bron: 'builder',
  }
}

const isTekstLijst = (x: unknown) => Array.isArray(x) && x.every((y) => typeof y === 'string')

/** Controleert of opgeslagen data compleet genoeg is om het dashboard mee te tekenen. */
export function isGeldigeDataset(d: unknown): d is Dataset {
  const ds = d as Dataset
  if (!ds || !Array.isArray(ds.voorstellingen) || !Array.isArray(ds.aanbod) || !ds.doelen) return false
  const v = ds.voorstellingen.every((x) =>
    x && typeof x.id === 'string' && typeof x.datum === 'string' && typeof x.titel === 'string' && typeof x.capaciteit === 'number'
      && isTekstLijst(x.doelgroepen) && isTekstLijst(x.motivaties))
  const a = ds.aanbod.every((x) =>
    x && typeof x.id === 'string' && typeof x.periodeStart === 'string' && isTekstLijst(x.zalen) && x.zalen.length > 0
      && isTekstLijst(x.beschikbareData) && isTekstLijst(x.doelgroepen) && isTekstLijst(x.motivaties))
  const doelen = ['doelgroepen', 'motivaties', 'genres'].every((k) => typeof (ds.doelen as unknown as Record<string, unknown>)[k] === 'object')
  return v && a && doelen
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      dataset: genereerDataset(),
      thema: 'licht',
      setThema: (thema) => set({ thema }),
      zetOptie: (aanbodId, datum, zaal) => {
        const { dataset } = get()
        const a = dataset.aanbod.find((x) => x.id === aanbodId)
        if (!a) return
        const v = aanbodNaarVoorstelling(a, datum, zaal)
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
      setSeizoen: (seizoen) => set({ seizoen }),
      setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
      wisFilters: () => set({ filters: LEGE_FILTERS }),
      opnieuwBeginnen: () => set({ dataset: genereerDataset(), seizoen: HUIDIG_SEIZOEN, filters: LEGE_FILTERS }),
      upsertVoorstelling: (v) =>
        set(({ dataset }) => {
          const bestaat = dataset.voorstellingen.some((x) => x.id === v.id)
          const voorstellingen = bestaat
            ? dataset.voorstellingen.map((x) => (x.id === v.id ? v : x))
            : [...dataset.voorstellingen, v]
          return { dataset: { ...dataset, voorstellingen: voorstellingen.sort((a, b) => a.datum.localeCompare(b.datum)) } }
        }),
      verwijderVoorstelling: (id) =>
        set(({ dataset }) => {
          const weg = dataset.voorstellingen.find((v) => v.id === id)
          const voorstellingen = dataset.voorstellingen.filter((v) => v.id !== id)
          // Een optie uit het aanbod vrijgeven: het aanbod is weer beschikbaar als er geen andere optie van is.
          const aanbodId = weg?.id.startsWith('o-') ? weg.id.slice(2, -11) : null
          const nogIngepland = aanbodId && voorstellingen.some((v) => v.id.startsWith(`o-${aanbodId}-`))
          return {
            dataset: {
              ...dataset,
              voorstellingen,
              aanbod: aanbodId && !nogIngepland ? dataset.aanbod.map((a) => (a.id === aanbodId ? { ...a, status: 'Shortlist' } : a)) : dataset.aanbod,
            },
          }
        }),
      setAanbodStatus: (id, status) =>
        set(({ dataset }) => ({
          dataset: { ...dataset, aanbod: dataset.aanbod.map((a) => (a.id === id ? { ...a, status } : a)) },
        })),
      setDoelen: (doelen) => set(({ dataset }) => ({ dataset: { ...dataset, doelen } })),
    }),
    {
      name: OPSLAG_SLEUTEL,
      storage: veiligeOpslag,
      // Versie 2: geanonimiseerde basis en geen uitgebreide modus meer. Oude data wordt vervangen, de doelen blijven.
      version: 2,
      migrate: (opgeslagen, versie) => {
        const st = (opgeslagen ?? {}) as Partial<State>
        if (versie < 2) {
          const doelen = st.dataset?.doelen
          return { thema: st.thema, seizoen: HUIDIG_SEIZOEN, dataset: { ...genereerDataset(), doelen: doelen ?? STANDAARD_DOELEN } } as State
        }
        return st as State
      },
      // Onvolledige of verouderde opslag (bijvoorbeeld uit een vorig seizoen) vervangen we door verse voorbeelddata.
      merge: (opgeslagen, huidig) => {
        const st = (opgeslagen ?? {}) as Partial<State>
        const geldig = isGeldigeDataset(st.dataset) && seizoenVanDatum(st.dataset.gegenereerdOp.slice(0, 10)) === HUIDIG_SEIZOEN
        return {
          ...huidig,
          thema: st.thema === 'donker' ? 'donker' : 'licht',
          seizoen: st.seizoen && SEIZOENEN.includes(st.seizoen) ? st.seizoen : HUIDIG_SEIZOEN,
          dataset: geldig ? st.dataset! : { ...huidig.dataset, doelen: st.dataset?.doelen ?? huidig.dataset.doelen },
        }
      },
      partialize: ({ dataset, seizoen, thema }) => ({ dataset, seizoen, thema }),
    },
  ),
)

/** Voorstellingen van een seizoen. */
export function useSeizoen(seizoen?: string) {
  const s = useStore((st) => seizoen ?? st.seizoen)
  const voorstellingen = useStore((st) => st.dataset.voorstellingen)
  return useMemo(() => voorstellingen.filter((v) => v.seizoen === s), [s, voorstellingen])
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
