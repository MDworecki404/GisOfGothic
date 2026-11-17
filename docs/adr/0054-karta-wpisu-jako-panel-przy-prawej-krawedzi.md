# 0054. Karta wpisu jako panel przy prawej krawędzi

- Status: przyjęta
- Data: 2026-11-17

## Kontekst

W makiecie „Atlas Gothic” (ADR 0047) szczegóły wybranego obiektu to panel przy prawej krawędzi z listą powiązań.
`EntrySummaryCard` była małą płytą pod przyciskami mapy i nie pokazywała powiązań.

## Decyzja

- Od szerokości 1024 px `EntrySummaryCard` jest **panelem** (`.detail-panel`) przy prawej krawędzi od paska górnego
  do dołu, szerokim na `--detail-panel-width` (26 rem). Zawiera nagłówek z pieczęcią, fakty w tabeli, akcje i powiązania
  (`appState.relatedEntries`: postacie, przedmioty, questy) jako listy, z których można przejść do kolejnego wpisu.
- Panel ustawia na `:root` `--detail-occupied-width`; wlicza się ją w `--map-controls-width`, a przyciski mapy, odczyt
  i atrybucja odsuwają się o tę szerokość, więc nic nie chowa się pod panelem.
- Poniżej 1024 px zostaje dotychczasowa mała płyta (tablet, telefon).

## Konsekwencje

- Na szerokich ekranach panel zabiera prawy pas mapy; kadrowanie kamery (`MapInsetsReporter`) liczy tylko lewy i
  dolny brzeg, więc wybrane miejsce może wylądować pod panelem. Do rozważenia, jeśli będzie przeszkadzać.
