# 0049. Układ „Atlas”: pasek górny i szyna narzędzi

- Status: przyjęta (zastępuje koło narzędzi z ADR 0044 i trzy płyty nagłówka; tarcza zegara i pieczęć wpisu zostają)
- Data: 2026-11-17

## Kontekst

Etap 2 wdrożenia makiet „Atlas Gothic” (ADR 0047, 0048). Koło narzędzi wymagało dwóch kliknięć na narzędzie,
a trzy pływające płyty nagłówka zabierały mapie górny pas. Makiety pokazały jedną belkę i pionową szynę
z podpisami.

## Decyzja

- **Pasek górny** (`TopBar`, klasa `.top-bar`): jedna płaska belka na całą szerokość, wysokość `--top-bar-height`
  (3,5 rem), mosiężna linia pod spodem. Zawiera te same trzy części co dawne płyty i zachowuje ich
  `data-testid` (`header-title`, `header-search`, `header-actions`).
- **Szyna narzędzi** (`ToolRail`, klasa `.tool-rail`): na komputerze pionowa belka o szerokości `--rail-width`
  (4,5 rem) pod paskiem, osiem narzędzi z ikoną i podpisem, grupy rozdzielone kreską, aktywne narzędzie
  oznaczone mosiężnym znacznikiem. Wybór narzędzia to jedno kliknięcie. `ToolWheel` i klasy `.tool-wheel-*`
  usunięto. Szyna jest `data-map-obstacle`, więc kadrowanie mapy omija ją tak jak wcześniej piasta.
- Telefon bez zmian: dolna nawigacja i menu „Inne”.
- Testy e2e wybierają narzędzie przez `selectTool`, który teraz klika przycisk szyny.

## Konsekwencje

- Panele narzędzi, legenda i joysticki liczą położenie z `--rail-width`, więc zmiana szerokości szyny nie wymaga
  poprawek w komponentach.
- Zakładki, filtry rodzajów na pasku i linijki współrzędnych z makiet to osobne etapy.
