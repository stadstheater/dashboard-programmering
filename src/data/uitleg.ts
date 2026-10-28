export interface UitlegStap {
  /** Waarde van het data-uitleg-attribuut van het element dat wordt uitgelicht. Leeg = gecentreerd venster. */
  doel?: string
  titel: string
  tekst: string
}

/** Korte rondleiding per onderdeel. Wordt per pagina één keer automatisch getoond. */
export const UITLEG: Record<string, { naam: string; stappen: UitlegStap[] }> = {
  '/': {
    naam: 'Cockpit',
    stappen: [
      { titel: 'Welkom bij Coulisse', tekst: 'Dit dashboard helpt je programmeren met oog voor doelgroepen en motivaties. Alles is nu nog gevuld met dummy data. Per onderdeel krijg je één keer een korte uitleg.' },
      { doel: 'seizoenkiezer', titel: 'Kies een seizoen', tekst: 'Wissel hier tussen seizoenen. 26/27 loopt nu, 27/28 is het seizoen dat je aan het bouwen bent. Alle pagina\'s rekenen mee met je keuze.' },
      { doel: 'kpi', titel: 'De kerncijfers', tekst: 'Aantal voorstellingen, bezoekers, bezetting, recette en voorverkoop. Voor gespeelde voorstellingen tellen de werkelijke bezoekers, voor de rest de verwachting.' },
      { doel: 'signalen', titel: 'Signaleringen', tekst: 'Het dashboard zoekt zelf naar kansen en aandachtspunten, zoals een doelgroep die achterblijft of vrije weekendavonden. Klik op een kaart om er direct naartoe te gaan.' },
      { doel: 'balans', titel: 'Balans versus doel', tekst: 'De gekleurde balk is het aandeel in het bereik, het zwarte streepje is het seizoensdoel. Doelen stel je in via de Databuilder.' },
      { doel: 'uitleg-knop', titel: 'Uitleg terugzien', tekst: 'Met deze knop start je de uitleg van een pagina opnieuw.' },
    ],
  },
  '/kalender': {
    naam: 'Kalender',
    stappen: [
      { doel: 'weergave', titel: 'Vier weergaven', tekst: 'Bekijk het seizoen per maand, per week (met een baan per zaal), als seizoensoverzicht of als sorteerbare lijst. Kleur op genre of op status.' },
      { doel: 'filters', titel: 'Filteren', tekst: 'Filter op genre, zaal, status, doelgroep of motivatie, of zoek op titel en impresariaat. Filters blijven staan als je van weergave wisselt.' },
      { doel: 'witte-vlek', titel: 'Witte vlekken', tekst: 'Gestreepte vakjes zijn vrije weekendavonden in de Grote zaal. Klik op "vrij" voor het best passende aanbod op die datum.' },
      { doel: 'kalender-raster', titel: 'Details', tekst: 'Klik op een voorstelling voor alle details: voorverkoop, doelgroepen, kannibalisatie en het artiestengeheugen.' },
    ],
  },
  '/aanbod': {
    naam: 'Aanbod',
    stappen: [
      { doel: 'aanbod-filters', titel: 'Zoeken en filteren', tekst: 'Filter het aanbod van impresariaten op genre, impresariaat, doelgroep, motivatie, status en maximale uitkoopsom.' },
      { doel: 'aanbod-kaart', titel: 'De matchscore', tekst: 'Elke productie krijgt een score van 0 tot 100: vult het een gat in doelgroepen of motivaties, hoe deed de artiest het eerder, zijn er vrije data en klopt de financiële verhouding?' },
      { doel: 'shortlist', titel: 'Shortlist', tekst: 'Zet interessante producties met de ster op je shortlist. Die verschijnen vervolgens bovenaan in de Seizoensbouwer.' },
      { doel: 'aanbod-kaart', titel: 'Direct inplannen', tekst: 'Open een productie om de uitleg van de matchscore te zien en een vrije datum direct in je scenario te zetten.' },
    ],
  },
  '/scenario': {
    naam: 'Seizoensbouwer',
    stappen: [
      { doel: 'kandidaten', titel: 'Kandidaten', tekst: 'Hier staan je shortlist en de topmatches. Pak een kaart vast en sleep hem naar de kalender.' },
      { doel: 'scenario-kalender', titel: 'Slepen en plaatsen', tekst: 'Tijdens het slepen lichten de data op waarop de productie beschikbaar is en de zaal vrij is. Paarse blokken zijn jouw scenario, grijze blokken staan al vast.' },
      { doel: 'impact', titel: 'Direct de impact', tekst: 'Zie meteen wat je scenario doet met het aantal voorstellingen, bezoekers, recette en saldo. Verderop zie je de verschuiving in doelgroepen en motivaties.' },
      { doel: 'kannibalisatie', titel: 'Kannibalisatie-alarm', tekst: 'Staan vergelijkbare voorstellingen te dicht op elkaar, dan zie je dat hier. Gestippelde kaarten komen door je scenario.' },
      { doel: 'bevestig', titel: 'Bevestigen', tekst: 'Tevreden? Bevestig en je scenario wordt als optie in de kalender gezet.' },
    ],
  },
  '/doelgroepen': {
    naam: 'Doelgroepen',
    stappen: [
      { doel: 'segmenten', titel: 'De negen segmenten', tekst: 'Per segment van het Cultureel Doelgroepenmodel: aandeel in het bereik, verschil met het doel, de trend over zes seizoenen en de index ten opzichte van het verzorgingsgebied.' },
      { doel: 'spotlight', titel: 'In de spotlight', tekst: 'Klik op een segment om te zien wat er eerder werkte, welke genres deze groep bereiken en welk aanbod past.' },
      { doel: 'matrix', titel: 'Kruistabellen', tekst: 'Hoe donkerder het vakje, hoe meer bezoeken. Klik op een rij om dat segment in de spotlight te zetten.' },
    ],
  },
  '/motivaties': {
    naam: 'Motivaties',
    stappen: [
      { doel: 'segmenten', titel: 'Waarom komt ons publiek?', tekst: 'Per bezoekersmotivatie het aandeel in het bereik, het verschil met het doel en de trend over zes seizoenen.' },
      { doel: 'spotlight', titel: 'In de spotlight', tekst: 'Klik op een motivatie voor de toppers uit het verleden, de genres die erbij horen en passend aanbod.' },
      { doel: 'matrix', titel: 'Motivatie en doelgroep', tekst: 'Zie welke drijfveren bij welke groep horen en wanneer in het seizoen je ze bereikt.' },
    ],
  },
  '/historie': {
    naam: 'Historie & profiel',
    stappen: [
      { doel: 'seizoenen-grafiek', titel: 'Seizoenen vergeleken', tekst: 'Bezoekers en bezettingsgraad per seizoen. Lichtblauw is de prognose voor wat nog gespeeld moet worden.' },
      { doel: 'dna', titel: 'Theater-DNA', tekst: 'Het genreprofiel van het gekozen seizoen naast het gemiddelde van eerdere seizoenen. Zo zie je of je profiel verschuift.' },
      { doel: 'inschatting', titel: 'Hoe goed schatten we in?', tekst: 'Werkelijke bezoekers als percentage van de verwachting, per genre. Rood betekent dat we te optimistisch zijn.' },
    ],
  },
  '/artiesten': {
    naam: 'Artiestengeheugen',
    stappen: [
      { doel: 'terugkeer', titel: 'Tijd voor een terugkeer', tekst: 'Sterke artiesten die nog niet opnieuw geboekt zijn en van wie het terugboekmoment binnenkort valt.' },
      { doel: 'artiest-tabel', titel: 'Alle artiesten', tekst: 'Per artiest de seizoenen, de bezetting, de trend en een oordeel met terugboekadvies. Klik op een rij voor alle voorstellingen.' },
      { doel: 'artiest-tabs', titel: 'Impresariaten', tekst: 'Wissel naar de scorekaart per impresariaat: historische bezetting, saldo en de kwaliteit van hun huidige aanbod.' },
    ],
  },
  '/builder': {
    naam: 'Databuilder',
    stappen: [
      { doel: 'builder-tabs', titel: 'Alles zelf aanpassen', tekst: 'Beheer voorstellingen, aanbod, seizoensdoelen en de complete dataset. Wijzigingen worden in deze browser bewaard.' },
      { doel: 'builder-nieuw', titel: 'Toevoegen en bewerken', tekst: 'Voeg een voorstelling of aanbod toe. Met "Slim aanvullen" vult het formulier zelf capaciteit, prijs en uitkoopsom in.' },
      { doel: 'builder-tabs', titel: 'Dataset en Excel', tekst: 'Onder Dataset genereer je nieuwe dummy data of lees je een programmeringsexport in Excel in. Daar zet je ook alle uitleg weer aan.' },
    ],
  },
}
