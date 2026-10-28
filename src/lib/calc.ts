import { isoDatum, naarDatum } from '../data/generate'
import type { Voorstelling } from '../data/types'
import {
  DOELGROEPEN, DOELGROEP_GEWICHTEN, GENRE_FAMILIES, MOTIVATIES, MOTIVATIE_GEWICHTEN, familieVan,
} from '../data/vocab'

export const vandaag = () => isoDatum(new Date())

export const actief = (v: Voorstelling) => v.status !== 'Geannuleerd'
export const isVerleden = (v: Voorstelling, peildatum = vandaag()) => v.datum < peildatum

export function dagenTot(iso: string, peildatum = vandaag()) {
  return Math.round((naarDatum(iso).getTime() - naarDatum(peildatum).getTime()) / 86400000)
}

/** Bezoekers: werkelijk aantal voor het verleden, verwachting voor de toekomst. */
export const bezoekers = (v: Voorstelling, peildatum = vandaag()) =>
  !actief(v) ? 0 : isVerleden(v, peildatum) ? v.eindstand : v.verwacht

/** Dummy voorverkoopcurve: hoe dichter bij de speeldatum, hoe meer kaarten verkocht. */
export function verkochtTotNu(v: Voorstelling, peildatum = vandaag()) {
  if (!actief(v)) return 0
  const d = dagenTot(v.datum, peildatum)
  if (d < 0) return v.eindstand
  const fractie = Math.pow(Math.min(1, Math.max(0.06, 1 - d / 320)), 1.5)
  return Math.round(v.eindstand * fractie)
}

/** Prognose: lineaire verwachting op basis van verkooptempo vergeleken met de normcurve. */
export function voorverkoopIndex(v: Voorstelling, peildatum = vandaag()) {
  const d = dagenTot(v.datum, peildatum)
  if (d < 0 || !actief(v)) return null
  const norm = Math.pow(Math.min(1, Math.max(0.06, 1 - d / 320)), 1.5) * v.verwacht
  return norm > 0 ? verkochtTotNu(v, peildatum) / norm : null
}

export const bezetting = (v: Voorstelling, peildatum = vandaag()) => bezoekers(v, peildatum) / v.capaciteit
export const recette = (v: Voorstelling, peildatum = vandaag()) => bezoekers(v, peildatum) * v.prijs
export const marge = (v: Voorstelling, peildatum = vandaag()) => (actief(v) ? recette(v, peildatum) - v.uitkoopsom : 0)

export function som<T>(lijst: T[], f: (x: T) => number) {
  return lijst.reduce((s, x) => s + f(x), 0)
}

export function gemiddeldeBezetting(lijst: Voorstelling[], peildatum = vandaag()) {
  const a = lijst.filter(actief)
  const cap = som(a, (v) => v.capaciteit)
  return cap ? som(a, (v) => bezoekers(v, peildatum)) / cap : 0
}

/** Bereik per doelgroep: bezoekers verdeeld over de toegewezen doelgroepen (40/30/20/10). */
export function bereikPerDoelgroep(lijst: Voorstelling[], peildatum = vandaag()) {
  const uit: Record<string, number> = Object.fromEntries(DOELGROEPEN.map((d) => [d.naam, 0]))
  for (const v of lijst) {
    if (!actief(v) || !v.doelgroepen.length) continue
    const b = bezoekers(v, peildatum)
    const gewichten = DOELGROEP_GEWICHTEN.slice(0, v.doelgroepen.length)
    const totaal = som(gewichten, (g) => g)
    v.doelgroepen.forEach((d, i) => {
      uit[d] = (uit[d] ?? 0) + (b * gewichten[i]) / totaal
    })
  }
  return uit
}

export function bereikPerMotivatie(lijst: Voorstelling[], peildatum = vandaag()) {
  const uit: Record<string, number> = Object.fromEntries(MOTIVATIES.map((m) => [m.naam, 0]))
  for (const v of lijst) {
    if (!actief(v) || !v.motivaties.length) continue
    const b = bezoekers(v, peildatum)
    const gewichten = MOTIVATIE_GEWICHTEN.slice(0, v.motivaties.length)
    const totaal = som(gewichten, (g) => g)
    v.motivaties.forEach((m, i) => {
      uit[m] = (uit[m] ?? 0) + (b * gewichten[i]) / totaal
    })
  }
  return uit
}

export function bereikPerFamilie(lijst: Voorstelling[], peildatum = vandaag()) {
  const uit: Record<string, number> = Object.fromEntries(GENRE_FAMILIES.map((f) => [f.naam, 0]))
  for (const v of lijst) if (actief(v)) uit[familieVan(v.genre).naam] += bezoekers(v, peildatum)
  return uit
}

export function aandelen(r: Record<string, number>) {
  const totaal = Object.values(r).reduce((a, b) => a + b, 0)
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, totaal ? (v / totaal) * 100 : 0]))
}

export function telPer<T>(lijst: T[], sleutel: (x: T) => string | string[]) {
  const uit: Record<string, number> = {}
  for (const x of lijst) {
    const s = sleutel(x)
    for (const k of Array.isArray(s) ? s : [s]) uit[k] = (uit[k] ?? 0) + 1
  }
  return uit
}

export const SEIZOENSMAANDEN = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5] // september t/m juni
export const MAANDNAMEN = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
export const MAANDNAMEN_LANG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
export const DAGNAMEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']

export const maandVan = (iso: string) => Number(iso.slice(5, 7)) - 1

/* ---------- Opmaak ---------- */

const nf = new Intl.NumberFormat('nl-NL')
export const getal = (x: number) => nf.format(Math.round(x))
export const procent = (x: number, decimalen = 0) => `${(x * 100).toFixed(decimalen).replace('.', ',')}%`
export const euro = (x: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(x)
export const euroKort = (x: number) =>
  Math.abs(x) >= 1_000_000 ? `€ ${(x / 1_000_000).toFixed(1).replace('.', ',')} mln` : Math.abs(x) >= 10_000 ? `€ ${Math.round(x / 1000)}k` : euro(x)

export function datumLang(iso: string) {
  const d = naarDatum(iso)
  return `${['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'][d.getDay()]} ${d.getDate()} ${MAANDNAMEN_LANG[d.getMonth()]} ${d.getFullYear()}`
}
export function datumKort(iso: string) {
  const d = naarDatum(iso)
  return `${DAGNAMEN[d.getDay()]} ${d.getDate()} ${MAANDNAMEN[d.getMonth()]}`
}
