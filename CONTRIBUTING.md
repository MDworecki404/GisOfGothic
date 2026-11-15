# Współpraca przy projekcie

Dziękuję za zainteresowanie! GIS of Gothic to projekt fanowski i niekomercyjny. Każdy wkład — zgłoszenie błędu,
pomysł, poprawka — jest mile widziany.

## Zanim zaczniesz

- **Nie dodawaj zasobów z gry** (modeli, tekstur, dźwięków, grafik, logo, czcionek, plików `static/data/`).
  Repozytorium ich nie zawiera i nie może zawierać; aplikacja nie udostępnia ich do pobrania
  ([ADR 0012](docs/adr/0012-ochrona-modeli-przedmiotow.md)).
- Większą zmianę najpierw opisz w zgłoszeniu (issue). Decyzje architektoniczne zapisujemy w [docs/adr/](docs/adr/).
- Wizja i założenia: [docs/wizja.md](docs/wizja.md). Architektura: [docs/architektura.md](docs/architektura.md).

## Środowisko

Wymagania, skrypty i konwencje opisuje [docs/rozwoj.md](docs/rozwoj.md). Dane świata przygotowuje osobny projekt
ekstrakcji z własnej kopii gry ([docs/dane.md](docs/dane.md)); bez nich działają testy jednostkowe, `check`, `lint`
i `build`, a pełne testy `npm run test:e2e` wymagają lokalnych danych.

Przed wysłaniem zmian uruchom:

```bash
npm run check
npm run lint
npm run test
npm run build
```

## Styl

- Kod w klasach, UI bez logiki domenowej, pełne typowanie (bez `any`, `!` i asercji `as`), nazwy opisujące działanie.
- Interfejs i dokumentacja po polsku.
- Zmiana architektury, zdarzeń, danych albo skryptów aktualizuje odpowiedni dokument w `docs/` w tym samym commicie.

## Commity

Format [Conventional Commits](https://www.conventionalcommits.org/) z nagłówkiem po polsku, np.
`feat: filtr lokacji po rodzaju`. Hook `commit-msg` (commitlint) pilnuje formatu. Jeden commit to jedna logiczna zmiana.

## Licencja

Wkład trafia na licencji [MIT](LICENSE) jak reszta kodu. Licencja nie obejmuje zasobów z gry.
