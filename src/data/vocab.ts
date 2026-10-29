import {
  Balloon, Bank, Baby, Binoculars, BookOpen, Brain, Champagne, Coffee, Compass, Confetti, DiscoBall, Fire, GlobeHemisphereWest, Guitar, HouseLine,
  MaskHappy, Microphone, MusicNotes, PersonArmsSpread, PianoKeys, Popcorn, ShoppingBag, Smiley, Sparkle, Star, Ticket,
  RocketLaunch, TreeEvergreen, UsersThree, type Icon,
} from '@phosphor-icons/react'
import type { AanbodStatus, Status, Zaal } from './types'

/** Een seizoen loopt van augustus tot en met juli. Het lopende seizoen volgt uit de datum van vandaag. */
const nu = new Date()
export const HUIDIG_STARTJAAR = nu.getMonth() >= 7 ? nu.getFullYear() : nu.getFullYear() - 1
export const seizoenLabel = (startjaar: number) => `${String(startjaar % 100).padStart(2, '0')}/${String((startjaar + 1) % 100).padStart(2, '0')}`
/** Vier seizoenen historie, het lopende seizoen en het seizoen in opbouw. */
export const SEIZOENEN: string[] = [-4, -3, -2, -1, 0, 1].map((i) => seizoenLabel(HUIDIG_STARTJAAR + i))
export const HUIDIG_SEIZOEN = seizoenLabel(HUIDIG_STARTJAAR)
export const PLAN_SEIZOEN = seizoenLabel(HUIDIG_STARTJAAR + 1)

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

export type Hoofdgroep = 'Intensief' | 'Medium' | 'Licht'

export interface Segment {
  naam: string
  /** Afkorting bij doelgroepen (zoals in de CDM-brochure), korte naam bij motivaties. */
  kort: string
  kleur: string
  icoon: Icon
  omschrijving: string
  /** Dummy aandeel van dit segment in het verzorgingsgebied (procent). */
  marktaandeel: number
  hoofdgroep?: Hoofdgroep
}

export const HOOFDGROEPEN: { naam: Hoofdgroep; uitleg: string }[] = [
  { naam: 'Intensief', uitleg: 'Gaan vaak en graag naar cultuur' },
  { naam: 'Medium', uitleg: 'Gaan regelmatig, vooral voor vermaak en bekende namen' },
  { naam: 'Licht', uitleg: 'Gaan af en toe, als het dichtbij, gezellig of betaalbaar is' },
]

/**
 * Cultureel Doelgroepenmodel. Kleuren volgens Rotterdam Festivals (handout 2024).
 * Bruisende en Ontspannen Buitenwijkers staan niet in die handout: hun kleuren zijn voorlopig gekozen.
 */
export const DOELGROEPEN: Segment[] = [
  { naam: 'Culturele Alleseters', kort: 'CA', hoofdgroep: 'Intensief', kleur: '#ffff37', icoon: GlobeHemisphereWest, marktaandeel: 6, omschrijving: 'Zeer cultuurminded en veelbezoeker van alle disciplines, ook experimenteel en internationaal.' },
  { naam: 'Kindrijke Cultuurvreters', kort: 'KVC', hoofdgroep: 'Intensief', kleur: '#febba0', icoon: Baby, marktaandeel: 8, omschrijving: 'Gezinnen die cultuur belangrijk vinden, ook voor hun kinderen. Familievoorstellingen en vakanties.' },
  { naam: 'Weelderige Cultuurminnaars', kort: 'WC', hoofdgroep: 'Intensief', kleur: '#ff6600', icoon: Champagne, marktaandeel: 6, omschrijving: 'Welgesteld en breed geïnteresseerd. Combineert een avond uit graag met diner en arrangement.' },
  { naam: 'Klassieke Cultuurliefhebbers', kort: 'KCL', hoofdgroep: 'Intensief', kleur: '#d70303', icoon: Bank, marktaandeel: 8, omschrijving: 'Ouder, hoogopgeleid en trouw. Kiest voor kwaliteit, gevestigde namen en traditie.' },
  { naam: 'Startende Cultuurspeurders', kort: 'SCS', hoofdgroep: 'Medium', kleur: '#9edfe1', icoon: Binoculars, marktaandeel: 9, omschrijving: 'Twintigers en dertigers die cultuur aan het ontdekken zijn, vaak samen met vrienden.' },
  { naam: 'Actieve Vermaakvangers', kort: 'AV', hoofdgroep: 'Medium', kleur: '#3e9bf8', icoon: Confetti, marktaandeel: 7, omschrijving: 'Jonger en actief. Zoekt vermaak, humor en grote shows en beslist vaak laat.' },
  { naam: 'Proevende Buitenwijkers', kort: 'PB', hoofdgroep: 'Medium', kleur: '#00518e', icoon: Popcorn, marktaandeel: 10, omschrijving: 'Gezinnen en stellen uit de buitenwijken die af en toe gaan voor bekende namen en een gezellige avond.' },
  { naam: 'Bruisende Buitenwijkers', kort: 'BB', hoofdgroep: 'Medium', kleur: '#8b3fd9', icoon: Fire, marktaandeel: 7, omschrijving: 'Buitenwijkers die houden van een feestelijke avond uit: grote shows, muziek en gezelligheid.' },
  { naam: 'Ontspannen Buitenwijkers', kort: 'OB', hoofdgroep: 'Medium', kleur: '#c9a3f0', icoon: Coffee, marktaandeel: 8, omschrijving: 'Rustige buitenwijkers die cultuur zien als ontspanning: herkenbaar, dichtbij en zonder gedoe.' },
  { naam: 'Nieuwsgierige Toekomstgrijpers', kort: 'NT', hoofdgroep: 'Licht', kleur: '#ade97b', icoon: RocketLaunch, marktaandeel: 5, omschrijving: 'Jong en stedelijk. Zoekt nieuwe vormen, crossovers en makers van nu.' },
  { naam: 'Flanerende Plezierzoekers', kort: 'FP', hoofdgroep: 'Licht', kleur: '#009b3a', icoon: ShoppingBag, marktaandeel: 9, omschrijving: 'Stedelijk en spontaan. Combineert uitgaan met winkelen en horeca, kiest voor plezier.' },
  { naam: 'Sociale Cultuurhoppers', kort: 'SCH', hoofdgroep: 'Licht', kleur: '#426e42', icoon: UsersThree, marktaandeel: 8, omschrijving: 'Gaat graag met vrienden uit, staat open voor nieuw werk en deelt ervaringen online.' },
  { naam: 'Lokale Vrijetijdsgenieters', kort: 'LV', hoofdgroep: 'Licht', kleur: '#7e6c02', icoon: HouseLine, marktaandeel: 9, omschrijving: 'Sterk lokaal georiënteerd, prijsbewust en gericht op toegankelijk en herkenbaar aanbod.' },
]

