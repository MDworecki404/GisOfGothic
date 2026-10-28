# 0025. Opis przedmiotu z gry jako nazwa widoczna w aplikacji

Status: przyjęta

## Kontekst

W Gothicu 1 i 2 skrypt przedmiotu ma dwa pola: `name` (ogólna nazwa, np. „Mikstura”, „Zwój”, „Pierścień”) i `description`
(etykieta z ekwipunku, np. „Esencja lecznicza”). Paczka danych zawierała tylko `name`, więc w Khorinis 15 różnych
mikstur wyglądało w wyszukiwarce identycznie. Kamienne tablice z dodatku obchodziliśmy tabelą w kodzie
(`StonePlateNameResolver`), ale ręczna tabela na kilkaset kodów byłaby błędna i nie do utrzymania
(Gothicpedia odrzuca pobieranie automatyczne, więc nie ma z czego jej zbudować).

## Decyzja

- Paczka może mieć przy przedmiocie opcjonalne pole `description` (indeks wyszukiwania, `items.geojson`, linie
  `contents` i `inventory`, `treasure_sets.json`, przedmioty w `quests.json`).
- `readItemNames` (`src/lib/data/parsers.ts`) robi z niego nazwę widoczną; pusty opis albo równy nazwie jest ignorowany.
  Ogólna nazwa trafia do `SearchEntry.genericName` i do słów kluczowych wyszukiwarki, więc „mikstura” nadal znajduje wszystkie.
- Bez pola nic się nie zmienia, a kamienne tablice dostają atrybut z kodu jak dotąd.

## Konsekwencje

- Poprawne nazwy pojawią się dopiero po wyeksportowaniu `description` przez ekstraktor (kontrakt w `docs/dane.md`).
- Dalsze duplikaty, których opis nie rozróżnia (np. odmiany `_Snow` w G3), zostają.
