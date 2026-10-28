# 0024. Ekran ładowania: statyczny przed JavaScriptem i komponent po starcie

Status: przyjęta

## Kontekst

Aplikacja jest SPA (`ssr = false`). Do wczytania skryptów i stylów użytkownik widział biały lub pusty ekran,
a potem rozbudowany interfejs na mapie bez modelu świata, który wczytywał się jeszcze kilka sekund
(w Myrtanie dłużej).

## Decyzja

- `src/app.html` zawiera statyczny ekran `#app-splash` z własnymi, wbudowanymi stylami (kolory z motywu bez
  zmiennych CSS, bo plik stylów jeszcze się nie wczytał). Działa od pierwszej klatki, także z zapisanej powłoki PWA.
- Główny layout usuwa `#app-splash` po starcie na każdej stronie (także na stronie błędu 404), a `LaunchScreen.svelte` pokazuje kroki wczytywania (model świata,
  przedmioty i postacie) oraz nazwę otwieranego świata.
- Ekran znika, gdy oba wczytania się udały, albo od razu po błędzie, żeby było widać kartę błędu.
  `AppState.isLaunchFinished` jest zatrzaskiem: przełączanie światów nie pokazuje ekranu ponownie.
- Zgaszenie to przejście `opacity` (0,4 s); przy `prefers-reduced-motion` bez animacji.

## Konsekwencje

- Testy e2e sprawdzają trwanie i zniknięcie ekranu (`data-testid="launch-screen"`) oraz ustąpienie karcie błędu.
- Statyczny ekran nie używa czcionek motywu (Georgia), bo jeszcze się nie wczytały.
