# 0023. Voby dużych światów dzielone na kilka assetów ion

Status: przyjęta

## Kontekst

`vobs.glb` Myrtany (Gothic 3) ma 123 818 węzłów, 3237 siatek i 336 MB bufora. Cesium ion odrzucił go
bez podania przyczyny („Something went wrong with this asset”), choć teren (1 węzeł, 152 MB) przeszedł.

## Decyzja

- `scripts/split-vobs-glb.mjs` dzieli `vobs.glb` na 2, 4 albo 8 plików o równej liczbie węzłów
  (naprzemiennie po wschodzie i północy). Każda część to osobny asset ion; paczka źródłowa zostaje nietknięta.
- `WorldDefinition.staticObjectsTilesetUrls` jest listą; `MapService` ładuje wszystkie zestawy kafli razem,
  a licznik oczekujących kafli sumuje je po wszystkich.
- Części dzielą tekstury i współdzielone siatki, więc razem zajmują więcej niż oryginał (ok. 566 MB zamiast 376 MB).

## Konsekwencje

- Każdą część trzeba dopuścić w `ALLOWED_ION_ASSETS` bramki i w zasobach tokenu ion.
- Pozostałe światy mają listę z jednym adresem i działają jak dotąd.
