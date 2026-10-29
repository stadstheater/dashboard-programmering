/**
 * Vervangt echte titels en artiesten in de JSON-basis door verzonnen namen.
 * Datums, zalen, genres, statussen, doelgroepen en motivaties blijven gelijk.
 * Regels die geen voorstelling zijn (inleidingen, feestdagen) vallen weg.
 *
 * Gebruik: node scripts/anonimiseer.mjs <invoer.json> src/data/basis-2627.json
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [invoer, uitvoer] = process.argv.slice(2)
if (!invoer || !uitvoer) {
  console.error('Gebruik: node scripts/anonimiseer.mjs <invoer.json> <uitvoer.json>')
  process.exit(1)
}

const GEEN_VOORSTELLING = /^(inleiding|hemelvaart|pasen|pinksteren|kerst(dag)?|pauze)$/i

const VOORNAMEN = ['Sanne', 'Joris', 'Femke', 'Bas', 'Lotte', 'Thijs', 'Noor', 'Daan', 'Eva', 'Ruben', 'Maartje', 'Jelle', 'Iris', 'Sem', 'Fleur', 'Wouter', 'Anouk', 'Stijn', 'Lieke', 'Pepijn', 'Yara', 'Mehmet', 'Samira', 'Kees', 'Ilse', 'Rachid', 'Hanna', 'Tijmen', 'Merel', 'Gijs', 'Nadia', 'Floor']
const ACHTERNAMEN = ['Verbeek', 'Kroon', 'Hagens', 'Lindeman', 'Prins', 'Vermeulen', 'Wijnands', 'Rietveld', 'Zwart', 'Molenaar', 'Haverkamp', 'Bouma', 'Oudshoorn', 'Tromp', 'Akkerman', 'Bijl', 'Demir', 'Kaya', 'Sterk', 'Valk', 'Wever', 'Ruiter', 'Laan', 'Bremer']
const CABARET = ['Ongefilterd', 'Kortsluiting', 'Thuiswedstrijd', 'Overmoed', 'Volle Maan', 'Hoe dan ook', 'Nieuw Licht', 'Tegenwind', 'Zonder Pardon', 'Alles Komt Goed', 'Midlife', 'Grootspraak', 'Losgeslagen', 'Recht door Zee', 'Onder Ons', 'Bijna Thuis']

const LIJSTEN = {
  Muziek: kruis(['Golden', 'Velvet', 'Midnight', 'Northern', 'Electric', 'Polder', 'Silver', 'Dutch', 'Sunset', 'Royal'], ['Hits Live', 'Tribute Night', 'Revue', 'Big Band', 'Classics', 'Sessions', 'Unplugged', 'Experience']),
  'Klassieke muziek': ['Strijkkwartet Aurora', 'Pianorecital Lumen', 'Barokensemble Delta', 'Kamerorkest Zuidplas', 'Celloavond Vesper', 'Trio Belcanto'],
  'Jeugd & Familie': kruis(['Kapitein', 'Prinses', 'Ridder', 'Juf', 'Meneer', 'Opa', 'Kabouter', 'Draakje', 'Beertje', 'Tante'], ['Knoop', 'Pannenkoek', 'Roest', 'Wolkje', 'Plons', 'Sterretje', 'Tuimel', 'Hupsakee']),
  Show: ['Magic Night', 'Circus Fantasia', 'Ierse Dansnacht', 'Gospel Explosion', 'Comedy Night Live', 'De Grote Quizshow', 'Illusie', 'Filmmuziek Live', 'Dancing Queens', 'Acrobaten van de Nacht', 'Lichtspektakel', 'Sterrenparade'],
  Dans: ['Dansgezelschap Vloed', 'Urban Moves', 'Tango Nuevo', 'Flamenco Pasión', 'Ritme Collectief', 'Zwaartekracht', 'Balletgroep Horizon', 'Danshuis Noord'],
  Musical: ['Havenlicht', 'De Laatste Tram', 'Sterren van Toen', 'Rozenwals', 'Hotel Hollandia', 'Kroonjuweel', 'De Vuurtoren', 'Zomernacht', 'Gouden Jaren', 'Polderhart', 'Het Grote Feest', 'Duizend Lichtjes'],
  Toneel: ['Het Diner', 'Familieportret', 'Na de Storm', 'De Erfenis', 'Avondrood', 'Wachtkamer', 'Glazen Huis', 'Kinderen van de Polder', 'De Verhuizing', 'Buren', 'Het Testament', 'Logeren', 'De Reünie', 'Hoogtij', 'Tussen Twee Vuren', 'Open Huis'],
  Opera: ['Operagezelschap Lumen: La Traviata', 'Operagezelschap Lumen: Tosca', 'Opera Zuidwest: Carmen', 'Opera Zuidwest: La Bohème'],
}
const PERSOONLIJK = new Set(['Cabaret', 'Theatercollege', 'Muziektheater', 'Special'])

function kruis(a, b) {
  return a.flatMap((x) => b.map((y) => `${x} ${y}`))
}

/** Vaste volgorde op basis van een hash, zodat dezelfde invoer dezelfde namen geeft. */
function hash(tekst) {
  let h = 2166136261
  for (let i = 0; i < tekst.length; i++) h = Math.imul(h ^ tekst.charCodeAt(i), 16777619)
  return h >>> 0
}

