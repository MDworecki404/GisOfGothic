# 0018. Nazwy gildii z danych świata, nie z kodu aplikacji

Status: przyjęta

## Kontekst

Aplikacja miała w kodzie mapę kod gildii → nazwa, napisaną pod Gothica 2. Gothic 1 ma inne gildie
(GRD, STT, ORG, TPL, GUR…), a ten sam numer gildii oznacza w obu grach co innego: `HUMAN` to w G2 paladyn,
a w G1 magnat. Mapa w kodzie nie obsłuży wielu gier.

## Decyzja

- Exporter zapisuje w `metadata.json` każdego świata `guild_names` (tabela TXT_GUILDS z gry, tylko gildie występujące w świecie).
- Aplikacja trzyma je w `GuildNameBook`, ustawianej przy otwarciu świata przed zbudowaniem indeksu wyszukiwania.
  Kod `NONE` (technicznie „Brak przyn.”) zawsze pokazujemy jako „Bez gildii”.
- Kod gildii bez wpisu w danych pokazujemy bez zmian.

## Konsekwencje

- Nazwy są oficjalnymi polskimi tekstami z gry (np. „Obywatel” zamiast naszego „Mieszczanin”, „Farmer” zamiast „Chłop”).
- Dodanie kolejnej gry nie wymaga zmian w kodzie nazw.
- Indeks wyszukiwania powstaje dopiero po wczytaniu `metadata.json`, więc ten plik jest wymagany do wyszukiwania.
