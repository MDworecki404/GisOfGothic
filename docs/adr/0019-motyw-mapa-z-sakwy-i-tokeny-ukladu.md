# 0019. Motyw „Mapa z sakwy kopacza” i tokeny układu w jednym miejscu

Status: przyjęta

## Kontekst

Pierwszy motyw („kamień, żelazo, pergamin”) miał kilka problemów:

- Cinzel to krój z samymi wersalikami. Małe nagłówki („ŚWIAT”, „DANE”) były słabo czytelne,
  a klimat bardziej rzymski niż surowy.
- Złoto oznaczało naraz główną akcję, focus, zaznaczenie i najechanie.
- Tekst błędu miał kontrast 3,2:1, a ramki pól 1,6:1, czyli poniżej WCAG AA.
- Położenia elementów były wpisane na sztywno, np. `bottom-[calc(3.75rem+52dvh+8px)]`, w kilku plikach.
  Nie znały rzeczywistej wysokości arkusza ani szerokości panelu.
- Na telefonie mapy prawie nie było widać. Arkusz otwierał się do połowy, joysticki były domyślnie
  włączone, a pole wyszukiwania miało około 100 px.

## Decyzja

- **Jedno źródło tokenów: `src/app.css`.**
  - Paleta materiałów: smoła, dębina, skóra, kuta stal, pergamin, atrament, ochra, pochodnia,
    magiczna ruda, krew.
  - Role: zmienne shadcn oraz `--hover` (pochodnia), `--active` (ruda) i `--ring` (ruda).
  - Skala pisma `text-caption` … `text-hero`, cienie, promienie i układ ekranu.
  - Komponenty używają ról i układu, nie surowych kolorów.
- **Pismo:**
  - Grenze Gotisch (OFL, z polskimi znakami) tylko w `h1`/`h2` i tytule aplikacji.
  - Etykiety i dane w Alegreya Sans, opisy na pergaminie w Alegreya.
  - Najmniejszy tekst ma 13 px.
- **Materiały jako klasy:** `material-leather` (+ `material-leather-riveted`), `material-iron`,
  `material-parchment`. Tekstury są w CSS, bez obrazków.
- **Układ:**
  - Tokeny `--top-bar-height`, `--bottom-nav-height`, `--rail-width`, `--status-bar-height`,
    `--panel-width`, `--map-controls-width` zależą od szerokości ekranu.
  - `ToolPanel` w biegu ustawia na `:root` `--sheet-occupied-height` (telefon) i
    `--panel-occupied-width` (większe ekrany). Pasek stanu, joysticki i plakietka ładowania liczą
    z nich swoje położenie.
- **Telefon:**
  - Po otwarciu świata arkusz jest zwinięty i pokazuje tylko nagłówek, także gdy adres przywraca
    narzędzie. `MobileSheetState` pomija pierwsze `tool-selected` po `world-opened`.
  - Kolejne wybory narzędzia i kliknięcie pola wyszukiwania otwierają arkusz do połowy.
  - Joysticki są domyślnie wyłączone.
  - Wydajność, „O projekcie” i instalacja są w menu „Więcej” (`MoreMenu`).
  - Karta obiektu jest przypięta do dołu nad nawigacją.
- Elementy dotykowe mają co najmniej 44×44 px.

## Konsekwencje

- Zmiana koloru albo wymiaru to edycja jednego tokenu. Przy zmianie wysokości paska albo nawigacji
  trzeba też poprawić stałe pikselowe w `ToolPanel`, które liczą stany arkusza.
- Logika aplikacji się nie zmienia. Domyślne narzędzie (`search`) dalej ustawia fasada.
  Arkusz to stan interfejsu.
- Uzupełnia [ADR 0009](0009-wlasny-arkusz-mobilny-zamiast-drawera.md): stan startowy arkusza to teraz
  „zwinięty” z widocznym nagłówkiem (100 px), a nie „połowa”.