/** Leesbare tekstkleur (donker of wit) op een achtergrondkleur. */
export function inktVoor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  // Kies de tekstkleur met het meeste contrast (inkt heeft een luminantie van ongeveer 0,013).
  return (l + 0.05) / (0.013 + 0.05) >= 1.05 / (l + 0.05) ? '#1d1b2f' : '#ffffff'
}

/** Donkerdere variant van een kleur, voor lijnen en iconen in lichte CDM-kleuren. */
export function donkerder(hex: string, factor = 0.62) {
  const [r, g, b] = [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * factor))
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

/** Lichte kleuren hebben een rand nodig om op wit zichtbaar te blijven. */
export function isLicht(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.299 * r + 0.587 * g + 0.114 * b > 175
}

export const MOTIVATIES: Segment[] = [
  { naam: 'Plezier', kort: 'Plezier', kleur: PALET[0], icoon: Smiley, marktaandeel: 0, omschrijving: 'Een leuke avond uit, lachen en ontspannen.' },
  { naam: 'Populair', kort: 'Populair', kleur: PALET[1], icoon: Star, marktaandeel: 0, omschrijving: 'Bekende namen en titels waar iedereen het over heeft.' },
  { naam: 'Traditioneel', kort: 'Traditie', kleur: PALET[2], icoon: TreeEvergreen, marktaandeel: 0, omschrijving: 'Vaste waarden en jaarlijkse rituelen, zoals de kerstvoorstelling.' },
  { naam: 'Ontdekken', kort: 'Ontdekken', kleur: PALET[3], icoon: Compass, marktaandeel: 0, omschrijving: 'Nieuwe makers, onbekende genres en verrassingen.' },
  { naam: 'Inhoudelijk', kort: 'Inhoud', kleur: PALET[4], icoon: Brain, marktaandeel: 0, omschrijving: 'Verdieping, maatschappelijke thema\'s en vakmanschap.' },
  { naam: 'Inspiratie', kort: 'Inspiratie', kleur: PALET[5], icoon: Sparkle, marktaandeel: 0, omschrijving: 'Geraakt en geïnspireerd worden, nieuwe ideeën opdoen.' },
  { naam: 'Toegankelijk & betaalbaar theater', kort: 'Toegankelijk', kleur: PALET[6], icoon: Ticket, marktaandeel: 0, omschrijving: 'Laagdrempelig en voor een betaalbare prijs.' },
  { naam: 'Leerzaam', kort: 'Leerzaam', kleur: PALET[7], icoon: BookOpen, marktaandeel: 0, omschrijving: 'Iets opsteken, bijvoorbeeld via een theatercollege.' },
]

export const segmentVan = (lijst: Segment[], naam: string) => lijst.find((s) => s.naam === naam)

export const GENRES = [
  'Cabaret', 'Muziek', 'Jeugd & Familie', 'Musical', 'Toneel', 'Show', 'Special',
  'Theatercollege', 'Muziektheater', 'Dans', 'Klassieke muziek', 'Opera',
]

/** Genres zijn gebundeld in acht families zodat elke familie een vaste kleur heeft. */
export const GENRE_FAMILIES: { naam: string; kleur: string; icoon: Icon; genres: string[] }[] = [
  { naam: 'Cabaret', kleur: PALET[0], icoon: Microphone, genres: ['Cabaret'] },
  { naam: 'Muziek', kleur: PALET[1], icoon: Guitar, genres: ['Muziek'] },
  { naam: 'Jeugd & Familie', kleur: PALET[2], icoon: Balloon, genres: ['Jeugd & Familie'] },
  { naam: 'Musical', kleur: PALET[3], icoon: MusicNotes, genres: ['Musical', 'Muziektheater'] },
  { naam: 'Show & Special', kleur: PALET[4], icoon: DiscoBall, genres: ['Show', 'Special'] },
  { naam: 'Toneel & Woord', kleur: PALET[5], icoon: MaskHappy, genres: ['Toneel', 'Theatercollege'] },
  { naam: 'Dans', kleur: PALET[6], icoon: PersonArmsSpread, genres: ['Dans'] },
  { naam: 'Klassiek & Opera', kleur: PALET[7], icoon: PianoKeys, genres: ['Klassieke muziek', 'Opera'] },
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
