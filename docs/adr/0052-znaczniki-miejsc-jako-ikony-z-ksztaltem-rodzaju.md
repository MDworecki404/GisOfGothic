# 0052. Znaczniki miejsc jako ikony z kształtem rodzaju

- Status: przyjęta
- Data: 2026-11-17

## Kontekst

Makiety „Atlas Gothic” (ADR 0047) odróżniają rodzaje wpisów kształtem, a nie samym kolorem: lokacje to romby,
pozostałe rodzaje koła. Znaczniki miejsc na mapie (`PlaceMarkersLayer`) były okrągłymi punktami Cesium
(`PointPrimitive`), więc kształt nie mógł się zmieniać.

## Decyzja

- `PlaceMarkersLayer` używa `BillboardCollection`. Ikona (romb albo koło, wypełnienie w kolorze miejsca,
  ciemny obrys) jest rysowana na canvasie raz na kombinację kształtu, koloru i wyróżnienia i podawana Cesium jako
  adres danych. Nadal to jedna kolekcja, widoczna przez dachy (`disableDepthTestDistance`).
- Wyróżniony znacznik dostaje jasny obrys i skalę 1,5 zamiast większego piksela.
- `PlaceMarker.shape` (`circle` domyślnie, `diamond`) ustawia `SearchCoordinator`: romb, gdy wybrany wpis to lokacja.
  Trasy przewodnika po questach zostają kołami.

## Konsekwencje

- Rodzaj wpisu da się rozpoznać bez koloru (kontrast i daltonizm).
- Ikony są małymi PNG w pamięci; liczba kombinacji jest ograniczona paletą miejsc.
- Znaczniki warstw danych (przedmioty, postacie na mapie) mają własny renderer i nie zmieniły się.
