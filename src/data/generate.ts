import basis from './basis-2627.json'
import type { Aanbod, AanbodStatus, Dataset, Doelen, Status, Voorstelling, Zaal } from './types'
import {
  DOELGROEPEN, GEMIDDELDE_PRIJS, GENRES, HUIDIG_STARTJAAR, IMPRESARIATEN, PLAN_SEIZOEN, SEIZOENEN, capaciteitVan,
} from './vocab'

/* ---------- Willekeur met seed, zodat dezelfde seed dezelfde dataset geeft ---------- */

export type Rng = () => number

export function maakRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const kies = <T,>(rng: Rng, lijst: readonly T[]): T => lijst[Math.floor(rng() * lijst.length)]
const tussen = (rng: Rng, min: number, max: number) => min + rng() * (max - min)
const geheel = (rng: Rng, min: number, max: number) => Math.floor(tussen(rng, min, max + 1))
const normaal = (rng: Rng, gem = 0, sd = 1) => {
  const u = Math.max(rng(), 1e-9)
  const v = rng()
  return gem + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const klem = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x))
const gewogen = <T,>(rng: Rng, items: T[], gewichten: number[]): T => {
  const totaal = gewichten.reduce((a, b) => a + b, 0)
  let r = rng() * totaal
  for (let i = 0; i < items.length; i++) {
    r -= gewichten[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}
const schud = <T,>(rng: Rng, lijst: T[]): T[] => {
  const kopie = [...lijst]
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[kopie[i], kopie[j]] = [kopie[j], kopie[i]]
  }
  return kopie
}
const uniekeSelectie = <T,>(rng: Rng, lijst: T[], n: number) => schud(rng, lijst).slice(0, n)

/* ---------- Datumhulpjes ---------- */

export const isoDatum = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const naarDatum = (iso: string) => {
  const [j, m, d] = iso.split('-').map(Number)
  return new Date(j, m - 1, d)
}

/** Een seizoen loopt van augustus tot en met juli. */
export function seizoenVanDatum(iso: string) {
  const d = naarDatum(iso)
  const start = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1
  return `${String(start % 100).padStart(2, '0')}/${String((start + 1) % 100).padStart(2, '0')}`
}

export function seizoenStartJaar(seizoen: string) {
  return 2000 + Number(seizoen.slice(0, 2))
}

function dagenVanSeizoen(seizoen: string) {
  const jaar = seizoenStartJaar(seizoen)
  const dagen: Date[] = []
  for (let d = new Date(jaar, 8, 1); d <= new Date(jaar + 1, 5, 30); d.setDate(d.getDate() + 1)) {
    dagen.push(new Date(d))
  }
  return dagen
}

/** Hoe de werkelijke opkomst per genre afwijkt van de inschatting (dummy). */
const GENRE_REALISATIE: Record<string, number> = {
  Cabaret: 1.04, Muziek: 1.0, 'Jeugd & Familie': 1.08, Musical: 0.95, Toneel: 0.86, Show: 0.9, Special: 0.97,
  Theatercollege: 1.06, Muziektheater: 0.9, Dans: 0.82, 'Klassieke muziek': 0.98, Opera: 0.93,
}
/** Opkomstfactor per weekdag (zondag t/m zaterdag). */
const WEEKDAG_OPKOMST = [0.97, 0.78, 0.84, 0.9, 0.96, 1.07, 1.1]

const MAAND_GEWICHT = [1.0, 1.1, 0.5, 0, 0, 0, 0, 0, 0.6, 1.1, 1.2, 1.0]
const WEEKDAG_GEWICHT = [1.0, 0.3, 0.6, 0.8, 1.1, 1.4, 1.5]
const JEUGD_WEEKDAG = [1.6, 0.1, 0.2, 0.9, 0.2, 0.3, 1.0]

/* ---------- Acts: artiesten met een vast profiel ---------- */

interface Act {
  artiest: string
  titels: string[]
  genre: string
  motivaties: string[]
  doelgroepen: string[]
  kracht: number
  zaal: Zaal
  impresariaat: string
  basis: boolean
}

const VOORNAMEN = ['Sanne', 'Joris', 'Femke', 'Bas', 'Lotte', 'Thijs', 'Noor', 'Daan', 'Eva', 'Ruben', 'Maartje', 'Jelle', 'Iris', 'Sem', 'Fleur', 'Wouter', 'Anouk', 'Stijn', 'Lieke', 'Pepijn', 'Yara', 'Mehmet', 'Samira', 'Kees', 'Ilse', 'Rachid', 'Hanna', 'Tijmen']
const ACHTERNAMEN = ['de Vries', 'Bakker', 'Jansen', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Dijk', 'Dekker', 'Brouwer', 'van Leeuwen', 'Kok', 'Verhoeven', 'El Amrani', 'Postma', 'Hoekstra', 'Timmer', 'Kuipers', 'Brink', 'Yilmaz', 'Wolters']

const TITELS: Record<string, string[]> = {
  Cabaret: ['Ongefilterd', 'Kortsluiting', 'Thuiswedstrijd', 'Overmoed', 'Volle Maan', 'Hoe dan ook', 'Nieuw Licht', 'Tegenwind', 'Zonder Pardon', 'Alles Komt Goed', 'Midlife', 'Grootspraak'],
  Muziek: ['ABBA Tribute Night', 'Queen Experience', 'Fleetwood Forever', 'Soul Sisters Live', 'Nederpop Avond', 'Motown Revue', 'Singer Songwriter Sessies', 'Hollandse Hits Live', 'Jazz aan de Plas', 'Beatles Unplugged', 'Rock Classics', 'Disco Inferno'],
  'Jeugd & Familie': ['Mo en de Maanraket', 'Het Grote Bosavontuur', 'Kapitein Knoop', 'Prinses Pannenkoek', 'De Dansende Dino', 'Lotje Lampion', 'Het Geheim van de Zolder', 'Sterrenvanger', 'Pip de Pinguïn', 'Ridder Roest', 'Het Wolkenkasteel', 'Juf Jansje'],
  Musical: ['Havenlicht', 'De Laatste Tram', 'Sterren van Toen', 'Rozenwals', 'Hotel Hollandia', 'Kroonjuweel', 'De Vuurtoren', 'Zomernacht', 'Gouden Jaren'],
  Toneel: ['Het Diner', 'Familieportret', 'Na de Storm', 'De Erfenis', 'Avondrood', 'Wachtkamer', 'Glazen Huis', 'Kinderen van de Polder', 'De Meeuw', 'Hamlet'],
  Show: ['Dancing Queens', 'Magic Night', 'Circus Fantasia', 'Ierse Dansnacht', 'Gospel Explosion', 'Comedy Night Live', 'De Grote Quizshow', 'Illusie'],
  Special: ['Oudejaarsgala', 'Benefietavond', 'Nieuwjaarsconcert', 'Open Podium Zoetermeer', 'Theaterdiner', 'Lokale Helden', 'Seizoenspresentatie'],
  Theatercollege: ['Het Brein', 'Over Geluk', 'De Kosmos', 'Slapen', 'Geld', 'Ons Klimaat', 'Taal', 'Liefde'],
  Muziektheater: ['Liedjes van Liefde', 'Zeemansliederen', 'Parijs 1920', 'Chansons', 'Avondlied'],
  Dans: ['Bolero', 'Zwanenmeer', 'Urban Moves', 'Tango Nuevo', 'Flamenco Pasión', 'Ritme', 'Zwaartekracht'],
  'Klassieke muziek': ['Strijkkwartet Aurora', 'Pianorecital', 'Barokensemble Lumen', 'Mozart bij Kaarslicht', 'Celloavond'],
  Opera: ['La Traviata', 'Carmen', 'De Toverfluit', 'La Bohème', 'Tosca'],
}

const PERSOONLIJK = new Set(['Cabaret', 'Theatercollege', 'Muziektheater'])

const PROFIEL: Record<string, { m: string[]; d: string[]; kracht: number; zaal: Zaal }> = {
  Cabaret: { m: ['Plezier', 'Populair', 'Ontdekken', 'Inhoudelijk'], d: ['Klassieke Cultuurliefhebbers', 'Weelderige Cultuurminnaars', 'Actieve Vermaakvangers', 'Proevende Buitenwijkers', 'Sociale Cultuurhoppers', 'Ontspannen Buitenwijkers'], kracht: 0.78, zaal: 'Grote zaal' },
  Muziek: { m: ['Plezier', 'Populair', 'Traditioneel'], d: ['Klassieke Cultuurliefhebbers', 'Lokale Vrijetijdsgenieters', 'Weelderige Cultuurminnaars', 'Proevende Buitenwijkers', 'Flanerende Plezierzoekers', 'Bruisende Buitenwijkers'], kracht: 0.75, zaal: 'Grote zaal' },
  'Jeugd & Familie': { m: ['Plezier', 'Toegankelijk & betaalbaar theater', 'Traditioneel', 'Leerzaam'], d: ['Kindrijke Cultuurvreters', 'Proevende Buitenwijkers', 'Lokale Vrijetijdsgenieters', 'Ontspannen Buitenwijkers'], kracht: 0.72, zaal: 'Grote zaal' },
  Musical: { m: ['Plezier', 'Populair', 'Inspiratie'], d: ['Proevende Buitenwijkers', 'Bruisende Buitenwijkers', 'Lokale Vrijetijdsgenieters', 'Weelderige Cultuurminnaars', 'Flanerende Plezierzoekers'], kracht: 0.84, zaal: 'Grote zaal' },
  Toneel: { m: ['Inhoudelijk', 'Inspiratie', 'Ontdekken'], d: ['Klassieke Cultuurliefhebbers', 'Weelderige Cultuurminnaars', 'Culturele Alleseters', 'Sociale Cultuurhoppers', 'Nieuwsgierige Toekomstgrijpers'], kracht: 0.62, zaal: 'Grote zaal' },
  Show: { m: ['Plezier', 'Populair'], d: ['Actieve Vermaakvangers', 'Bruisende Buitenwijkers', 'Flanerende Plezierzoekers', 'Proevende Buitenwijkers', 'Startende Cultuurspeurders'], kracht: 0.8, zaal: 'Grote zaal' },
  Special: { m: ['Plezier', 'Traditioneel', 'Toegankelijk & betaalbaar theater'], d: ['Lokale Vrijetijdsgenieters', 'Ontspannen Buitenwijkers', 'Klassieke Cultuurliefhebbers', 'Proevende Buitenwijkers'], kracht: 0.66, zaal: 'Grote zaal' },
  Theatercollege: { m: ['Leerzaam', 'Inhoudelijk', 'Inspiratie'], d: ['Klassieke Cultuurliefhebbers', 'Culturele Alleseters', 'Weelderige Cultuurminnaars', 'Startende Cultuurspeurders'], kracht: 0.7, zaal: 'Kleine zaal' },
  Muziektheater: { m: ['Inspiratie', 'Plezier', 'Inhoudelijk'], d: ['Klassieke Cultuurliefhebbers', 'Weelderige Cultuurminnaars', 'Sociale Cultuurhoppers'], kracht: 0.6, zaal: 'Kleine zaal' },
  Dans: { m: ['Ontdekken', 'Inspiratie', 'Plezier'], d: ['Culturele Alleseters', 'Nieuwsgierige Toekomstgrijpers', 'Startende Cultuurspeurders', 'Sociale Cultuurhoppers', 'Weelderige Cultuurminnaars'], kracht: 0.55, zaal: 'Grote zaal' },
  'Klassieke muziek': { m: ['Traditioneel', 'Inhoudelijk'], d: ['Klassieke Cultuurliefhebbers', 'Weelderige Cultuurminnaars', 'Lokale Vrijetijdsgenieters'], kracht: 0.72, zaal: 'Kleine zaal' },
  Opera: { m: ['Traditioneel', 'Inspiratie'], d: ['Klassieke Cultuurliefhebbers', 'Weelderige Cultuurminnaars', 'Culturele Alleseters'], kracht: 0.74, zaal: 'Grote zaal' },
}

/** Basisverdeling van genres, afgeleid van de Excel-export (seizoen 26/27). */
const GENRE_BASIS: Record<string, number> = {
  Cabaret: 84, Muziek: 57, 'Jeugd & Familie': 33, Musical: 24, Toneel: 15, Show: 13, Special: 13,
  Theatercollege: 11, Muziektheater: 11, Dans: 6, 'Klassieke muziek': 5, Opera: 2,
}
/** Hoe sterk een genre in het verleden meer (positief) of minder (negatief) voorkwam. */
const GENRE_DRIFT: Record<string, number> = {
  Cabaret: 0.18, Muziek: -0.2, 'Jeugd & Familie': -0.3, Musical: 0.1, Toneel: 0.45, Show: -0.25, Special: 0,
  Theatercollege: -0.35, Muziektheater: 0.2, Dans: 0.3, 'Klassieke muziek': 0.2, Opera: 0.3,
}

const IMPRESARIAAT_VOORKEUR: Record<string, string[]> = {
  'Jeugd & Familie': ['Familietheater Fabriek', 'Applaus Impresariaat'],
  'Klassieke muziek': ['Klassiek Collectief'],
  Opera: ['Klassiek Collectief', 'Zwaan Theaterzaken'],
  Dans: ['Danshuis Producties', 'Zwaan Theaterzaken'],
  Cabaret: ['Kleinkunstbureau Pieterse', 'Lichtspoor Impresariaat', 'Rode Loper Theaterbureau', 'Spotlight & Co'],
  Musical: ['Vlam Theaterproducties', 'Coulisse Producties'],
}

function kiesImpresariaat(rng: Rng, genre: string) {
  const voorkeur = IMPRESARIAAT_VOORKEUR[genre]
  return voorkeur && rng() < 0.65 ? kies(rng, voorkeur) : kies(rng, IMPRESARIATEN)
}

function hash(tekst: string) {
  let h = 2166136261
  for (let i = 0; i < tekst.length; i++) h = Math.imul(h ^ tekst.charCodeAt(i), 16777619)
  return h >>> 0
}

export function artiestUitTitel(titel: string) {
  return titel
    .replace(/\s*\((reprise|extra|middag|avond|try-?out|première)[^)]*\)\s*/gi, ' ')
    .replace(/\s*\(\d{1,2}\+\)\s*/g, ' ')
    .replace(/\s+(2|II)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function profielKeuze(rng: Rng, genre: string) {
  const p = PROFIEL[genre] ?? PROFIEL.Special
  const motivaties = uniekeSelectie(rng, p.m, 2)
  const kern = uniekeSelectie(rng, p.d, Math.min(p.d.length, geheel(rng, 2, 3)))
  const extra = uniekeSelectie(rng, DOELGROEPEN.map((d) => d.naam).filter((d) => !kern.includes(d)), rng() < 0.5 ? 1 : 0)
  return { motivaties, doelgroepen: [...kern, ...extra].slice(0, 4) }
}

function nieuweAct(rng: Rng, genre: string, gebruikt: Set<string>): Act {
  let artiest = ''
  let titel = ''
  for (let poging = 0; poging < 20; poging++) {
    const naam = `${kies(rng, VOORNAMEN)} ${kies(rng, ACHTERNAMEN)}`
    const t = kies(rng, TITELS[genre] ?? TITELS.Special)
    if (PERSOONLIJK.has(genre)) {
      artiest = naam
      titel = `${naam}: ${t}`
    } else if (genre === 'Muziek' && rng() < 0.4) {
      artiest = naam
      titel = `${naam} ${kies(rng, ['Live', 'Unplugged', 'in Concert', 'zingt Nederlandstalig'])}`
    } else {
      artiest = t
      titel = t
    }
    if (!gebruikt.has(artiest)) break
  }
  gebruikt.add(artiest)
  const p = PROFIEL[genre] ?? PROFIEL.Special
  const { motivaties, doelgroepen } = profielKeuze(rng, genre)
  const kleineZaal = p.zaal === 'Kleine zaal' || rng() < (genre === 'Cabaret' ? 0.35 : 0.12)
  return {
    artiest,
    titels: [titel],
    genre,
    motivaties,
    doelgroepen,
    kracht: klem(normaal(rng, p.kracht, 0.12), 0.3, 1.1),
    zaal: genre === 'Klassieke muziek' && rng() < 0.3 ? 'Theatercafé' : kleineZaal ? 'Kleine zaal' : 'Grote zaal',
    impresariaat: kiesImpresariaat(rng, genre),
    basis: false,
  }
}

/* ---------- Normalisatie van de Excel-basis ---------- */

export interface BasisRij {
  seizoen: string | null
  status: string | null
  datum: string
  titel: string
  genre: string | null
  leeftijd: string | null
  zaal: string | null
  verwacht: number | null
  id: string
  motivaties: string[]
  doelgroepen: string[]
}

const GELDIGE_STATUS = ['Bevestigd', 'Optie', 'Concept', 'Geannuleerd', 'Financieel af te handelen', 'Financieel afgehandeld']

export function normaliseerStatus(status: string | null | undefined): Status {
  const s = (status ?? '').trim()
  return (GELDIGE_STATUS.find((g) => g.toLowerCase() === s.toLowerCase()) as Status) ?? 'Concept'
}

export function normaliseerZaal(zaal: string | null | undefined, verwacht: number | null): Zaal {
  const z = (zaal ?? '').trim().toLowerCase()
  if (z.startsWith('grote')) return 'Grote zaal'
  if (z.startsWith('kleine')) return 'Kleine zaal'
  if (z.includes('caf')) return 'Theatercafé'
  return (verwacht ?? 0) > 200 ? 'Grote zaal' : 'Kleine zaal'
}

function rondAf(x: number, stap: number) {
  return Math.round(x / stap) * stap
}

function prijsVoor(rng: Rng, genre: string, zaal: Zaal, seizoen: string) {
  const inflatie = 1 + (seizoenStartJaar(seizoen) - HUIDIG_STARTJAAR) * 0.04
  const zaalFactor = zaal === 'Grote zaal' ? 1.08 : zaal === 'Theatercafé' ? 0.7 : 0.88
  return rondAf((GEMIDDELDE_PRIJS[genre] ?? 28) * zaalFactor * inflatie * tussen(rng, 0.9, 1.12), 0.5)
}

function tijdVoor(rng: Rng, genre: string, weekdag: number) {
  if (genre === 'Jeugd & Familie') return kies(rng, ['11:00', '14:00', '15:00'])
  if (genre === 'Klassieke muziek' && weekdag === 0) return kies(rng, ['11:30', '14:30'])
  if (weekdag === 0) return kies(rng, ['14:30', '15:00', '19:30'])
  return kies(rng, ['20:00', '20:15', '20:15', '20:30'])
}

function eindstandVoor(rng: Rng, verwacht: number, capaciteit: number, kracht = 0.75, genre = '', weekdag = 5) {
  const factor = normaal(rng, 0.92 + (kracht - 0.7) * 0.5, 0.12) * (GENRE_REALISATIE[genre] ?? 1) * WEEKDAG_OPKOMST[weekdag]
  return Math.round(klem(verwacht * factor, capaciteit * 0.12, capaciteit))
}

export function basisNaarVoorstelling(rij: BasisRij, rng: Rng, bron: Voorstelling['bron'] = 'excel'): Voorstelling {
  const genre = rij.genre && GENRES.includes(rij.genre.trim()) ? rij.genre.trim() : 'Special'
  const zaal = normaliseerZaal(rij.zaal, rij.verwacht)
  const capaciteit = capaciteitVan(zaal)
  const verwacht = rij.verwacht ?? Math.round(capaciteit * 0.7)
  const datum = rij.datum
  const seizoen = rij.seizoen?.match(/\d\d\/\d\d/)?.[0] ?? seizoenVanDatum(datum)
  const artiest = artiestUitTitel(rij.titel)
  const krachtRng = maakRng(hash(artiest))
  const kracht = klem(normaal(krachtRng, (PROFIEL[genre]?.kracht ?? 0.7), 0.12), 0.35, 1.1)
  const prijs = prijsVoor(rng, genre, zaal, seizoen)
  return {
    id: rij.id || `x-${hash(rij.titel + datum)}`,
    seizoen,
    status: normaliseerStatus(rij.status),
    datum,
    tijd: tijdVoor(rng, genre, naarDatum(datum).getDay()),
    titel: rij.titel.trim(),
    artiest,
    impresariaat: kiesImpresariaat(maakRng(hash(artiest) + 7), genre),
    genre,
    leeftijd: rij.leeftijd ?? (genre === 'Jeugd & Familie' ? kies(rng, ['3+', '4+', '6+', '8+']) : null),
    zaal,
    capaciteit,
    verwacht,
    eindstand: eindstandVoor(rng, verwacht, capaciteit, kracht, genre, naarDatum(datum).getDay()),
    prijs,
    uitkoopsom: rondAf(verwacht * prijs * tussen(rng, 0.42, 0.68), 50),
    motivaties: rij.motivaties.length ? rij.motivaties : profielKeuze(rng, genre).motivaties,
    doelgroepen: rij.doelgroepen.length ? rij.doelgroepen : profielKeuze(rng, genre).doelgroepen,
    bron,
  }
}

/* ---------- Seizoen genereren ---------- */

interface SeizoenOpties {
  seizoen: string
  aantal: number
  driftIndex: number
  status: (rng: Rng) => Status
  bezet: Set<string>
}

function genereerSeizoen(rng: Rng, opties: SeizoenOpties, basisActs: Act[], dummyActs: Map<string, Act[]>, gebruikt: Set<string>, teller: { n: number }) {
  const { seizoen, aantal, driftIndex, status, bezet } = opties
  const dagen = dagenVanSeizoen(seizoen)
  const genres = Object.keys(GENRE_BASIS)
  const gewichten = genres.map((g) => GENRE_BASIS[g] * Math.max(0.2, 1 + GENRE_DRIFT[g] * driftIndex))
  const uit: Voorstelling[] = []

  for (let i = 0; i < aantal; i++) {
    const genre = gewogen(rng, genres, gewichten)
    const basisVanGenre = basisActs.filter((a) => a.genre === genre)
    let act: Act
    if (basisVanGenre.length && rng() < 0.5) {
      act = kies(rng, basisVanGenre)
    } else {
      const pool = dummyActs.get(genre) ?? []
      if (!pool.length || rng() < 0.4) {
        act = nieuweAct(rng, genre, gebruikt)
        pool.push(act)
        dummyActs.set(genre, pool)
      } else {
        act = kies(rng, pool)
      }
    }

    const weekdagGewicht = genre === 'Jeugd & Familie' ? JEUGD_WEEKDAG : WEEKDAG_GEWICHT
    let dag: Date | undefined
    for (let poging = 0; poging < 30; poging++) {
      const kandidaat = gewogen(rng, dagen, dagen.map((d) => MAAND_GEWICHT[d.getMonth()] * weekdagGewicht[d.getDay()]))
      if (!bezet.has(`${isoDatum(kandidaat)}|${act.zaal}`)) {
        dag = kandidaat
        break
      }
    }
    if (!dag) continue
    const datum = isoDatum(dag)
    bezet.add(`${datum}|${act.zaal}`)

    const capaciteit = capaciteitVan(act.zaal)
    const maandFactor = [0.95, 1, 1, 1, 1, 1, 1, 1, 0.9, 1.0, 1.05, 1.08][dag.getMonth()]
    const verwacht = rondAf(klem(capaciteit * act.kracht * tussen(rng, 0.9, 1.05), 20, capaciteit), capaciteit > 200 ? 10 : 5)
    const prijs = prijsVoor(rng, genre, act.zaal, seizoen)
    const st = status(rng)
    teller.n += 1
    uit.push({
      id: `d-${seizoen.replace('/', '')}-${teller.n}`,
      seizoen,
      status: st,
      datum,
      tijd: tijdVoor(rng, genre, dag.getDay()),
      titel: kies(rng, act.titels),
      artiest: act.artiest,
      impresariaat: act.impresariaat,
      genre,
      leeftijd: genre === 'Jeugd & Familie' ? kies(rng, ['3+', '4+', '6+', '8+']) : null,
      zaal: act.zaal,
      capaciteit,
      verwacht,
      eindstand: Math.round(klem(verwacht * maandFactor * (GENRE_REALISATIE[genre] ?? 1) * WEEKDAG_OPKOMST[dag.getDay()] * normaal(rng, 1.07, 0.12), capaciteit * 0.1, capaciteit)),
      prijs,
      uitkoopsom: rondAf(verwacht * prijs * tussen(rng, 0.42, 0.68), 50),
      motivaties: act.motivaties,
      doelgroepen: act.doelgroepen,
      bron: 'dummy',
    })
  }
  return uit
}

/* ---------- Aanbod van impresariaten ---------- */

const OMSCHRIJVINGEN: Record<string, string[]> = {
  Cabaret: ['Een gloednieuwe avondvullende show vol scherpe observaties en onverwachte wendingen.', 'Persoonlijk, grappig en ontwapenend eerlijk. Tourt het hele seizoen langs de grote zalen.'],
  Muziek: ['De grootste hits live gespeeld door een topband met een spetterende lichtshow.', 'Een muzikale reis langs klassiekers die iedereen kan meezingen.'],
  'Jeugd & Familie': ['Vrolijke familievoorstelling met liedjes, poppen en veel interactie met de zaal.', 'Spannend en ontroerend avontuur voor het hele gezin, ideaal in de schoolvakanties.'],
  Musical: ['Grote zaal-musical met live orkest, sterrencast en indrukwekkende decors.', 'Een feelgood-musical vol bekende liedjes en een warm verhaal.'],
  Toneel: ['Sterk acteursensemble in een tijdloos stuk over familie, schuld en verlangen.', 'Nieuwe Nederlandse tekst die schuurt en ontroert.'],
  Show: ['Spektakelshow met dans, acrobatiek en een feestelijke finale.', 'Een avond vol vermaak, glitter en publieksparticipatie.'],
  Special: ['Eenmalig evenement met lokale partners en een feestelijk karakter.', 'Gala-avond met verschillende artiesten en een verrassende line-up.'],
  Theatercollege: ['Inspirerend college van een topwetenschapper, toegankelijk en vol aha-momenten.', 'Leerzame avond met beeld, humor en ruimte voor vragen uit de zaal.'],
  Muziektheater: ['Intieme muziekvoorstelling met verhalen en liedjes uit vervlogen tijden.', 'Muziek en theater versmelten in een poëtische voorstelling.'],
  Dans: ['Krachtige dansvoorstelling met wereldklasse dansers en live muziek.', 'Jong dansgezelschap met een verrassende mix van stijlen.'],
  'Klassieke muziek': ['Kamermuziek op het hoogste niveau in een intieme setting.', 'Klassieke meesterwerken, toegankelijk gebracht met korte toelichting.'],
  Opera: ['Volledige operaproductie met koor, orkest en internationale solisten.', 'Een compacte, toegankelijke opera-uitvoering met boventiteling.'],
}

interface AanbodOpties {
  seizoen: string
  aantal: number
  /** Alleen data vanaf deze dag (ISO). Voor het lopende seizoen is dat vandaag. */
  vanaf?: string
  prefix: string
  /** Vrije data die we graag aangeboden zien, zodat suggesties op lege avonden passen. */
  voorkeur?: string[]
}

function genereerAanbod(rng: Rng, acts: Act[], gebruikt: Set<string>, { seizoen, aantal, vanaf, prefix, voorkeur = [] }: AanbodOpties): Aanbod[] {
  const dagen = dagenVanSeizoen(seizoen).filter((d) => !vanaf || isoDatum(d) >= vanaf)
  const uit: Aanbod[] = []
  if (dagen.length < 21) return uit
  const genres = Object.keys(GENRE_BASIS)
  const gewichten = genres.map((g) => GENRE_BASIS[g] + 6)
  const statussen: AanbodStatus[] = ['Nieuw', 'Bekeken', 'Shortlist', 'Afgewezen']
  for (let i = 0; i < aantal; i++) {
    const terugkerend = rng() < 0.42
    let act: Act
    let titel: string
    if (terugkerend) {
      act = kies(rng, acts)
      titel = PERSOONLIJK.has(act.genre)
        ? `${act.artiest}: ${kies(rng, TITELS[act.genre] ?? TITELS.Special)}`
        : act.genre === 'Muziek' || act.genre === 'Show'
          ? `${act.artiest} ${kies(rng, [String(HUIDIG_STARTJAAR + 2), 'Jubileumtour', 'The Encore', 'Live'])}`
          : `${act.artiest} ${kies(rng, ['(nieuwe productie)', '2', '(jubileum)', '(herneming)'])}`
    } else {
      act = nieuweAct(rng, gewogen(rng, genres, gewichten), gebruikt)
      titel = act.titels[0]
    }
    const startIndex = geheel(rng, 0, Math.max(0, dagen.length - 70))
    const lengte = geheel(rng, 30, 130)
    const periode = dagen.slice(startIndex, Math.min(dagen.length, startIndex + lengte))
    const kandidaten = periode.filter((d) => MAAND_GEWICHT[d.getMonth()] > 0 && WEEKDAG_GEWICHT[d.getDay()] >= 0.8)
    const periodeStart = isoDatum(periode[0])
    const periodeEind = isoDatum(periode[periode.length - 1])
    const vrijInPeriode = voorkeur.filter((d) => d >= periodeStart && d <= periodeEind)
    const beschikbaar = [...new Set([
      ...uniekeSelectie(rng, kandidaten, geheel(rng, 3, 9)).map(isoDatum),
      ...uniekeSelectie(rng, vrijInPeriode, act.zaal === 'Grote zaal' ? geheel(rng, 2, 4) : 0),
    ])].sort()
    if (!beschikbaar.length) continue
    const capaciteit = capaciteitVan(act.zaal)
    const verwacht = rondAf(klem(capaciteit * act.kracht * tussen(rng, 0.85, 1.05), 20, capaciteit), capaciteit > 200 ? 10 : 5)
    const prijs = prijsVoor(rng, act.genre, act.zaal, seizoen)
    const zalen: Zaal[] = act.zaal === 'Grote zaal' && rng() < 0.2 ? ['Grote zaal', 'Kleine zaal'] : [act.zaal]
    // Aanbod voor het lopende seizoen is recent binnengekomen, aanbod voor volgend seizoen sinds de zomer.
    const ontvangen = vanaf ? naarDatum(vanaf) : new Date(HUIDIG_STARTJAAR, 6, 1)
    ontvangen.setDate(ontvangen.getDate() + (vanaf ? -geheel(rng, 0, 45) : geheel(rng, 0, 118)))
    if (ontvangen > new Date()) ontvangen.setTime(Date.now())
    uit.push({
      id: `${prefix}-${i + 1}`,
      titel,
      artiest: act.artiest,
      impresariaat: terugkerend && rng() < 0.8 ? act.impresariaat : kiesImpresariaat(rng, act.genre),
      genre: act.genre,
      omschrijving: kies(rng, OMSCHRIJVINGEN[act.genre] ?? OMSCHRIJVINGEN.Special),
      zalen,
      periodeStart,
      periodeEind,
      beschikbareData: beschikbaar,
      uitkoopsom: rondAf(verwacht * prijs * tussen(rng, 0.45, 0.75), 50),
      prijsIndicatie: prijs,
      duur: kies(rng, act.genre === 'Jeugd & Familie' ? [50, 60, 70] : [90, 100, 120, 135, 150]),
      verwacht,
      motivaties: act.motivaties,
      doelgroepen: act.doelgroepen,
      premiere: rng() < 0.18,
      status: gewogen(rng, statussen, [60, 25, 10, 5]),
      ontvangen: isoDatum(ontvangen),
    })
  }
  return uit.sort((a, b) => b.ontvangen.localeCompare(a.ontvangen))
}

/** Aanbod voor het lopende seizoen, met speeldata vanaf vandaag. */
function genereerAanbodHuidig(seed: number, acts: Act[], gebruikt: Set<string>, voorstellingen: Voorstelling[]) {
  const vanaf = isoDatum(new Date())
  const seizoen = seizoenVanDatum(vanaf)
  // Vrije vrijdag- en zaterdagavonden in de Grote zaal, zodat er suggesties zijn voor de witte vlekken.
  const bezet = new Set(voorstellingen.filter((v) => v.zaal === 'Grote zaal' && v.status !== 'Geannuleerd').map((v) => v.datum))
  const voorkeur = dagenVanSeizoen(seizoen).filter((d) => [5, 6].includes(d.getDay())).map(isoDatum).filter((d) => d >= vanaf && !bezet.has(d))
  const rng = maakRng(seed + 7919)
  const aanbod = genereerAanbod(rng, acts, gebruikt, { seizoen, aantal: 64, vanaf, prefix: 'h', voorkeur })
  // Zorg dat elke vrije avond minstens twee passende voorstellingen heeft.
  const kandidaten = aanbod.filter((a) => a.zalen.includes('Grote zaal') && a.status !== 'Afgewezen')
  for (const datum of voorkeur) {
    const tekort = 2 - kandidaten.filter((a) => a.beschikbareData.includes(datum)).length
    for (const a of uniekeSelectie(rng, kandidaten.filter((x) => !x.beschikbareData.includes(datum)), Math.max(0, tekort))) {
      a.beschikbareData = [...a.beschikbareData, datum].sort()
      if (datum < a.periodeStart) a.periodeStart = datum
      if (datum > a.periodeEind) a.periodeEind = datum
    }
  }
  return aanbod
}

/* ---------- Doelen ---------- */

export const STANDAARD_DOELEN: Doelen = {
  doelgroepen: {
    'Culturele Alleseters': 4, 'Kindrijke Cultuurvreters': 9, 'Weelderige Cultuurminnaars': 12, 'Klassieke Cultuurliefhebbers': 18,
    'Startende Cultuurspeurders': 6, 'Actieve Vermaakvangers': 9, 'Proevende Buitenwijkers': 11, 'Bruisende Buitenwijkers': 5,
    'Ontspannen Buitenwijkers': 5, 'Nieuwsgierige Toekomstgrijpers': 3, 'Flanerende Plezierzoekers': 6, 'Sociale Cultuurhoppers': 5,
    'Lokale Vrijetijdsgenieters': 7,
  },
  motivaties: {
    Plezier: 32, Populair: 14, Traditioneel: 11, Ontdekken: 12, Inhoudelijk: 12, Inspiratie: 7,
    'Toegankelijk & betaalbaar theater': 7, Leerzaam: 5,
  },
  genres: {
    Cabaret: 26, Muziek: 20, 'Jeugd & Familie': 13, Musical: 10, 'Show & Special': 9, 'Toneel & Woord': 11, Dans: 5, 'Klassiek & Opera': 6,
  },
  bezetting: 78,
  aantal: 270,
}

/* ---------- Alles samen ---------- */

/** Startjaar van het seizoen waaruit de basis komt. */
const BASIS_STARTJAAR = 2026

export function genereerDataset(seed = 2627): Dataset {
  const rng = maakRng(seed)
  const gebruikt = new Set<string>()

  // Huidig seizoen uit de (geanonimiseerde) basis. De basis is seizoen 26/27; in een later seizoen
  // schuiven de datums per jaar 52 weken op, zodat de weekdagen gelijk blijven.
  const verschuiving = (HUIDIG_STARTJAAR - BASIS_STARTJAAR) * 364
  const huidig = (basis as BasisRij[]).map((rij) => {
    if (!verschuiving) return basisNaarVoorstelling(rij, rng)
    const d = naarDatum(rij.datum)
    d.setDate(d.getDate() + verschuiving)
    return basisNaarVoorstelling({ ...rij, datum: isoDatum(d), seizoen: null }, rng)
  })

  // Acts afleiden uit de basis, zodat artiesten ook in de historie terugkomen.
  const perArtiest = new Map<string, Voorstelling[]>()
  for (const v of huidig) perArtiest.set(v.artiest, [...(perArtiest.get(v.artiest) ?? []), v])
  const basisActs: Act[] = [...perArtiest.entries()].map(([artiest, rijen]) => {
    gebruikt.add(artiest)
    const eerste = rijen[0]
    return {
      artiest,
      titels: [...new Set(rijen.map((r) => r.titel))],
      genre: eerste.genre,
      motivaties: eerste.motivaties,
      doelgroepen: eerste.doelgroepen,
      kracht: klem(rijen.reduce((s, r) => s + r.eindstand / r.capaciteit, 0) / rijen.length, 0.3, 1.1),
      zaal: eerste.zaal,
      impresariaat: eerste.impresariaat,
      basis: true,
    }
  })

  const dummyActs = new Map<string, Act[]>()
  const teller = { n: 0 }
  const historie: Voorstelling[] = []
  const historischeSeizoenen: [string, number][] = [[SEIZOENEN[0], 214], [SEIZOENEN[1], 231], [SEIZOENEN[2], 246], [SEIZOENEN[3], 259]]
  historischeSeizoenen.forEach(([seizoen, aantal], i) => {
    historie.push(
      ...genereerSeizoen(rng, {
        seizoen,
        aantal,
        driftIndex: (historischeSeizoenen.length - i) / historischeSeizoenen.length,
        status: (r) => gewogen(r, ['Financieel afgehandeld', 'Geannuleerd'] as Status[], [96, 4]),
        bezet: new Set(),
      }, basisActs, dummyActs, gebruikt, teller),
    )
  })

  // Het volgende seizoen is in opbouw: een deel staat al in optie of is bevestigd.
  const bezet2728 = new Set<string>()
  const volgend = genereerSeizoen(rng, {
    seizoen: PLAN_SEIZOEN,
    aantal: 96,
    driftIndex: -0.2,
    status: (r) => gewogen(r, ['Bevestigd', 'Optie', 'Concept'] as Status[], [45, 35, 20]),
    bezet: bezet2728,
  }, basisActs, dummyActs, gebruikt, teller)

  const alleActs = [...basisActs, ...[...dummyActs.values()].flat()]
  const aanbod = [
    ...genereerAanbod(rng, alleActs, gebruikt, { seizoen: PLAN_SEIZOEN, aantal: 168, prefix: 'a' }),
    // Eigen willekeur, zodat de rest van de dataset gelijk blijft aan eerdere versies.
    ...genereerAanbodHuidig(seed, alleActs, gebruikt, [...historie, ...huidig, ...volgend]),
  ].sort((a, b) => b.ontvangen.localeCompare(a.ontvangen))

  const voorstellingen = [...historie, ...huidig, ...volgend].sort((a, b) => a.datum.localeCompare(b.datum))
  return {
    seed,
    gegenereerdOp: new Date().toISOString(),
    voorstellingen,
    aanbod,
    doelen: STANDAARD_DOELEN,
  }
}

export { klem, rondAf, hash }
