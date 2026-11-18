# 0057. Instalacja service workera nie utyka na złym pliku

- Status: przyjęta (poprawia ADR 0056)
- Data: 2026-11-18

## Kontekst

Wydanie 1.4.1 (ADR 0056) nie naprawiło użytkownika, który miał już zepsutą pamięć z 1.4.0. Instalacja nowego
workera przerywała się, gdy jakikolwiek plik powłoki był HTML-em, a `fetch` mógł dostać ten HTML z pamięci HTTP
przeglądarki (hosting nadaje plikom `max-age=14400`). Stary worker z zepsutą pamięcią zostawał więc aktywny.

## Decyzja

- `fetchStorable` pobiera plik, a gdy odpowiedź nie nadaje się do zapisu (`CachingPolicy.canStore`), ponawia pobranie
  z `cache: 'reload'`, czyli z pominięciem pamięci HTTP. Jeśli i wtedy odpowiedź jest zła, plik jest pomijany.
- Instalacja powłoki **nie przerywa się** na pojedynczym złym pliku: nowy worker się aktywuje, usuwa stare pamięci,
  a brakujący plik pobierze z sieci przy pierwszym użyciu. Zastępuje to przerwanie instalacji z ADR 0056.
- Ścieżka „najpierw pamięć” używa tej samej funkcji przy braku poprawnego wpisu w pamięci.

## Konsekwencje

- Zepsuta pamięć naprawia się przy najbliższym wejściu po wydaniu, bez ręcznego czyszczenia danych witryny; użytkownik,
  który jest w stanie zepsutym już teraz, może przyspieszyć to „Wyczyść dane witryny”.
- Powłoka w pamięci może być niekompletna po złym wdrożeniu; offline brakujące pliki nie zadziałają do kolejnej wersji.
