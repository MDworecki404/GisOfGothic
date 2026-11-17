# 0050. Księga: wiersze wyników w stylu palety

- Status: przyjęta
- Data: 2026-11-17

## Kontekst

Etap 3 wdrożenia makiet „Atlas Gothic” (ADR 0047). Makiety mają wyszukiwarkę jako paletę z ikonami rodzaju
i nawigacją strzałkami. Księga to jednak okno z listą i kartą wpisu obok siebie (podgląd 3D, filtry poziomu
i rozdziału, przewodnik po questach), a wiele testów e2e opiera się na jej układzie.

## Decyzja

- Układ dwóch kolumn zostaje. Zmiany są w `BookSearch`: pole z ikoną lupy, wiersze wyników z okrągłą ikoną
  rodzaju (postać, przedmiot, quest, lokacja) w kolorze znacznika, wyróżnienie wiersza krawędzią w mosiądzu przy
  najechaniu i fokusie.
- **Klawiatura:** strzałka w dół z pola przenosi fokus na pierwszy wiersz, strzałki przesuwają fokus między
  wierszami, strzałka w górę z pierwszego wiersza wraca do pola, `Enter` w polu otwiera pierwszy wynik.
  Wiersze pozostają przyciskami, więc ich nazwy dostępności i testy się nie zmieniają.
- Karta przy mapie (`EntrySummaryCard`) nie używa już kropki w podpisie rodzaju.

## Konsekwencje

- Księga nie jest paletą w sensie makiety (zamykaną po wyborze); wybór wpisu nadal pokazuje jego kartę
  w tym samym oknie. Zmiana tego przepływu wymagałaby przepisania testów Księgi i osobnej decyzji.
