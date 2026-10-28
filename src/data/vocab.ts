import type { AanbodStatus, Status, Zaal } from './types'

export const SEIZOENEN = ['22/23', '23/24', '24/25', '25/26', '26/27', '27/28'] as const
export const HUIDIG_SEIZOEN = '26/27'
export const PLAN_SEIZOEN = '27/28'

export const ZALEN: { naam: Zaal; capaciteit: number; kort: string }[] = [
  { naam: 'Grote zaal', capaciteit: 760, kort: 'GZ' },
  { naam: 'Kleine zaal', capaciteit: 160, kort: 'KZ' },
  { naam: 'Theatercafé', capaciteit: 90, kort: 'TC' },
]

export const capaciteitVan = (zaal: Zaal) => ZALEN.find((z) => z.naam === zaal)?.capaciteit ?? 160

export const STATUSSEN: { naam: Status; kleur: string; zacht: string }[] = [
  { naam: 'Bevestigd', kleur: '#16a34a', zacht: '#dcfce7' },
  { naam: 'Optie', kleur: '#d97706', zacht: '#fef3c7' },
  { naam: 'Concept', kleur: '#7c3aed', zacht: '#ede9fe' },
  { naam: 'Financieel af te handelen', kleur: '#0284c7', zacht: '#e0f2fe' },
  { naam: 'Financieel afgehandeld', kleur: '#475569', zacht: '#e2e8f0' },
  { naam: 'Geannuleerd', kleur: '#dc2626', zacht: '#fee2e2' },
]

export const AANBOD_STATUSSEN: { naam: AanbodStatus; kleur: string; zacht: string }[] = [
  { naam: 'Nieuw', kleur: '#2a78d6', zacht: '#dbeafe' },
  { naam: 'Bekeken', kleur: '#475569', zacht: '#e2e8f0' },
  { naam: 'Shortlist', kleur: '#d97706', zacht: '#fef3c7' },
  { naam: 'Ingepland', kleur: '#16a34a', zacht: '#dcfce7' },
  { naam: 'Afgewezen', kleur: '#dc2626', zacht: '#fee2e2' },
]

/** Categorisch palet (gevalideerd op kleurenblindheid, vaste volgorde). */
export const PALET = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948', '#0e9fb5']

export interface Segment {
  naam: string
  kort: string
  kleur: string
  emoji: string
  omschrijving: string
  /** Dummy aandeel van dit segment in het verzorgingsgebied (procent). */
  marktaandeel: number
}

export const DOELGROEPEN: Segment[] = [
  { naam: 'Klassieke Cultuurliefhebbers', kort: 'Klassiek', kleur: PALET[0], emoji: '🎻', marktaandeel: 9, omschrijving: 'Ouder, hoogopgeleid en trouw. Kiest voor kwaliteit, gevestigde namen en traditie.' },
  { naam: 'Weelderige Cultuurminnaars', kort: 'Weelderig', kleur: PALET[1], emoji: '🥂', marktaandeel: 8, omschrijving: 'Welgesteld en breed geïnteresseerd. Combineert een avond uit graag met diner en arrangement.' },
  { naam: 'Proevende Buitenwijkers', kort: 'Proevend', kleur: PALET[2], emoji: '🍿', marktaandeel: 15, omschrijving: 'Gezinnen en stellen uit de buitenwijken die af en toe gaan voor bekende namen en een gezellige avond.' },
  { naam: 'Actieve Vermaakvangers', kort: 'Vermaak', kleur: PALET[3], emoji: '🎉', marktaandeel: 13, omschrijving: 'Jonger en actief. Zoekt vermaak, humor en grote shows en beslist vaak laat.' },
  { naam: 'Lokale Vrijetijdsgenieters', kort: 'Lokaal', kleur: PALET[4], emoji: '🏡', marktaandeel: 18, omschrijving: 'Sterk lokaal georiënteerd, prijsbewust en gericht op toegankelijk en herkenbaar aanbod.' },
  { naam: 'Kindrijke Cultuurvreters', kort: 'Kindrijk', kleur: PALET[5], emoji: '🧸', marktaandeel: 12, omschrijving: 'Jonge gezinnen die cultuur belangrijk vinden voor hun kinderen. Familievoorstellingen en vakanties.' },
  { naam: 'Sociale Cultuurhoppers', kort: 'Sociaal', kleur: PALET[6], emoji: '👯', marktaandeel: 9, omschrijving: 'Gaat graag met vrienden uit, staat open voor nieuw werk en deelt ervaringen online.' },
  { naam: 'Flanerende Plezierzoekers', kort: 'Flanerend', kleur: PALET[7], emoji: '🛍️', marktaandeel: 10, omschrijving: 'Stedelijk en spontaan. Combineert uitgaan met winkelen en horeca, kiest voor plezier.' },
  { naam: 'Culturele Alleseters', kort: 'Alleseter', kleur: PALET[8], emoji: '🌍', marktaandeel: 6, omschrijving: 'Zeer cultuurminded en veelbezoeker van alle disciplines, ook experimenteel en internationaal.' },
]