const LEEFTIJD = /\s*\((\d{1,2}\+)\)\s*/
const TOEVOEGING = /\s*\((reprise|extra|middag|avond|try[- ]?out|première)[^)]*\)\s*/i

function kern(titel) {
  return titel
    .replace(LEEFTIJD, ' ')
    .replace(TOEVOEGING, ' ')
    .replace(/\s+succes\s+optie$/i, '')
    .replace(/\s+(2|II)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const rijen = JSON.parse(readFileSync(invoer, 'utf8'))
const gebruikt = new Set()
const naamVoor = new Map()

function nieuweNaam(sleutel, genre) {
  if (naamVoor.has(sleutel)) return naamVoor.get(sleutel)
  let h = hash(sleutel)
  let naam = ''
  for (let poging = 0; poging < 500; poging++, h = hash(String(h))) {
    if (PERSOONLIJK.has(genre) || !LIJSTEN[genre]) {
      const persoon = `${VOORNAMEN[h % VOORNAMEN.length]} ${ACHTERNAMEN[(h >>> 8) % ACHTERNAMEN.length]}`
      naam = genre === 'Cabaret' ? `${persoon}: ${CABARET[(h >>> 16) % CABARET.length]}` : persoon
    } else {
      const lijst = LIJSTEN[genre]
      naam = lijst[h % lijst.length]
    }
    if (!gebruikt.has(naam)) break
  }
  gebruikt.add(naam)
  naamVoor.set(sleutel, naam)
  return naam
}

let weg = 0
const uit = []
rijen.forEach((r) => {
  const sleutel = kern(r.titel)
  if (GEEN_VOORSTELLING.test(sleutel)) {
    weg++
    return
  }
  // Rijen zonder genre die duidelijk een kindervoorstelling zijn, krijgen dat genre.
  const genre = r.genre ?? (/nijntje|\(\d\+\)/i.test(r.titel) ? 'Jeugd & Familie' : /traviata|tosca|carmen/i.test(r.titel) ? 'Opera' : null)
  const leeftijd = r.leeftijd ?? r.titel.match(LEEFTIJD)?.[1] ?? null
  const toevoeging = r.titel.match(TOEVOEGING)?.[0].trim()
  const nummer = / (2|II)$/i.test(r.titel.replace(LEEFTIJD, ' ').trim()) ? ' 2' : ''
  const naam = nieuweNaam(`${genre}|${sleutel.toLowerCase()}`, genre)
  uit.push({
    ...r,
    genre,
    leeftijd,
    titel: `${naam}${nummer}${toevoeging ? ` ${toevoeging.toLowerCase()}` : ''}`,
    id: `b-${String(uit.length + 1).padStart(3, '0')}`,
  })
})

writeFileSync(uitvoer, JSON.stringify(uit, null, 2) + '\n')
console.log(`${uit.length} voorstellingen geanonimiseerd, ${weg} regels zonder voorstelling weggelaten, ${naamVoor.size} artiesten.`)
