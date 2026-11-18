# 0056. Service worker nie zapisuje HTML-a podanego zamiast pliku

- Status: przyjęta (uzupełnia ADR 0011)
- Data: 2026-11-18

## Kontekst

Po wydaniu 1.4.0 przeglądarka zgłaszała „Failed to load module script … MIME type of text/html” dla plików z
`/_app/immutable/`. Pliki na serwerze były poprawne, więc przyczyną był zapis w pamięci service workera: hosting z
zapasową stroną SPA odpowiada na brakujący plik kodem 200 i `index.html`, a `respondFromCacheFirst` zapisywał każdą
odpowiedź `ok`. Plik zapytany w chwili wdrożenia, zanim dotarł na serwer, zostawał w pamięci jako HTML i psuł aplikację
do czasu następnej wersji.

## Decyzja

- `CachingPolicy.canStore` odrzuca odpowiedzi nie-`ok` oraz odpowiedzi `text/html` dla żądań innych niż nawigacja.
  Service worker używa go przy każdym zapisie (pamięć „najpierw pamięć”, „odświeżenie w tle”) i przy odczycie z
  pamięci: zapisany wcześniej HTML w miejscu pliku jest ignorowany i pobierany ponownie.
- Zapis powłoki przy instalacji sprawdza każdą odpowiedź zamiast `cache.addAll`; HTML w miejscu pliku przerywa instalację,
  więc poprzednia wersja pozostaje aktywna.

## Konsekwencje

- Użytkownik z zepsutą pamięcią (wersja 1.4.0) naprawia się po wydaniu poprawki: przeglądarka sprawdza service worker
  przy nawigacji, nowa wersja usuwa stare pamięci przy aktywacji. Do tego czasu pomaga „Wyczyść dane witryny”
  albo wyrejestrowanie service workera w narzędziach przeglądarki.
