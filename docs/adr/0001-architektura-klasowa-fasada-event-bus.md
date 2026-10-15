# 0001. Architektura klasowa z fasadą i event busem

- Status: przyjęta
- Data: 2026-10-15

## Kontekst

Aplikacja będzie rosła o kolejne gry, światy i rodzaje danych (przedmioty, postacie, questy).
Logika rozsiana po komponentach Svelte szybko staje się nieczytelna i trudna do testowania,
a komponenty importujące Cesium wiążą UI z silnikiem mapy.

## Decyzja

- Logika biznesowa żyje w klasach (serwisy, fasada, budowniczowie) w `src/lib/services/` i `src/lib/data/`.
- UI rozmawia z logiką wyłącznie przez `GeoportalFacade` (polecenia) i `EventBus` (wyniki).
  Wyniki trafiają do `AppState` — reaktywnego stanu, który UI tylko czyta.
- Obiekty powstają w jednym miejscu: `src/lib/composition-root.ts`; zależności przekazujemy konstruktorem.
- Granice warstw pilnuje ESLint (`no-restricted-imports` w komponentach i stronach).

## Konsekwencje

- Logikę testujemy w Vitest bez przeglądarki, wstrzykując zależności.
- Zmiana silnika mapy albo wyszukiwania nie dotyka komponentów.
- Więcej plików i jedno pośrednie ogniwo (zdarzenie) przy każdym wyniku — świadomy koszt czytelnych granic.
