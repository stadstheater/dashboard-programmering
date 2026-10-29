import { CalendarDots, CheckCircle, ClipboardText, Lightning, type Icon } from '@phosphor-icons/react'
import { isoDatum, naarDatum, seizoenStartJaar } from '../data/generate'
import type { Aanbod, Doelen, Voorstelling, Zaal } from '../data/types'
import { DOELGROEPEN, DOELGROEP_GEWICHTEN, HUIDIG_SEIZOEN, MOTIVATIES, MOTIVATIE_GEWICHTEN, familieVan, segmentVan } from '../data/vocab'
import {
  aandelen, actief, bereikPerDoelgroep, bereikPerMotivatie, datumKort, dagenTot, isVerleden, procent, vandaag,
} from './calc'

/* ---------- Matchscore voor aanbod ---------- */

export interface Reden {
  type: 'plus' | 'min'
  tekst: string
}

export interface Match {
  score: number
  delen: { doelgroep: number; motivatie: number; historie: number; kalender: number; financieel: number }
  redenen: Reden[]
  vrijeData: string[]
  bekend: boolean
  historischeBezetting: number | null
}

export const MATCH_GEWICHTEN = { doelgroep: 30, motivatie: 15, historie: 25, kalender: 15, financieel: 15 }

export interface MatchContext {
  plan: Voorstelling[]
  historie: Voorstelling[]
  doelen: Doelen
  dgAandeel: Record<string, number>
  motAandeel: Record<string, number>
  bezet: Set<string>
  perArtiest: Map<string, number[]>
  perGenre: Map<string, number[]>
}

export function maakMatchContext(plan: Voorstelling[], alle: Voorstelling[], doelen: Doelen): MatchContext {
  const peil = vandaag()
  const historie = alle.filter((v) => actief(v) && isVerleden(v, peil))
  const perArtiest = new Map<string, number[]>()
  const perGenre = new Map<string, number[]>()
  for (const v of historie) {
    const b = v.eindstand / v.capaciteit
    perArtiest.set(v.artiest, [...(perArtiest.get(v.artiest) ?? []), b])
    perGenre.set(v.genre, [...(perGenre.get(v.genre) ?? []), b])
  }
  return {
    plan,
    historie,
    doelen,
    dgAandeel: aandelen(bereikPerDoelgroep(plan)),
    motAandeel: aandelen(bereikPerMotivatie(plan)),
    bezet: new Set(plan.filter(actief).map((v) => `${v.datum}|${v.zaal}`)),
    perArtiest,
    perGenre,
  }
}

const gem = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const klem01 = (x: number) => Math.max(0, Math.min(1, x))

function gatScore(namen: string[], gewichten: number[], aandeel: Record<string, number>, doel: Record<string, number>) {
  if (!namen.length) return { score: 0, beste: null as string | null }
  const g = gewichten.slice(0, namen.length)
  const totaal = g.reduce((a, b) => a + b, 0)
  let score = 0
  let beste: string | null = null
  let besteGat = 0
  namen.forEach((n, i) => {
    const d = doel[n] ?? 0
    const gat = d > 0 ? klem01((d - (aandeel[n] ?? 0)) / d) : 0
    score += (gat * g[i]) / totaal
    if (gat > besteGat) {
      besteGat = gat
      beste = n
    }
  })
  return { score: klem01(score * 2.6), beste: besteGat > 0.15 ? beste : null }
}

