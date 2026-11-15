# 0037. Księga i karta wpisu zamiast panelu wyszukiwania

Status: przyjęta. Rozszerza [ADR 0036](0036-motyw-latarnia-w-kopalni.md) (układ).

## Kontekst

Wyszukiwanie i karta wpisu żyły w wąskim panelu bocznym, który zasłaniał mapę i zmuszał do przełączania
listy i karty. Nowy interfejs ma mapę jako bohatera.

## Decyzja

- Wyszukiwanie to **Księga**: okno modalne (`Dialog`) z listą i filtrami po lewej i kartą wpisu po prawej;
  na telefonie lista i karta zastępują się nawzajem. Księga jest narzędziem `search` z `presentation: 'book'`.
- „Pokaż na mapie” zamyka Księgę, wybór wpisu zostaje, a `EntrySummaryCard` pokazuje zwartą kartę przy mapie.
  Zamknięcie narzędzia nie czyści wyboru; czyści go dopiero zamknięcie karty.
- Domyślnie żadne narzędzie nie jest otwarte (`DEFAULT_TOOL_ID = null`); `narzedzie=search` otwiera Księgę,
  a stary `narzedzie=zamkniete` jest nadal rozpoznawany.
- Pole w nagłówku to przycisk otwierający Księgę (Ctrl/Cmd K).

## Konsekwencje

- `SearchPanel` został usunięty; logika dalej w `SearchCoordinator` i fasadzie, UI tylko renderuje.
- Odłożone: „Teraz” i doba postaci na karcie (etap 4, zegar doby).
