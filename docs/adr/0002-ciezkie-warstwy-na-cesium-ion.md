# 0002. Ciężkie warstwy na Cesium ion

- Status: przyjęta
- Data: 2026-10-15

## Kontekst

Model świata Khorinis (`world.glb`) ma ~150 MB, modele obiektów kolejne ~60 MB. Wczytywany w całości
blokuje start aplikacji, puchnie build i nie skaluje się na kolejne światy. To także zasoby z gry,
których nie chcemy rozprowadzać w plikach aplikacji.

## Decyzja

Ciężkie warstwy tilujemy jako 3D Tiles i hostujemy na Cesium ion. Aplikacja wczytuje je przez
`Cesium3DTileset.fromIonAssetId`; asset ID trzyma katalog światów. W `static/` zostają tylko lekkie dane
(indeks wyszukiwania, GeoJSON, metadane).

## Konsekwencje

- Teren dociąga się kaflami według widoku — szybki start, mniejszy transfer, działa na telefonie.
- Wymagany token ion (`PUBLIC_CESIUM_ION_TOKEN`); trafia do zbudowanej strony, więc musi mieć
  wąski zakres (odczyt assetów świata, ograniczenie do domeny).
- Zależność od zewnętrznej usługi i jej limitów; tryb offline (PWA) obejmie tylko lekkie dane
  i ewentualnie kafle w pamięci podręcznej przeglądarki.
