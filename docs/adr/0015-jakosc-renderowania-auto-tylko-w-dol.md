# 0015. Jakość renderowania: automatyka tylko w dół

Status: przyjęta

## Kontekst

Renderowanie modeli 3D świata jest ciężkie, a aplikacja ma działać także na telefonach i starszych
laptopach. Chcieliśmy ustawień wydajności, a domyślnie żeby aplikacja sama dostosowywała jakość do FPS.

## Decyzja

- Trzy poziomy jakości (niska, średnia, wysoka) jako profile: rozdzielczość, MSAA/FXAA, szczegółowość
  kafli (`maximumScreenSpaceError`) i limit cieni. Do wyboru także `auto` (domyślnie).
- Tryb `auto` mierzy FPS (okna 4 s, `scene.postRender`) i obniża jakość o jeden poziom po dwóch
  kolejnych oknach poniżej 24 FPS. **Nie podnosi jej z powrotem**: po poprawie jakości FPS znów by spadły
  i ustawienia migałyby. Wyższą jakość przywraca wybór użytkownika.
- Wybór stałego poziomu jest zawsze respektowany i zapisywany w `localStorage`.
- Pomiar pomija przerwy dłuższe niż sekunda (karta w tle) i okno tuż po zmianie profilu.

## Konsekwencje

- Chwilowe zacięcia przy ładowaniu kafli mogą obniżyć jakość; dwa okna z rzędu i próg 24 FPS ograniczają to ryzyko.
- Na bardzo słabym urządzeniu pierwsze kilkanaście sekund działa na wysokiej jakości, zanim automatyka zareaguje.
- Niska jakość wyłącza cienie, niezależnie od ustawienia w panelu Czas.
