# 0030. Porównanie światów suwakiem podziału ekranu

Status: przyjęta

## Kontekst

Gracz chce zobaczyć różnice między światami o wspólnej geometrii, np. Archolos względem oryginału albo Górniczą Dolinę
z Gothica 1 i 2. Wszystkie światy mają kotwicę w początku układu współrzędnych gry (`lon`, `lat`, `h` równe 0), więc dwa
modele nakładają się w tym samym miejscu bez przesunięcia.

## Decyzja

- Drugi model świata to osobny `Cesium3DTileset` w tej samej scenie. Podział ekranu robi wbudowany mechanizm Cesium:
  `scene.splitPosition` i `splitDirection` tilesetów. Bieżący świat (razem z obiektami świata) dostaje `LEFT`,
  porównywany `RIGHT`.
- Porównuje się sam teren: obiekty drugiego świata (voby) nie są ładowane, a dane, wyszukiwarka i warstwy dotyczą
  wciąż bieżącego świata.
- `WorldComparisonCoordinator` trzyma stan (wybrany świat, podpisy z nazwą gry, położenie suwaka, stan wczytywania) i
  publikuje `world-comparison-changed`. Kotwicę drugiego świata czyta z jego `metadata.json`. Wynik starszego wczytania
  jest pomijany, a zmiana otwartego świata kończy porównanie.
- Stan porównania jest sesyjny: nie wchodzi do adresu, zakładek ani kopii zapasowej.
- Suwak to nakładka HTML (`WorldComparisonSlider`) z rolą `slider`, obsługą wskaźnika i strzałek.

## Konsekwencje

- Drugi model świata podwaja liczbę kafli do pobrania, więc porównanie włącza się tylko na żądanie.
- Porównanie ma sens dla światów o zbliżonej geometrii; dla pozostałych oba modele po prostu się nakładają, o czym
  informuje podpowiedź w wyborze świata.
- Rozdziały postaci i zawartość warstw nie mają wersji „po prawej”; porównanie rozdziałów wymagałoby osobnej decyzji.
