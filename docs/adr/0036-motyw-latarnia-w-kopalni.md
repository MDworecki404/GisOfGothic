# 0036. Motyw „latarnia w kopalni”

Status: przyjęta (zastępuje ADR 0019 w części motywu i pisma; tokeny układu z ADR 0019 zostają)

## Kontekst

Motyw „Mapa z sakwy kopacza” (brązowa skóra, nity, pergamin) wyglądał jak panel administracyjny w stylizowanym
kostiumie i został uznany za „drętwy”. Makiety nowego interfejsu (artefakt prywatny właściciela) pokazują ciemny łupek
oświetlony pochodnią i chłodną barierą, z mapą na cały ekran. Etap 1 wdrożenia wymienia sam motyw bez zmian w układzie.

## Decyzja

- **Paleta w `src/app.css`:** łupek `#1e282b` (płyty), łupek wysoki `#27353a` (przyciski, pola), woda `#121b1e` (tło mapy),
  krawędź `#0c1214`, linia `#3a494f`, popiół `#e1dac8` (tekst), mgła `#9aa6a3` (tekst pomocniczy), żar `#f2a24a`
  (działanie, najechanie, godzina), bariera `#a3b4ff` (wybór, aktywne narzędzie, fokus), krew `#ee7d68` (błędy).
- **Role bez zmian:** zmienne shadcn i `--hover`, `--active` wskazują nowe tokeny. Stare nazwy (`--pitch`, `--oak`,
  `--ochre`, `--torch`, `--ore`, `--bone`, `--parchment`…) zostają jako aliasy, żeby komponenty działały bez zmian znaczników;
  usuniemy je w etapie 5.
- **Płyta zamiast skóry:** `.material-leather` to płyta ze ściętym rogiem (14 px, `clip-path`), krawędź w gradiencie
  oświetlonym od lewej-góry, wnętrze w `::before`. Płyty są nieprzezroczyste, bez `backdrop-filter` (kosztowny nad płótnem
  WebGL); `clip-path` ucina cień zewnętrzny, więc go nie ma. Przyciski ze ściętym rogiem mają obrys fokusu wewnątrz kształtu
  (`outline-offset: -3px`), bo `clip-path` ucinałby go na zewnątrz.
- **Pismo:** Grenze (500, 600, 700) do nazw i godziny oraz Barlow Semi Condensed (400, 500, 600) do interfejsu, oba z
  `@fontsource` (samodzielnie hostowane, więc działają offline w PWA). Grenze Gotisch, Alegreya i Alegreya Sans znikają.
- **Dawny pergamin:** `.material-parchment` i `.parchment-note` (karta obiektu) to płyty; tło pod mapą (`.map-parchment`) to
  woda z delikatnymi falami, a winietowanie brzegów (`.map-parchment-frame`) jest chłodne.
- **Kolory warstw mapy** są w `MAP_PALETTE` (`services/map/map-palette.ts`), a test pilnuje zgodności z tokenami.
- **Kontrast pilnuje test:** `ColorContrastCalculator` i `theme-tokens.test.ts` liczą kontrast par kolorów z wartości w
  `app.css` (tekst na łupku i wodzie, tekst na żarze, ramka pól).

## Konsekwencje

- Zmiana koloru to edycja jednego tokenu; test kontrastu zgłosi regresję czytelności.
- Aliasy starych nazw są długiem do spłacenia w etapie 5; do tego czasu kod ma dwie nazwy dla tych samych kolorów.
- Ikony PWA (`static/icons`) mają jeszcze starą paletę; przemalowanie w etapie 5.
- Układ ekranu (pływające płyty, dok narzędzi) zmienia etap 2; ADR 0036 uzupełnimy wtedy sekcją o układzie.
