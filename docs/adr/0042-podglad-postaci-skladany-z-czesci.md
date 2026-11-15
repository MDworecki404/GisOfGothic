# 0042. Podgląd 3D postaci składany z części

Status: przyjęta.

## Kontekst

Karta wpisu pokazuje podgląd 3D przedmiotu (`ModelPreview`, zaszyfrowany plik z bramki, odszyfrowany w pamięci;
ADR 0012). Chcemy to samo dla unikatowych postaci i potworów. Ekstraktor zmierzył (2026-11-15), że postacie składają
się z niewielu wspólnych części (ciało, głowa, pancerz, broń); wszystkie światy w wariancie „części” to około 250 MB, a
bucket R2 ma 5,5 z 10 GB. Gotowy model na każdą postać byłby kilkakrotnie większy.

## Decyzja

- **Dane.** `characters.geojson` i wpisy `type: "character"` w `search_index.json` mają pole `model`:
  `null` albo obiekt `{ body, head, armor, weapon }` (ścieżki względem `models/`, każde pole może być `null`;
  `weapon` wskazuje zwykły podgląd przedmiotu z `previews/`). Parser (`data/`) zwraca typ `CharacterModelParts`.
- **Części mają wspólny układ.** Każdy plik z `models/characters/` jest w metrach, stopy na `y = 0`, wyśrodkowany
  w poziomie, a głowa i broń leżą już we współrzędnych ciała. Dlatego aplikacja nie liczy kości ani przesunięć:
  dokłada części w tym samym miejscu sceny.
- **Pancerz zastępuje ciało**, jak w grze: gdy jest `armor`, `body` się nie ładuje.
- **Ochrona.** `scripts/protect-item-models.mjs` ma czwarty argument `characters`: czyta `models/characters/index.json`
  (`parts`), a nazwa pliku to HMAC `<gra>/<świat>/characters/<plik>` (ta sama szyfracja i klucz). Zaszyfrowane części
  trafiają do tego samego folderu `items/` w R2 co podglądy przedmiotów, więc ani bramka, ani katalog światów, ani
  skrypt wgrywania się nie zmieniają: nazwy to HMAC różnych ścieżek, więc nie ma kolizji.
- **Składanie.** `CharacterModelAssembler` (`services/models/`) wybiera części (pancerz zamiast ciała), pobiera je i
  odszyfrowuje równolegle przez `ProtectedModelLoader`; brak jednej części nie blokuje reszty. `ModelPreview.showModels`
  pokazuje kilka modeli w jednej scenie i kadruje kamerę na sumie ich brył (`PreviewView`: kierunek i odległość).
  Postacie patrzą na północ, więc kamera stoi od północy (`GeoportalFacade.showCharacterPreview`).
- **Komponent** (`BookEntry`, `EntrySummaryCard`) tylko pyta fasadę o podgląd i renderuje wynik; nie zna części
  ani szyfrowania.
- **Braki.** `model: null` pokazuje kartę bez podglądu (bez błędu). Brak jednej części (np. broni) nie blokuje reszty.

## Konsekwencje

- Pamięć R2: tekstury są wbudowywane w każdą zaszyfrowaną część, więc rozmiar rośnie około 2,2 raza w stosunku do
  eksportu (Khorinis: 22 MB w paczce, 49 MB po zaszyfrowaniu). Szacunek dla G1, G2 i Archolosa: ok. 450 MB
  (bucket ok. 6 z 10 GB).
- Jedna postać to 2–3 żądania do bramki zamiast jednego; limit 60/min na adres IP wystarcza na przeglądanie kart
  jedna po drugiej, ale przy szybkim przeglądaniu może wymagać podniesienia limitu `MODEL_REQUESTS`.
- Sprawdzone ręcznie na Khorinis (Abuyin, Harad, Czarny troll) z lokalnym serwerem zamiast bramki.
- Części są szyfrowane osobno, więc zmiana klucza wymaga ponownego zaszyfrowania wszystkiego (jak przy przedmiotach).
- Poza T w G3 jest widoczna; G1/G2 stoją w pozie spoczynkowej.
- Odłożone: bronie dla G2, Archolosa i G3 (do czasu podglądów broni z ekstraktora), animacje, obracanie głowy.

## Plan wdrożenia

1. Parser pola `model` postaci i typ `CharacterModelParts` (zrobione, testy).
2. Tryb `characters` w `protect-item-models.mjs` (zrobione).
3. `CharacterModelAssembler` i `ModelPreview.showModels` (zrobione, testy).
4. Podgląd w karcie postaci w Księdze (zrobione).
5. Szyfrowanie i wgranie części postaci wszystkich światów na R2 (do zrobienia przez autora).
