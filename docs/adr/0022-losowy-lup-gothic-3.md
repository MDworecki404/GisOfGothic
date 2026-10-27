# 0022. Losowy łup Gothica 3 z osobnego pliku, wczytywany na żądanie

Status: przyjęta

## Kontekst

W Gothicu 3 prawie cała zawartość skrzyń i ekwipunek postaci są losowane z zestawów łupu. Paczka v4 opisuje je
w `treasure_sets.json` (ok. 0,1 MB), w polach `treasure_sets` obiektów warstw oraz w polu `loot` i miejscach
`set` w indeksie wyszukiwania. G1 i G2 tych pól nie mają.

## Decyzja

- Pola łupu są opcjonalne w parserach; brak pola oznacza pusty łup, więc G1 i G2 działają bez zmian.
- `treasure_sets.json` pobiera `TreasureSetBook` dopiero przy pierwszej karcie skrzyni lub postaci z zestawami.
  Karta pojawia się od razu, a „Może zawierać (losowo)” dopisuje się po wczytaniu (`DataLayersCoordinator`).
- Miejsca z `set` mają własny kolor i podpis „losowy łup”, nie wliczają się do sztuk w świecie.
- Cechy gry zapisuje `WorldDefinition` (`hasChapters`, `hasApproximateRoutineTimes`), a UI tylko je czyta.

## Konsekwencje

- Świat bez `treasure_sets.json` działa; karta zostaje bez listy możliwej zawartości.
- Podświetlanie skrzyń danego zestawu na mapie nie jest zrobione (da się je zbudować na `treasureSetCodes`).