export function berekenMatch(a: Aanbod, ctx: MatchContext): Match {
  const redenen: Reden[] = []

  const dg = gatScore(a.doelgroepen, DOELGROEP_GEWICHTEN, ctx.dgAandeel, ctx.doelen.doelgroepen)
  if (dg.beste) redenen.push({ type: 'plus', tekst: `Vult gat bij ${dg.beste}` })
  else if (dg.score < 0.15) redenen.push({ type: 'min', tekst: 'Doelgroepen zijn al goed bediend' })

  const mot = gatScore(a.motivaties, MOTIVATIE_GEWICHTEN, ctx.motAandeel, ctx.doelen.motivaties)
  if (mot.beste) redenen.push({ type: 'plus', tekst: `Versterkt motivatie ${mot.beste}` })

  const eigen = ctx.perArtiest.get(a.artiest) ?? []
  const bekend = eigen.length > 0
  const histBez = bekend ? gem(eigen) : gem(ctx.perGenre.get(a.genre) ?? []) * 0.92
  const historie = klem01((histBez - 0.45) / 0.4)
  if (bekend) {
    redenen.push({
      type: histBez >= 0.7 ? 'plus' : 'min',
      tekst: `Speelde ${eigen.length}x bij ons met gem. ${procent(histBez)} bezetting`,
    })
  } else {
    redenen.push({ type: 'min', tekst: `Nieuw in Zoetermeer, genre haalt gem. ${procent(histBez / 0.92)}` })
  }

  const peil = vandaag()
  const vrijeData = a.beschikbareData.filter((d) => d >= peil && a.zalen.some((z) => !ctx.bezet.has(`${d}|${z}`)))
  const weekend = vrijeData.filter((d) => [5, 6].includes(naarDatum(d).getDay())).length
  const kalender = a.beschikbareData.length
    ? klem01((vrijeData.length / a.beschikbareData.length) * 0.75 + Math.min(weekend, 2) * 0.125)
    : 0
  if (!vrijeData.length) redenen.push({ type: 'min', tekst: 'Geen vrije data in de gewenste zaal' })
  else if (weekend) redenen.push({ type: 'plus', tekst: `${weekend} vrije weekenddatum${weekend > 1 ? 's' : ''}` })

  const omzet = a.verwacht * a.prijsIndicatie
  const ratio = omzet ? (omzet - a.uitkoopsom) / omzet : 0
  const financieel = klem01((ratio + 0.05) / 0.6)
  if (ratio > 0.4) redenen.push({ type: 'plus', tekst: 'Gunstige verhouding uitkoopsom en recette' })
  if (ratio < 0.15) redenen.push({ type: 'min', tekst: 'Krappe marge op de uitkoopsom' })

  const delen = { doelgroep: dg.score, motivatie: mot.score, historie, kalender, financieel }
  const score = Math.round(
    delen.doelgroep * MATCH_GEWICHTEN.doelgroep +
      delen.motivatie * MATCH_GEWICHTEN.motivatie +
      delen.historie * MATCH_GEWICHTEN.historie +
      delen.kalender * MATCH_GEWICHTEN.kalender +
      delen.financieel * MATCH_GEWICHTEN.financieel,
  )
  return { score, delen, redenen, vrijeData, bekend, historischeBezetting: bekend ? histBez : null }
}

/* ---------- Kannibalisatie ---------- */

export interface Conflict {
  a: Voorstelling
  b: Voorstelling
  dagen: number
  reden: string
  ernst: 'hoog' | 'midden'
}

export function vindKannibalisatie(lijst: Voorstelling[], venster = 10): Conflict[] {
  const a = lijst.filter(actief).sort((x, y) => x.datum.localeCompare(y.datum))
  const uit: Conflict[] = []
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      const d = dagenTot(a[j].datum, a[i].datum)
      if (d > Math.max(venster, 60)) break
      const x = a[i]
      const y = a[j]
      if (x.artiest === y.artiest) {
        if (x.titel !== y.titel && d <= 60) uit.push({ a: x, b: y, dagen: d, reden: 'Zelfde artiest binnen twee maanden', ernst: 'midden' })
        continue
      }
      if (d > venster) continue
      const zelfdeFamilie = familieVan(x.genre).naam === familieVan(y.genre).naam
      const zelfdeKern = x.doelgroepen[0] && x.doelgroepen[0] === y.doelgroepen[0]
      const zelfdeMotivatie = x.motivaties[0] && x.motivaties[0] === y.motivaties[0]
      if (zelfdeFamilie && zelfdeKern && x.zaal === y.zaal && d <= 4) {
        uit.push({ a: x, b: y, dagen: d, reden: `Zelfde genre en kerndoelgroep binnen ${d} dagen`, ernst: 'hoog' })
      } else if (zelfdeFamilie && zelfdeKern && zelfdeMotivatie && d <= venster && x.zaal === 'Grote zaal' && y.zaal === 'Grote zaal') {
        uit.push({ a: x, b: y, dagen: d, reden: `Vergelijkbaar profiel (${familieVan(x.genre).naam}, ${x.doelgroepen[0]})`, ernst: 'midden' })
      }
    }
  }
  return uit
}

/* ---------- Witte vlekken ---------- */

export interface WitteVlek {
  datum: string
  zaal: Zaal
}

export function vindWitteVlekken(lijst: Voorstelling[], seizoen: string, zaal: Zaal = 'Grote zaal', vanaf = vandaag()): WitteVlek[] {
  const bezet = new Set(lijst.filter(actief).map((v) => `${v.datum}|${v.zaal}`))
  const jaar = seizoenStartJaar(seizoen)
  const uit: WitteVlek[] = []
  for (let d = new Date(jaar, 8, 1); d <= new Date(jaar + 1, 5, 30); d.setDate(d.getDate() + 1)) {
    const iso = isoDatum(d)
    if (iso < vanaf) continue
    if ([5, 6].includes(d.getDay()) && !bezet.has(`${iso}|${zaal}`)) uit.push({ datum: iso, zaal })
  }
  return uit
}

