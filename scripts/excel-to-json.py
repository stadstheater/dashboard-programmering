"""Zet een programmeringsexport (xlsx) om naar de JSON-basis voor het huidige seizoen.

Gebruik: python3 scripts/excel-to-json.py <bestand.xlsx> src/data/basis-2627.json
"""
import json
import sys

import openpyxl

KOLOMMEN = {
    "Theaterseizoen": "seizoen",
    "Status": "status",
    "Datum": "datum",
    "Titel": "titel",
    "Genre": "genre",
    "Leeftijdsadvies": "leeftijd",
    "Locatie": "zaal",
    "Verwacht aantal bezoekers": "verwacht",
    "ID": "id",
}
MOTIVATIES = ["Bezoekersmotivatie", "Bezoekersmotivatie 2"]
DOELGROEPEN = [
    "Toegewezen doelgroep (Cultureel Doelgroepenmodel)",
    "Toegewezen doelgroep 2",
    "Toegewezen doelgroep 3",
    "Toegewezen doelgroep 4",
]


def schoon(waarde):
    return waarde.strip() if isinstance(waarde, str) else waarde


def main(bron, doel):
    ws = openpyxl.load_workbook(bron, data_only=True).worksheets[0]
    rijen = list(ws.iter_rows(values_only=True))
    kop = [schoon(k) for k in rijen[0]]
    uit = []
    for rij in rijen[1:]:
        r = dict(zip(kop, (schoon(v) for v in rij)))
        if not r.get("Titel") or not r.get("Datum"):
            continue
        item = {k: r.get(v) for v, k in KOLOMMEN.items()}
        item["datum"] = r["Datum"].strftime("%Y-%m-%d")
        item["motivaties"] = [r[m] for m in MOTIVATIES if r.get(m)]
        item["doelgroepen"] = [r[d] for d in DOELGROEPEN if r.get(d)]
        uit.append(item)
    with open(doel, "w", encoding="utf-8") as f:
        json.dump(uit, f, ensure_ascii=False, indent=0)
    print(f"{len(uit)} voorstellingen geschreven naar {doel}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
