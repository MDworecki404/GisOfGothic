# GIS of Gothic

Trójwymiarowa wikipedia świata Gothic. Wyszukujesz przedmiot albo unikatową postać i widzisz
na modelu 3D świata gry, gdzie leży, kto go ma i gdzie ktoś przebywa o danej porze.

Na start: Gothic 2: Noc Kruka — Khorinis, Górnicza Dolina i Jarkendar. Docelowo Gothic 1, kolejne światy i questy —
zobacz [wizję projektu](docs/wizja.md).

> Projekt w budowie. Działa: mapa 3D świata, wyszukiwarka przedmiotów i postaci z podglądem 3D,
> warstwy z identyfikacją obiektów, pomiary, analizy GIS, pora dnia z rutynami postaci, zakładki
> oraz instalacja jako aplikacja (PWA) z pracą bez sieci.

**Wersja na żywo: https://gisofgothic.dworecki.dev**

## Szybki start

```bash
npm install
cp .env.example .env    # wpisz PUBLIC_MODEL_KEY (patrz docs/rozwoj.md)
npm run dev             # http://localhost:5173 → /g2nk/khorinis
```

Potrzebne są też dane świata z projektu ekstrakcji — patrz [docs/dane.md](docs/dane.md).

## Stack

SvelteKit (Svelte 5, runy) + TypeScript jako statyczna strona (`adapter-static`), Tailwind CSS 4,
shadcn-svelte (Bits UI), CesiumJS z modelem świata na Cesium ion, MiniSearch, Vitest, Playwright.
UI po polsku.

## Dokumentacja

| Dokument                                     | Treść                                                    |
| -------------------------------------------- | -------------------------------------------------------- |
| [docs/wizja.md](docs/wizja.md)               | koncepcja i założenia produktu                           |
| [docs/architektura.md](docs/architektura.md) | warstwy, fasada, event bus, przepływ danych              |
| [docs/dane.md](docs/dane.md)                 | dane świata, układ współrzędnych, jak dodać nowy świat   |
| [docs/rozwoj.md](docs/rozwoj.md)             | środowisko, skrypty, testy, konwencje, commity i wydania |
| [docs/adr/](docs/adr/)                       | zapisy decyzji architektonicznych                        |
| [CHANGELOG.md](CHANGELOG.md)                 | historia wersji (po pierwszym wydaniu)                   |

## Licencja i prawa

Kod i dokumentacja: [MIT](LICENSE). Licencja **nie obejmuje zasobów z gry**.

Gothic jest znakiem towarowym THQ Nordic; świat gry, modele 3D, tekstury i dane należą do ich
właścicieli (Piranha Bytes, THQ Nordic). Repozytorium nie zawiera zasobów z gry, a aplikacja nie
udostępnia ich do pobrania. Projekt fanowski, niekomercyjny, niepowiązany z THQ Nordic ani Piranha
Bytes, bez logo i grafik z gry.