export function doelgroepAfwijkingen(lijst: Voorstelling[], doelen: Doelen) {
  const aandeel = aandelen(bereikPerDoelgroep(lijst))
  return DOELGROEPEN.map((d) => ({
    segment: d,
    aandeel: aandeel[d.naam] ?? 0,
    doel: doelen.doelgroepen[d.naam] ?? 0,
    verschil: (aandeel[d.naam] ?? 0) - (doelen.doelgroepen[d.naam] ?? 0),
  }))
}

export function motivatieAfwijkingen(lijst: Voorstelling[], doelen: Doelen) {
  const aandeel = aandelen(bereikPerMotivatie(lijst))
  return MOTIVATIES.map((m) => ({
    segment: m,
    aandeel: aandeel[m.naam] ?? 0,
    doel: doelen.motivaties[m.naam] ?? 0,
    verschil: (aandeel[m.naam] ?? 0) - (doelen.motivaties[m.naam] ?? 0),
  }))
}

/* ---------- Artiestengeheugen ---------- */

export type Oordeel = 'Topper' | 'Solide' | 'Twijfel' | 'Risico' | 'Onbekend'

export interface ArtiestProfiel {
  artiest: string
  genre: string
  impresariaat: string
  voorstellingen: Voorstelling[]
  gespeeld: number
  seizoenen: string[]
  bezetting: number | null
  bezettingPerSeizoen: { seizoen: string; bezetting: number }[]
  trend: number | null
  laatste: string | null
  volgende: string | null
  oordeel: Oordeel
  terugVanaf: string | null
  advies: string
  bezoekers: number
}

const OORDEEL_MAANDEN: Record<Oordeel, number> = { Topper: 12, Solide: 18, Twijfel: 24, Risico: 36, Onbekend: 0 }

export function artiestProfielen(alle: Voorstelling[]): ArtiestProfiel[] {
  const peil = vandaag()
  const groepen = new Map<string, Voorstelling[]>()
  for (const v of alle) groepen.set(v.artiest, [...(groepen.get(v.artiest) ?? []), v])
  return [...groepen.entries()].map(([artiest, vs]) => {
    const verleden = vs.filter((v) => actief(v) && isVerleden(v, peil))
    const toekomst = vs.filter((v) => actief(v) && !isVerleden(v, peil))
    const bez = verleden.length ? gem(verleden.map((v) => v.eindstand / v.capaciteit)) : null
    const seizoenen = [...new Set(vs.map((v) => v.seizoen))].sort()
    const bezettingPerSeizoen = [...new Set(verleden.map((v) => v.seizoen))].sort().map((s) => ({
      seizoen: s,
      bezetting: gem(verleden.filter((v) => v.seizoen === s).map((v) => v.eindstand / v.capaciteit)),
    }))
    const trend = bezettingPerSeizoen.length >= 2
      ? bezettingPerSeizoen[bezettingPerSeizoen.length - 1].bezetting - bezettingPerSeizoen[bezettingPerSeizoen.length - 2].bezetting
      : null
    const oordeel: Oordeel = bez === null ? 'Onbekend' : bez >= 0.85 ? 'Topper' : bez >= 0.7 ? 'Solide' : bez >= 0.5 ? 'Twijfel' : 'Risico'
    const laatste = verleden.length ? verleden[verleden.length - 1].datum : null
    let terugVanaf: string | null = null
    if (laatste && oordeel !== 'Onbekend') {
      const d = naarDatum(laatste)
      d.setMonth(d.getMonth() + OORDEEL_MAANDEN[oordeel])
      terugVanaf = isoDatum(d)
    }
    const advies =
      oordeel === 'Topper' ? 'Snel terugboeken, eventueel extra voorstelling'
        : oordeel === 'Solide' ? 'Terugboeken in het ritme van anderhalf jaar'
          : oordeel === 'Twijfel' ? 'Pas na twee seizoenen, overweeg kleinere zaal'
            : oordeel === 'Risico' ? 'Niet terugboeken zonder nieuwe aanpak'
              : 'Nog geen historie bij ons'
    return {
      artiest,
      genre: vs[0].genre,
      impresariaat: vs[vs.length - 1].impresariaat,
      voorstellingen: vs,
      gespeeld: verleden.length,
      seizoenen,
      bezetting: bez,
      bezettingPerSeizoen,
      trend,
      laatste,
      volgende: toekomst.length ? toekomst[0].datum : null,
      oordeel,
      terugVanaf,
      advies,
      bezoekers: verleden.reduce((s, v) => s + v.eindstand, 0),
    }
  })
}

