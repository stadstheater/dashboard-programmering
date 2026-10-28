# Coulisse · Programmeringsdashboard

Prototype van een programmeringsdashboard voor de programmeur van Stadstheater Zoetermeer. Alles draait op **dummy data**: vier historische seizoenen (22/23 t/m 25/26), het lopende seizoen 26/27 (gebaseerd op de programmeringsexport) en seizoen 27/28 in opbouw, plus ruim 160 producties van fictieve impresariaten.

## Onderdelen

| Pagina | Wat zie je |
| --- | --- |
| Cockpit | KPI's, voorverkoop van komende voorstellingen, automatische signaleringen, balans in doelgroepen, motivaties en genres |
| Kalender | Maand-, week-, seizoens- en lijstweergave met filters; witte vlekken met suggesties uit het aanbod |
| Aanbod | Aanbod van impresariaten met matchscore, filters, shortlist en direct inplannen |
| Seizoensbouwer | Zandbak voor 27/28: sleep aanbod naar een datum en zie de impact; kannibalisatie-alarm; bevestigen als optie |
| Doelgroepen | De negen segmenten van het Cultureel Doelgroepenmodel: aandeel versus doel, trend, index t.o.v. verzorgingsgebied, matrices |
| Motivaties | Dezelfde analyse voor bezoekersmotivaties, plus motivatie × doelgroep |
| Historie & profiel | Seizoenen naast elkaar, genremix door de jaren, theater-DNA, inschattingskwaliteit, beste speeldagen |
| Artiestengeheugen | Historie per artiest met oordeel en terugboekadvies, scorekaart per impresariaat |
| Databuilder | Voorstellingen en aanbod toevoegen/bewerken, doelen instellen, dataset opnieuw genereren, Excel/JSON import en export |

### Drie extra ideeën
1. **Matchscore en witte vlekken**: elk aanbod krijgt een score (doelgroepgat, motivatiegat, historisch succes, vrije data, financiën) en de kalender toont vrije weekendavonden met de best passende suggesties.
2. **Seizoensbouwer met kannibalisatie-alarm**: wat-als-scenario's met directe impact op balans, bezoekers en saldo.
3. **Artiestengeheugen met terugboekritme**: wanneer is het weer tijd voor een artiest, en welke impresariaten leveren goed aanbod.

## Starten

```bash
npm install
npm run dev
```

Productiebuild: `npm run build` (statische site in `dist/`, klaar voor Vercel).

## Data

- `src/data/basis-2627.json` is gemaakt met `scripts/excel-to-json.py` uit de programmeringsexport.
- `src/data/generate.ts` genereert de rest met een vaste seed; dezelfde seed geeft altijd dezelfde dataset.
- Wijzigingen uit de Databuilder worden bewaard in de browser (localStorage). Via de Databuilder kun je een Excel in het formaat van de programmeringsexport inlezen.
