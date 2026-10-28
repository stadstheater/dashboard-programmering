export type Zaal = 'Grote zaal' | 'Kleine zaal' | 'Theatercafé'

export type Status =
  | 'Bevestigd'
  | 'Optie'
  | 'Concept'
  | 'Geannuleerd'
  | 'Financieel af te handelen'
  | 'Financieel afgehandeld'

export type AanbodStatus = 'Nieuw' | 'Bekeken' | 'Shortlist' | 'Afgewezen' | 'Ingepland'

export type Bron = 'excel' | 'dummy' | 'builder' | 'scenario'

export interface Voorstelling {
  id: string
  /** Korte seizoenscode, bijvoorbeeld "26/27". */
  seizoen: string
  status: Status
  /** ISO datum (yyyy-mm-dd). */
  datum: string
  tijd: string
  titel: string
  artiest: string
  impresariaat: string
  genre: string
  leeftijd: string | null
  zaal: Zaal
  capaciteit: number
  verwacht: number
  /** Eindstand aan bezoekers (dummy). Voor voorstellingen in het verleden is dit het werkelijke aantal. */
  eindstand: number
  prijs: number
  uitkoopsom: number
  motivaties: string[]
  doelgroepen: string[]
  notitie?: string
  bron: Bron
}

export interface Aanbod {
  id: string
  titel: string
  artiest: string
  impresariaat: string
  genre: string
  omschrijving: string
  zalen: Zaal[]
  periodeStart: string
  periodeEind: string
  beschikbareData: string[]
  uitkoopsom: number
  prijsIndicatie: number
  duur: number
  verwacht: number
  motivaties: string[]
  doelgroepen: string[]
  premiere: boolean
  status: AanbodStatus
  ontvangen: string
}

export interface Doelen {
  /** Streefaandeel per doelgroep in procenten van het bereik. */
  doelgroepen: Record<string, number>
  motivaties: Record<string, number>
  genres: Record<string, number>
  bezetting: number
  aantal: number
}

export interface Dataset {
  seed: number
  gegenereerdOp: string
  voorstellingen: Voorstelling[]
  aanbod: Aanbod[]
  doelen: Doelen
}