/* ---------- Signaleringen voor de cockpit ---------- */

export interface Signaal {
  soort: 'kans' | 'let op' | 'goed'
  icoon: Icon
  kleur: string
  titel: string
  tekst: string
  link?: string
}

export function maakSignalen(lijst: Voorstelling[], doelen: Doelen, seizoen: string): Signaal[] {
  const uit: Signaal[] = []
  // Bij een afgelopen seizoen valt er niets meer te plannen: dan alleen terugkijken.
  const afgelopen = seizoen < HUIDIG_SEIZOEN
  const afw = doelgroepAfwijkingen(lijst, doelen).sort((a, b) => a.verschil - b.verschil)
  const laagste = afw[0]
  if (laagste && laagste.verschil < -2) {
    uit.push({
      soort: 'kans',
      icoon: laagste.segment.icoon,
      kleur: laagste.segment.kleur,
      titel: `${laagste.segment.naam} ${afgelopen ? 'bleef' : 'blijft'} achter`,
      tekst: `${laagste.aandeel.toFixed(1).replace('.', ',')}% van ons publiek, het doel is ${laagste.doel}%.${afgelopen ? '' : ' Bekijk passend aanbod.'}`,
      link: afgelopen ? '/publiek' : '/aanbod',
    })
  }
  const hoogste = afw[afw.length - 1]
  if (hoogste && hoogste.verschil > 4) {
    uit.push({
      soort: 'let op',
      icoon: hoogste.segment.icoon,
      kleur: hoogste.segment.kleur,
      titel: `Veel publiek uit groep ${hoogste.segment.naam}`,
      tekst: `${hoogste.aandeel.toFixed(1).replace('.', ',')}% van ons publiek, het doel is ${hoogste.doel}%.`,
      link: '/publiek',
    })
  }
  const motAfw = motivatieAfwijkingen(lijst, doelen).sort((a, b) => a.verschil - b.verschil)[0]
  if (motAfw && motAfw.verschil < -2) {
    uit.push({
      soort: 'kans',
      icoon: motAfw.segment.icoon,
      kleur: motAfw.segment.kleur,
      titel: `Motivatie ${motAfw.segment.naam} komt weinig voor`,
      tekst: `${motAfw.aandeel.toFixed(1).replace('.', ',')}% van ons publiek, het doel is ${motAfw.doel}%.`,
      link: '/publiek',
    })
  }
  const vlekken = vindWitteVlekken(lijst, seizoen)
  if (vlekken.length) {
    uit.push({
      soort: 'kans',
      icoon: CalendarDots,
      kleur: '#8b5cf6',
      titel: `${vlekken.length} vrije vrijdag- en zaterdagavonden in de Grote zaal`,
      tekst: `Eerstvolgende: ${vlekken.slice(0, 3).map((v) => datumKort(v.datum)).join(', ')}.`,
      link: '/kalender',
    })
  }
  const conflicten = vindKannibalisatie(lijst).filter((c) => c.ernst === 'hoog')
  if (conflicten.length) {
    uit.push({
      soort: 'let op',
      icoon: Lightning,
      kleur: '#d97706',
      titel: `${conflicten.length} ${conflicten.length > 1 ? 'voorstellingen die' : 'voorstelling die'} op elkaar lijken`,
      tekst: `${conflicten[0].a.titel} en ${conflicten[0].b.titel} liggen ${conflicten[0].dagen} dagen uit elkaar.`,
      link: '/kalender',
    })
  }
  const opties = lijst.filter((v) => v.status === 'Optie' || v.status === 'Concept')
  if (opties.length) {
    uit.push({ soort: 'let op', icoon: ClipboardText, kleur: '#0284c7', titel: `${opties.length} ${opties.length > 1 ? 'opties' : 'optie'} nog niet bevestigd`, tekst: 'Nog te bevestigen of los te laten.', link: '/kalender' })
  }
  if (!uit.some((s) => s.soort === 'let op')) {
    uit.push({ soort: 'goed', icoon: CheckCircle, kleur: '#16a34a', titel: 'Mooie balans', tekst: 'Geen grote afwijkingen ten opzichte van de seizoensdoelen.' })
  }
  return uit
}

export { segmentVan }
