# 0016. Nowe funkcje podnoszą wersję minor także przed 1.0.0

Status: przyjęta

## Kontekst

`commit-and-tag-version` poniżej 1.0.0 włącza tryb `preMajor`: `feat` podbija tylko patch
(0.2.1 → 0.2.2), a zmiana łamiąca tylko minor. Tego trybu nie da się wyłączyć konfiguracją
(narzędzie nadpisuje opcję dla wersji `0.x`), więc wydania z nowymi funkcjami dostawały
numer jak poprawki.

## Decyzja

- `npm run release` uruchamia `scripts/release.mjs`, który przed 1.0.0 sprawdza commity od ostatniego
  tagu. Jeśli jest wśród nich `feat`, wywołuje narzędzie z `--release-as minor` (0.2.x → 0.3.0).
- Bez `feat` (same `fix`, `docs` itd.) zostaje domyślne podbicie patch.
- Własny `--release-as` podany w wywołaniu ma pierwszeństwo; pozostałe argumenty (`--dry-run`)
  są przekazywane dalej.

## Konsekwencje

- Numer wersji odzwierciedla nowe funkcje; `CHANGELOG.md` i tagi pozostają spójne.
- Po 1.0.0 skrypt nie ingeruje i obowiązuje standardowe wersjonowanie semantyczne.
