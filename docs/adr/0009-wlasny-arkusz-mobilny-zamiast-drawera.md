# 0009. Własny arkusz mobilny zamiast drawera z shadcn

Status: przyjęta

## Kontekst

Panel narzędzia na telefonie ma być arkuszem od dołu z uchwytem i trzema stanami: zwinięty (tylko
uchwyt), połowa ekranu, pełny. Komponent `drawer` z shadcn (vaul-svelte) jest modalny: rysuje
nakładkę, skaluje tło, blokuje dotyk mapy i daje się zamknąć przeciągnięciem w dół. Narzędzia
Pomiary i Analizy wymagają klikania w mapę przy otwartym arkuszu, a zwinięcie nie jest zamknięciem
(narzędzie zostaje aktywne).

## Decyzja

- Arkusz to ten sam element `section` co panel na komputerze (`ToolPanel`), z wysokością z zmiennej CSS
  `--sheet-height` tylko poniżej `md`. Mapa pozostaje interaktywna.
- Uchwyt ma rolę `slider`: przeciąganie wskaźnikiem (myszą i palcem), klawisze strzałek, `Home`/`End`,
  `Enter`/spacja przełączają stany cyklicznie, a dotknięcie bez ruchu robi to samo. `Esc` zamyka panel.
- Rachunek wysokości i wybór stanu po puszczeniu (z rzutem prędkości palca) to czysta klasa
  `SheetHeightResolver` (`state/sheet-detents.ts`) z testami.
- Stan arkusza (`MobileSheetState`, `state/mobile-sheet-state.svelte.ts`) to stan interfejsu: logika
  aplikacji go nie zna. Wybranie narzędzia otwiera arkusz do połowy.
- `MapInsetsReporter` mierzy rzeczywistą wysokość arkusza, więc zgłasza zasłonięty dół zgodnie ze stanem:
  po zmianie stanu, po końcu animacji wysokości i nie w trakcie przeciągania. Zwinięty arkusz zasłania
  tylko uchwyt, a jego treść jest `inert`.
- Komponent `drawer` zostaje w `components/ui/` bez użycia.

## Konsekwencje

- Zmiana wysokości stanów (`half`, `full`) to stałe w `ToolPanel` (połowa okna; pełny = okno bez dolnej
  nawigacji i paska górnego).
- Kadrowanie kamery ([ADR 0008](0008-kadrowanie-kamery-z-marginesem-na-panele.md)) działa w każdym
  stanie arkusza bez zmian w logice.
