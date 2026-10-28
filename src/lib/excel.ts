import readXlsxFile from 'read-excel-file/browser'
import writeXlsxFile, { type Row, type Sheet } from 'write-excel-file/browser'
import { basisNaarVoorstelling, isoDatum, maakRng, type BasisRij } from '../data/generate'
import type { Dataset, Voorstelling } from '../data/types'

const MOTIVATIE_KOLOMMEN = ['Bezoekersmotivatie', 'Bezoekersmotivatie 2']
const DOELGROEP_KOLOMMEN = ['Toegewezen doelgroep (Cultureel Doelgroepenmodel)', 'Toegewezen doelgroep 2', 'Toegewezen doelgroep 3', 'Toegewezen doelgroep 4']

const tekst = (x: unknown) => (x === null || x === undefined ? null : String(x).trim() || null)

function datumUit(x: unknown): string | null {
  if (x instanceof Date) return isoDatum(new Date(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()))
  if (typeof x === 'string') {
    const iso = x.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    const nl = x.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/)
    if (nl) return `${nl[3]}-${nl[2].padStart(2, '0')}-${nl[1].padStart(2, '0')}`
  }
  return null
}

/** Leest een programmeringsexport in hetzelfde formaat als de oorspronkelijke Excel. */
export async function leesProgrammeringExcel(bestand: File): Promise<{ voorstellingen: Voorstelling[]; overgeslagen: number }> {
  const bladen = await readXlsxFile(bestand)
  const data = bladen[0]?.data ?? []
  const kop = (data[0] ?? []).map((k) => (k === null ? '' : String(k).trim()))
  const idx = (naam: string) => kop.indexOf(naam)
  const rng = maakRng(Date.now() % 100000)
  let overgeslagen = 0
  const voorstellingen: Voorstelling[] = []
  for (const rij of data.slice(1)) {
    const waarde = (naam: string) => (idx(naam) >= 0 ? rij[idx(naam)] : null)
    const titel = tekst(waarde('Titel'))
    const datum = datumUit(waarde('Datum'))
    if (!titel || !datum) {
      overgeslagen++
      continue
    }
    const basis: BasisRij = {
      seizoen: tekst(waarde('Theaterseizoen')),
      status: tekst(waarde('Status')),
      datum,
      titel,
      genre: tekst(waarde('Genre')),
      leeftijd: tekst(waarde('Leeftijdsadvies')),
      zaal: tekst(waarde('Locatie')),
      verwacht: Number(waarde('Verwacht aantal bezoekers')) || null,
      id: tekst(waarde('ID')) ?? '',
      motivaties: MOTIVATIE_KOLOMMEN.map((k) => tekst(waarde(k))).filter((x): x is string => !!x),
      doelgroepen: DOELGROEP_KOLOMMEN.map((k) => tekst(waarde(k))).filter((x): x is string => !!x),
    }
    voorstellingen.push(basisNaarVoorstelling(basis, rng, 'builder'))
  }
  return { voorstellingen, overgeslagen }
}

const kopCel = (value: string) => ({ value, fontWeight: 'bold' as const, backgroundColor: '#FFE7DF' })

export async function exporteerExcel(dataset: Dataset) {
  const vKop = ['Theaterseizoen', 'Status', 'Datum', 'Tijd', 'Titel', 'Artiest', 'Impresariaat', 'Genre', 'Leeftijdsadvies', 'Locatie', 'Capaciteit', 'Verwacht aantal bezoekers', 'Eindstand (dummy)', 'Ticketprijs', 'Uitkoopsom', ...MOTIVATIE_KOLOMMEN, ...DOELGROEP_KOLOMMEN, 'ID']
  const vRijen: Row[] = dataset.voorstellingen.map((v) => [
    `Seizoen ${v.seizoen}`, v.status, v.datum, v.tijd, v.titel, v.artiest, v.impresariaat, v.genre, v.leeftijd, v.zaal, v.capaciteit,
    v.verwacht, v.eindstand, v.prijs, v.uitkoopsom, v.motivaties[0] ?? null, v.motivaties[1] ?? null,
    v.doelgroepen[0] ?? null, v.doelgroepen[1] ?? null, v.doelgroepen[2] ?? null, v.doelgroepen[3] ?? null, v.id,
  ])
  const aKop = ['Titel', 'Artiest', 'Impresariaat', 'Genre', 'Status', 'Zalen', 'Periode start', 'Periode eind', 'Beschikbare data', 'Uitkoopsom', 'Prijsindicatie', 'Duur (min)', 'Verwacht', 'Motivaties', 'Doelgroepen', 'Première', 'Ontvangen', 'Omschrijving']
  const aRijen: Row[] = dataset.aanbod.map((a) => [
    a.titel, a.artiest, a.impresariaat, a.genre, a.status, a.zalen.join(', '), a.periodeStart, a.periodeEind, a.beschikbareData.join(', '),
    a.uitkoopsom, a.prijsIndicatie, a.duur, a.verwacht, a.motivaties.join(', '), a.doelgroepen.join(', '), a.premiere ? 'ja' : 'nee', a.ontvangen, a.omschrijving,
  ])
  const bladen: Sheet<Blob>[] = [
    { sheet: 'Voorstellingen', data: [vKop.map(kopCel), ...vRijen] },
    { sheet: 'Aanbod', data: [aKop.map(kopCel), ...aRijen] },
  ]
  await writeXlsxFile(bladen).toFile(`coulisse-dataset-${dataset.seed}.xlsx`)
}

export function downloadJson(dataset: Dataset) {
  const blob = new Blob([JSON.stringify(dataset, null, 1)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `coulisse-dataset-${dataset.seed}.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
