export interface UitlegStap {
  /** Waarde van het data-uitleg-attribuut van het element dat wordt uitgelicht. Leeg = gecentreerd venster. */
  doel?: string
  titel: string
  tekst: string
}

/** Korte rondleiding per onderdeel. Wordt per pagina één keer automatisch getoond. */
export const UITLEG: Record<string, { naam: string; stappen: UitlegStap[] }> = {
  '/': {
    naam: 'Vandaag',
    stappen: [
      { titel: 'Welkom bij Coulisse', tekst: 'Hier zie je in één oogopslag hoe het seizoen ervoor staat en wat er aandacht nodig heeft. Alles is nu nog gevuld met voorbeelddata.' },
      { doel: 'vandaag-cijfers', titel: 'Drie cijfers', tekst: 'Hoeveel voorstellingen, hoeveel bezoekers en hoe vol de zalen zitten. Groen is goed, oranje vraagt om aandacht.' },
      { doel: 'vandaag-aandacht', titel: 'Wat vraagt aandacht?', tekst: 'Hier staan de belangrijkste punten. Klik op de knop om er meteen mee aan de slag te gaan.' },
      { doel: 'seizoenkiezer', titel: 'Ander seizoen bekijken', tekst: 'Kies "Dit seizoen" of "Volgend seizoen". Oudere seizoenen vind je onder "Eerder".' },
      { doel: 'uitleg-knop', titel: 'Uitleg terugzien', tekst: 'Met dit vraagteken start je de uitleg van een pagina opnieuw. Wil je geen uitleg meer vanzelf zien? Klik op "Alle uitleg uitzetten". Op de pagina Doelen zet je hem weer aan.' },
    ],
  },
  '/kalender': {
    naam: 'Kalender',
    stappen: [
      { doel: 'kalender-raster', titel: 'Je maandoverzicht', tekst: 'Elke voorstelling staat op zijn datum. Klik erop voor alle details. Met de pijltjes ga je naar een andere maand.' },
      { doel: 'plus-knop', titel: 'Zelf inplannen', tekst: 'Ga met je muis over een dag en klik op het plusje. Kies de Grote zaal (GZ) of Kleine zaal (KZ) en plan iets uit het aanbod in, of vul zelf een voorstelling in.' },
      { doel: 'witte-vlek', titel: 'Vrije avonden', tekst: 'Gestreepte vakjes zijn vrije vrijdag- en zaterdagavonden in de Grote zaal. Klik op "Iets inplannen?" voor voorstellingen uit het aanbod die op die datum kunnen.' },
      { doel: 'kleuring', titel: 'Kleur naar keuze', tekst: 'Kies of de kalender kleurt op motivatie, op doelgroep (met de kleuren en afkortingen uit de brochure) of op genre. Je keuze wordt onthouden.' },
      { doel: 'filter-knop', titel: 'Filteren', tekst: 'Wil je alleen bijvoorbeeld cabaret zien? Klik op "Filteren".' },
      { doel: 'doel-tabellen', titel: 'Doel en realisatie', tekst: 'Onder de kalender zie je per motivatie, doelgroep en genre wat we willen bereiken en hoe het nu gaat. Groen is boven het doel, rood eronder.' },
    ],
  },
  '/aanbod': {
    naam: 'Aanbod',
    stappen: [
      { doel: 'aanbod-kaart', titel: 'Voorstellingen die je kunt boeken', tekst: 'Bovenaan staat wat het best bij ons past. Het label "Past goed" kijkt naar ons publiek, eerdere resultaten, vrije data en de kosten.' },
      { doel: 'shortlist', titel: 'Bewaren', tekst: 'Interessant? Klik op de ster om de voorstelling te bewaren.' },
      { doel: 'aanbod-kaart', titel: 'Inplannen', tekst: 'Open een voorstelling en klik op een vrije datum. Hij komt dan als optie in de kalender.' },
    ],
  },
  '/publiek': {
    naam: 'Publiek',
    stappen: [
      { doel: 'segmenten', titel: 'Wie komt er?', tekst: 'Elke kaart is een groep uit het Cultureel Doelgroepenmodel, met de kleur en afkorting uit de brochure. Het zwarte streepje is het doel.' },
      { doel: 'spotlight', titel: 'Meer weten over een groep', tekst: 'Klik op een kaart. Hier zie je wat er eerder goed werkte en welk aanbod bij deze groep past.' },
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

export const padVanSleutel = (sleutel: string) => sleutel
