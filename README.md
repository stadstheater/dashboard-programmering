# Coulisse

Een eenvoudig programmeringsdashboard voor de programmeur van Stadstheater Zoetermeer. Het is een prototype dat volledig draait op **voorbeelddata**.

## Onderdelen

| Pagina | Wat zie je |
| --- | --- |
| Vandaag | Drie kerncijfers, wat aandacht vraagt, de eerstvolgende voorstellingen en welke publieksgroepen achterblijven |
| Kalender | Maandoverzicht, kleuren op genre, doelgroep of motivatie, vrije vrijdag- en zaterdagavonden, inplannen via het plusje, en doel versus realisatie |
| Aanbod | Aanbod van impresariaten voor dit en volgend seizoen, met "Past goed / redelijk / minder", bewaren en direct als optie inplannen |
| Publiek | De 13 groepen van het Cultureel Doelgroepenmodel (kleuren en afkortingen volgens Rotterdam Festivals) en de bezoekersmotivaties |
| Doelen | Streefaandelen per doelgroep, motivatie en genre, plus bezetting en aantal voorstellingen |

Rechtsboven wissel je tussen een licht en een donker thema, start je de uitleg van een pagina opnieuw en kies je het seizoen. Elke pagina toont bij het eerste bezoek een korte rondleiding.

## Op een telefoon

- Onderaan staat een tabbalk met de vijf onderdelen; bovenin alleen het logo, het thema, de uitleg en een knopje voor het seizoen.
- De kalender toont een klein maandraster met een stip per voorstelling en daaronder de agenda met volledige titels. Tik op een dag om ernaartoe te springen, veeg opzij voor een andere maand. In de lopende maand begint de agenda bij vandaag.
- Details openen als paneel van onderen; veeg het aan de greep omlaag om het te sluiten.
- De app is te installeren op het beginscherm (Safari: Deel, Zet op beginscherm; Chrome: Installeren). Zonder verbinding opent hij met wat eerder is geladen (`public/sw.js`, `public/manifest.webmanifest`).

## Seizoenen

Het lopende seizoen volgt uit de datum van vandaag (een seizoen loopt van augustus tot en met juli). Daarnaast zijn er vier seizoenen historie en het volgende seizoen in opbouw. Opgeslagen data uit een vorig seizoen wordt automatisch vervangen door verse voorbeelddata; de ingestelde doelen blijven bewaard.

## Data

- `src/data/basis-2627.json` is de basis voor het lopende seizoen. Dit bestand is **geanonimiseerd**: titels en artiesten zijn verzonnen, de datums, zalen, genres, doelgroepen en motivaties komen uit de programmeringsexport.
- Een nieuwe export omzetten gaat in twee stappen. Publiceer nooit de tussenstap met echte namen.

  ```bash
  python3 scripts/excel-to-json.py export.xlsx /tmp/basis-echt.json
  node scripts/anonimiseer.mjs /tmp/basis-echt.json src/data/basis-2627.json
  ```

- `src/data/generate.ts` maakt met een vaste seed de historie, het volgende seizoen en het aanbod.
- Wijzigingen (opties, bewaard aanbod, doelen) worden in de browser bewaard. Op de pagina Doelen kun je opnieuw beginnen met voorbeelddata. Bij beschadigde opslag toont de app een herstelscherm.

## Logo

Het beeldmerk is een open C (het toneel) met een spot in het midden: `src/components/Logo.tsx`, `public/logo.svg` en `public/favicon.svg`.

## Starten

```bash
npm install
npm run dev
```

Productiebuild: `npm run build` (statische site in `dist/`, gepubliceerd via Vercel vanaf `main`).
