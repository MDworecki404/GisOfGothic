# 0043. Motyw „Krąg” i tryb jasny

Status: przyjęta (zastępuje ADR 0036 w części palety, pisma i kształtu płyt; tokeny układu z ADR 0019 zostają)

## Kontekst

Motyw „latarnia w kopalni” (ADR 0036) został uznany za zbyt „generyczny”: ciemne płyty z pomarańczowym akcentem
wyglądają jak wiele innych aplikacji. Aplikacja nie miała też trybu jasnego. Makiety trzynastu kierunków
(`docs/makiety/kierunki-wygladu.html`, każdy w trybie jasnym i ciemnym) wybrały kierunek **Krąg**: kamienny krąg
w mchu, zaokrąglone tafle, koło narzędzi i zegar jako tarcza 24 h.

## Decyzja

- **Etap 1 (ta decyzja): motyw i tryby.** Układ ekranu (koło narzędzi, tarcza zegara, karta z pieczęcią) to etap 2
  i dostanie osobny ADR; do tego czasu układ z ADR 0019 i 0037 zostaje.
- **Dwa zestawy palety w `src/app.css`.** Tryb ciemny jest domyślny i leży na `:root` („mech nocą”: łupek `#171c17`,
  woda `#0f1c1d`, popiół `#e3e8d6`, żar `#cfd36b` jak świetlik, bariera `#8db4e0`). Tryb jasny leży pod
  `:root[data-theme='light']` („porosty w słońcu”: łupek `#eef0e6`, woda `#a8bdb5`, popiół `#1e2419`, żar `#586b10`
  jak oliwka, bariera `#2e5a86`). Nazwy tokenów i role (żar = działanie i najechanie, bariera = wybór i fokus) zostają,
  więc komponenty nie zmieniają się. Wszystkie kolory zależne od trybu (cienie, poświaty, wypełnienia chipów, tło
  atrybucji, fale pod mapą) są tokenami, a klasy w `@layer components` nie zawierają surowych kolorów (pilnuje test).
- **Pismo:** Uncial Antiqua (nazwy i nagłówki, jedna waga 400, ma polskie litery) oraz Lexend (400, 500, 600) z
  `@fontsource`. Grenze i Barlow Semi Condensed znikają.
- **Płyty:** `.material-leather` i `.parchment-note` to zaokrąglone tafle (promień 1,5 × `--cut`) z cieniem, bez
  `clip-path` i bez rozmywania tła. Przyciski mają kształt pigułki. Utility Tailwind (`rounded-*`, `bg-*`) na płycie
  teraz naprawdę działają, bo tło i krawędź leżą na samym elemencie, a nie w warstwach `::before` i `::after`.
- **Wybór motywu:** trzy wartości, `system` (domyślnie), `light`, `dark`. `ThemeCoordinator` (`services/theme/`)
  zapisuje wybór w `ThemePreferenceStore` (`localStorage`, klucz `gisofgothic:theme:v1`), ustawia
  `data-theme` i klasę `dark` na `<html>` oraz kolor paska przeglądarki, a przy „system” podąża za ustawieniem
  systemu na żywo. Publikuje `theme-changed`; `AppState` trzyma `themePreference` i `theme`. UI woła `selectTheme`
  z `composition-root` (jak `installApp`), bez importu serwisów w komponentach.
- **Bez migania:** mały skrypt w `src/app.html` ustawia `data-theme` przed pierwszym malowaniem, a ekran ładowania
  bierze kolory ze zmiennych zależnych od trybu.
- **Przełącznik:** przycisk w nagłówku (komputer) i pozycja „Motyw” w menu „Więcej” (telefon); kliknięcie przechodzi
  przez system, jasny, ciemny.
- **Mapa:** morze pod modelem (`.map-parchment`) zależy od trybu. `MAP_PALETTE` na razie ma wartości trybu ciemnego
  (akcenty żółtozielony, błękitny i koralowy czytają się też na ciemnym terenie w jasnym trybie); osobna paleta warstw
  na tryb jest do zrobienia w etapie 2. Podgląd 3D przedmiotu w karcie ma ciemne tło w obu trybach.
- **Kontrast pilnuje test** (`theme-tokens.test.ts`) dla obu trybów: popiół na łupku i wodzie co najmniej 7, mgła,
  żar, bariera i krew na łupku co najmniej 4,5, żar i bariera na wodzie co najmniej 3, tekst na żarze 4,5, ramka pól 3.
  Test sprawdza też, że oba tryby definiują te same tokeny.

## Konsekwencje

- Zmiana koloru w którymkolwiek trybie to edycja jednego tokenu; test kontrastu zgłosi regresję czytelności.
- Okno Księgi i panele nie mają już `bg-transparent` ani `bg-black/*` na płytach; takie utility przesłoniłyby tło
  płyty (wykryte przy przeglądzie jasnego trybu).
- Ikony PWA (`static/icons`) mają starą paletę; przemalowanie razem z etapem 2.
- Ciemne tło podglądu 3D i kolory warstw danych (`data-layer-catalog.ts`) są wspólne dla obu trybów.
