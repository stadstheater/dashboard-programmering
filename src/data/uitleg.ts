export interface UitlegStap {
  /** Waarde van het data-uitleg-attribuut van het element dat wordt uitgelicht. Leeg = gecentreerd venster. */
  doel?: string
  titel: string
  tekst: string
  /** Andere tekst op een telefoon, waar je tikt in plaats van klikt. */
  tekstMobiel?: string
  /** Stap overslaan op een telefoon, omdat het onderdeel daar anders werkt. */
  alleenDesktop?: boolean
  /** Stap alleen tonen op een telefoon. */
  alleenMobiel?: boolean
}

/** Korte rondleiding per onderdeel. Wordt per pagina één keer automatisch getoond. */
export const UITLEG: Record<string, { naam: string; stappen: UitlegStap[] }> = {
  '/': {
    naam: 'Vandaag',
    stappen: [
      { titel: 'Welkom bij Coulisse', tekst: 'Hier zie je in één oogopslag hoe het seizoen ervoor staat en wat er aandacht nodig heeft. Alles is nu nog gevuld met voorbeelddata.' },
      { doel: 'vandaag-cijfers', titel: 'Drie cijfers', tekst: 'Hoeveel voorstellingen, hoeveel bezoekers en hoe vol de zalen zitten. Groen is goed, oranje vraagt om aandacht.' },
      { doel: 'vandaag-aandacht', titel: 'Wat vraagt aandacht?', tekst: 'Hier staan de belangrijkste punten. Klik op de knop om er meteen mee aan de slag te gaan.', tekstMobiel: 'Hier staan de belangrijkste punten. Tik op de knop om er meteen mee aan de slag te gaan.' },
      { doel: 'seizoenkiezer', titel: 'Ander seizoen bekijken', tekst: 'Kies "Dit seizoen" of "Volgend seizoen". Oudere seizoenen vind je onder "Eerder".', tekstMobiel: 'Tik hier om een ander seizoen te kiezen: dit seizoen, volgend seizoen of een eerder seizoen. Bekijk je een ander seizoen dan het huidige, dan kleurt het knopje donker.' },
      { doel: 'uitleg-knop', titel: 'Uitleg terugzien', tekst: 'Met dit vraagteken start je de uitleg van een pagina opnieuw. Wil je geen uitleg meer vanzelf zien? Klik op "Alle uitleg uitzetten". Op de pagina Doelen zet je hem weer aan.', tekstMobiel: 'Met dit vraagteken start je de uitleg van een pagina opnieuw. Wil je geen uitleg meer vanzelf zien? Tik op "Alle uitleg uitzetten". Op de pagina Doelen zet je hem weer aan.' },
      { doel: 'tabbalk', alleenMobiel: true, titel: 'Naar een ander onderdeel', tekst: 'Onderaan het scherm wissel je tussen Vandaag, Kalender, Aanbod, Publiek en Doelen.' },
    ],
  },
  '/kalender': {
    naam: 'Kalender',
    stappen: [
      { doel: 'kalender-raster', titel: 'Je maandoverzicht', tekst: 'Elke voorstelling staat op zijn datum. Klik erop voor alle details. Met de pijltjes ga je naar een andere maand.', tekstMobiel: 'Bovenaan zie je de maand met een stip per voorstelling. Tik op een dag om naar die voorstellingen te springen. Veeg opzij of gebruik de pijltjes voor een andere maand.' },
      { doel: 'plus-knop', titel: 'Zelf inplannen', tekst: 'Ga met je muis over een dag en klik op het plusje. Kies de Grote zaal (GZ) of Kleine zaal (KZ) en plan iets uit het aanbod in, of vul zelf een voorstelling in.', alleenDesktop: true },
      { doel: 'witte-vlek', titel: 'Vrije avonden', tekst: 'Gestreepte vakjes zijn vrije vrijdag- en zaterdagavonden in de Grote zaal. Klik op "Iets inplannen?" voor voorstellingen uit het aanbod die op die datum kunnen.', tekstMobiel: 'Gestreepte dagen zijn vrije vrijdag- en zaterdagavonden in de Grote zaal. Tik op "Iets inplannen?" voor voorstellingen uit het aanbod die op die datum kunnen.' },
      { doel: 'kleuring', titel: 'Kleur naar keuze', tekst: 'Kies of de kalender kleurt op motivatie, op doelgroep (met de kleuren en afkortingen uit de brochure) of op genre. Je keuze wordt onthouden.' },
      { doel: 'filter-knop', titel: 'Filteren', tekst: 'Wil je alleen bijvoorbeeld cabaret zien? Klik op "Filteren".', tekstMobiel: 'Wil je alleen bijvoorbeeld cabaret zien? Tik op het trechtertje.' },
      { doel: 'doel-tabellen', titel: 'Doel en realisatie', tekst: 'Onder de kalender zie je per motivatie, doelgroep en genre wat we willen bereiken en hoe het nu gaat. Groen is boven het doel, rood eronder.', tekstMobiel: 'Onder de kalender zie je per motivatie, doelgroep en genre wat we willen bereiken en hoe het nu gaat. Tik op een blok om het open te klappen. Groen is boven het doel, rood eronder.' },
    ],
  },
  '/aanbod': {
    naam: 'Aanbod',
    stappen: [
      { doel: 'aanbod-kaart', titel: 'Voorstellingen die je kunt boeken', tekst: 'Bovenaan staat wat het best bij ons past. Het label "Past goed" kijkt naar ons publiek, eerdere resultaten, vrije data en de kosten.' },
      { doel: 'shortlist', titel: 'Bewaren', tekst: 'Interessant? Klik op de ster om de voorstelling te bewaren.', tekstMobiel: 'Interessant? Tik op de ster om de voorstelling te bewaren.' },
      { doel: 'aanbod-kaart', titel: 'Inplannen', tekst: 'Open een voorstelling en klik op een vrije datum. Hij komt dan als optie in de kalender.', tekstMobiel: 'Open een voorstelling en tik op een vrije datum. Hij komt dan als optie in de kalender.' },
    ],
  },
  '/publiek': {
    naam: 'Publiek',
    stappen: [
      { doel: 'segmenten', titel: 'Wie komt er?', tekst: 'Elke kaart is een groep uit het Cultureel Doelgroepenmodel, met de kleur en afkorting uit de brochure. Het zwarte streepje is het doel.', tekstMobiel: 'Elke kaart is een groep uit het Cultureel Doelgroepenmodel, met de kleur en afkorting uit de brochure. Het zwarte streepje is het doel. Tik op een kaart om te zien wat eerder goed werkte en welk aanbod past.' },
      { doel: 'spotlight', titel: 'Meer weten over een groep', tekst: 'Klik op een kaart. Hier zie je wat er eerder goed werkte en welk aanbod bij deze groep past.', alleenDesktop: true },
      { doel: 'publiek-tabs', titel: 'Waarom komen ze?', tekst: 'Wissel naar de motivaties: plezier, ontdekken, traditie en meer.' },
    ],
  },
  '/doelen': {
    naam: 'Doelen',
    stappen: [
      { doel: 'doelen-schuiven', titel: 'Wat willen we bereiken?', tekst: 'Stel per groep in welk deel van ons publiek je wilt bereiken. Samen komen ze op 100%.' },
      { doel: 'doelen-seizoen', titel: 'Het seizoen', tekst: 'Hoe vol moeten de zalen gemiddeld zitten en hoeveel voorstellingen willen we? Vandaag, de kalender en Publiek rekenen hier direct mee.' },
    ],
  },
}

/** Sleutel van de rondleiding voor een pagina. */
export const uitlegSleutel = (pad: string) => pad

export function uitlegVoor(sleutel: string | null) {
  return sleutel ? UITLEG[sleutel] ?? null : null
}

/** De stappen die op dit scherm gelden, met de passende tekst. */
export function stappenVoor(sleutel: string | null, mobiel: boolean): UitlegStap[] {
  return (uitlegVoor(sleutel)?.stappen ?? [])
    .filter((s) => (mobiel ? !s.alleenDesktop : !s.alleenMobiel))
    .map((s) => (mobiel && s.tekstMobiel ? { ...s, tekst: s.tekstMobiel } : s))
}

export const padVanSleutel = (sleutel: string) => sleutel