export const MOTIVATIES: Segment[] = [
  { naam: 'Plezier', kort: 'Plezier', kleur: PALET[0], emoji: '😄', marktaandeel: 0, omschrijving: 'Een leuke avond uit, lachen en ontspannen.' },
  { naam: 'Populair', kort: 'Populair', kleur: PALET[1], emoji: '⭐', marktaandeel: 0, omschrijving: 'Bekende namen en titels waar iedereen het over heeft.' },
  { naam: 'Traditioneel', kort: 'Traditie', kleur: PALET[2], emoji: '🎄', marktaandeel: 0, omschrijving: 'Vaste waarden en jaarlijkse rituelen, zoals de kerstvoorstelling.' },
  { naam: 'Ontdekken', kort: 'Ontdekken', kleur: PALET[3], emoji: '🧭', marktaandeel: 0, omschrijving: 'Nieuwe makers, onbekende genres en verrassingen.' },
  { naam: 'Inhoudelijk', kort: 'Inhoud', kleur: PALET[4], emoji: '🧠', marktaandeel: 0, omschrijving: 'Verdieping, maatschappelijke thema\'s en vakmanschap.' },
  { naam: 'Inspiratie', kort: 'Inspiratie', kleur: PALET[5], emoji: '✨', marktaandeel: 0, omschrijving: 'Geraakt en geïnspireerd worden, nieuwe ideeën opdoen.' },
  { naam: 'Toegankelijk & betaalbaar theater', kort: 'Toegankelijk', kleur: PALET[6], emoji: '🎟️', marktaandeel: 0, omschrijving: 'Laagdrempelig en voor een betaalbare prijs.' },
  { naam: 'Leerzaam', kort: 'Leerzaam', kleur: PALET[7], emoji: '📚', marktaandeel: 0, omschrijving: 'Iets opsteken, bijvoorbeeld via een theatercollege.' },
]

export const segmentVan = (lijst: Segment[], naam: string) => lijst.find((s) => s.naam === naam)

export const GENRES = [
  'Cabaret', 'Muziek', 'Jeugd & Familie', 'Musical', 'Toneel', 'Show', 'Special',
  'Theatercollege', 'Muziektheater', 'Dans', 'Klassieke muziek', 'Opera',
]

/** Genres zijn gebundeld in acht families zodat elke familie een vaste kleur heeft. */
export const GENRE_FAMILIES: { naam: string; kleur: string; emoji: string; genres: string[] }[] = [
  { naam: 'Cabaret', kleur: PALET[0], emoji: '🎤', genres: ['Cabaret'] },
  { naam: 'Muziek', kleur: PALET[1], emoji: '🎸', genres: ['Muziek'] },
  { naam: 'Jeugd & Familie', kleur: PALET[2], emoji: '🎈', genres: ['Jeugd & Familie'] },
  { naam: 'Musical', kleur: PALET[3], emoji: '🎶', genres: ['Musical', 'Muziektheater'] },
  { naam: 'Show & Special', kleur: PALET[4], emoji: '🪩', genres: ['Show', 'Special'] },
  { naam: 'Toneel & Woord', kleur: PALET[5], emoji: '🎭', genres: ['Toneel', 'Theatercollege'] },
  { naam: 'Dans', kleur: PALET[6], emoji: '💃', genres: ['Dans'] },
  { naam: 'Klassiek & Opera', kleur: PALET[7], emoji: '🎼', genres: ['Klassieke muziek', 'Opera'] },
]

export const familieVan = (genre: string) =>
  GENRE_FAMILIES.find((f) => f.genres.includes(genre)) ?? GENRE_FAMILIES[4]

export const GEMIDDELDE_PRIJS: Record<string, number> = {
  Cabaret: 29, Muziek: 34, 'Jeugd & Familie': 17, Musical: 46, Toneel: 31, Show: 39, Special: 27,
  Theatercollege: 21, Muziektheater: 33, Dans: 31, 'Klassieke muziek': 26, Opera: 48,
}

export const IMPRESARIATEN = [
  'Coulisse Producties', 'Lichtspoor Impresariaat', 'Rode Loper Theaterbureau', 'Spotlight & Co',
  'De Zaalmeester', 'Vlam Theaterproducties', 'Bühnebureau Noord', 'Polderpodium Agency',
  'Tournee Totaal', 'Applaus Impresariaat', 'Zwaan Theaterzaken', 'Kleinkunstbureau Pieterse',
  'Familietheater Fabriek', 'Klassiek Collectief', 'Danshuis Producties',
]

/** Gewicht van de 1e t/m 4e doelgroep en 1e en 2e motivatie bij het berekenen van bereik. */
export const DOELGROEP_GEWICHTEN = [0.4, 0.3, 0.2, 0.1]
export const MOTIVATIE_GEWICHTEN = [0.6, 0.4]
