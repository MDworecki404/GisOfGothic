# Atlas Gothic: makiety interfejsu

Interaktywne makiety nowego kierunku wizualnego geoportalu: **atlas z ciemnego kamienia i mosiądzu**.
Makiety są osobną, małą aplikacją (Svelte 5 + Vite, te same biblioteki co produkcja: `@lucide/svelte`,
`@fontsource-variable`). Nie importują niczego z `src/`, nie używają Cesium ani danych z `static/data/`
i nie łączą się z żadnym serwerem, więc nie wpływają na działanie aplikacji.

## Uruchomienie

```bash
npm run mockups
```

Adres: **http://localhost:5180/** (otwiera się samo). Statyczna wersja do wysłania gdziekolwiek:

```bash
npm run mockups:build     # wynik w design-mockups/dist/
npm run mockups:preview   # podgląd zbudowanej wersji, też na porcie 5180
```

Makiet nie da się otworzyć z `file://` (moduły ES wymagają serwera HTTP); wystarczy dowolny serwer
statyczny na katalogu `dist/`.

## Widoki

Spis jest pod `#/index`. Każdy widok ma stały adres (można go wkleić koledze):

| Adres                      | Widok                        | Co pokazuje                                                                                                |
| -------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `#/atlas`                  | Główny widok mapy            | Mapa z liniami współrzędnych, filtry rodzajów, panele warstw, czasu, pomiarów i zakładek, panel szczegółów |
| `#/location/wieza-xardasa` | Karta lokacji                | Ilustracja, opis, fakty, powiązane postacie, przedmioty, potwory i zadania, mini-mapa                      |
| `#/character/lord-hagen`   | Karta postaci                | Tarcza doby z rutyną, gdzie postać jest o wybranej godzinie, zadania i wyposażenie                         |
| `#/quests`                 | Przewodnik po zadaniach      | Filtr rozdziałów, lista, kroki, trasa na mini-mapie, oznaczanie ukończonych                                |
| `#/worlds`                 | Światy i porównanie          | Lista gier i światów, porównanie rozmiarów dwóch światów                                                   |
| `#/system`                 | Katalog komponentów i stanów | Kolory, pismo, przyciski (wszystkie stany), pola z błędem, znaczniki, ładowanie, pusty wynik, błąd         |
| `#/trails`                 | Szlaki tematyczne            | **Propozycja** nowej funkcji, wyraźnie oznaczona; reszta widoków odpowiada istniejącym funkcjom aplikacji  |

## Co można przetestować

- **Mapa:** przeciąganie przesuwa, kółko myszy i szczypanie przybliżają, strzałki, `+`, `-` i `0` działają z klawiatury
  (mapa ma fokus). Linijki na brzegach pokazują odległość w km i przeliczają się razem z widokiem.
  Postacie, przedmioty i potwory pojawiają się dopiero po przybliżeniu, żeby mapa się nie zatłoczyła.
- **Wyszukiwanie:** `Ctrl+K` lub `/` (albo pasek u góry). Szukanie ignoruje polskie litery („zebacz” znajdzie
  „Zębacz”), wyniki są pogrupowane, filtr rodzaju pokazuje liczby, strzałki i `Enter` wybierają, `Esc` zamyka.
  Pusta fraza pokazuje ostatnio oglądane, brak wyników pokazuje podpowiedź.
- **Szczegóły:** kliknięcie znacznika otwiera panel (na komputerze z boku, na tablecie nakładka, na telefonie
  arkusz). Zapis do zakładek, kopiowanie linku, przejście do pełnej karty.
- **Warstwy:** przełączniki rodzajów danych i podkładu mapy. **Czas:** przeciągnij tarczę, mapa ciemnieje po zmroku,
  lista „kto jest w okolicy” zmienia się z godziną. **Pomiary:** klikaj punkty na mapie, panel liczy długość, marsz
  i rysuje profil. **Zakładki:** lista i notatnik.
- **Zadania:** wybór zadania rysuje trasę przerywaną linią na mapie.
- **Responsywność:** zmień szerokość okna. Poniżej 1120 px szczegóły stają się nakładką, poniżej 768 px pojawia się
  dolna nawigacja (5 pozycji, reszta w „Więcej”), a panele są arkuszami z trzema rozmiarami (przeciągnij uchwyt).
- **Dostępność:** widoczny fokus, link „Przejdź do treści”, cele dotyku co najmniej 44 px, `prefers-reduced-motion`.

## Decyzje projektowe

- **Mapa jest bohaterem.** Panele są kartuszami z podwójną linią, wysuwają się na wierzch i znikają;
  na komputerze szczegóły zabierają miejsce mapie, ale nigdy jej nie zasłaniają. Linijki współrzędnych
  na brzegach nadają mapie charakter atlasu i nie są ozdobą: pokazują skalę.
- **Paleta** (wszystkie tokeny w `src/styles/tokens.css`): grafit `#121416`, antracyt, ciemny kamień, mosiądz
  `#c4a15f` jako akcent główny, oliwka `#98a468` jako dodatkowy. Rdza tylko dla błędów i zagrożeń.
- **Pismo:** Cormorant (nagłówki, nazwy na mapie, kursywa dla regionów) i Inter (interfejs). Bez wersalików
  i bez ozdobnych czcionek z gry.
- **Rodzaj odróżnia kształt, nie sam kolor:** lokacje to romby, pozostałe rodzaje to koła z ikoną.
- **Brak** gradientów-ozdób, poświat, tekstur pod tekstem i dużego zaokrąglenia: promienie 3, 8 i 14 px zależą od rangi.

## Ograniczenia

- Mapa to rysunek SVG przykładowej wyspy, nie model 3D; współrzędne i odległości są umowne.
- Dane (nazwy, opisy, rutyny, zadania) to przykłady na podstawie świata Gothica, a nie wpisy z bazy aplikacji.
- Brak trybu jasnego (produkcja ma oba tryby, ADR 0043); makiety pokazują tylko ciemny.
- Przełączanie na inne światy pokazuje komunikat, bo makieta zawiera tylko Khorinis.
- Szlaki tematyczne to propozycja: przycisk „Pokaż szlak na mapie” niczego nie rysuje.

## Struktura

```
design-mockups/
  index.html  vite.config.ts  tsconfig.json
  src/
    main.ts  App.svelte        punkt wejścia i przełącznik widoków
    styles/                    tokens.css (tokeny), base.css (przyciski, pola, chipy, kartusze)
    data/                      typy i przykładowy świat (wyspa, lokacje, postacie, zadania)
    state/                     router po hashu i stan makiet (klasy z runami)
    components/                mapa, panele, wyszukiwarka, nawigacja, arkusz, tarcza doby, ilustracje
    views/                     jeden plik na widok
```
