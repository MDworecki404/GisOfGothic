# 0004. Tileset świata ustawiany macierzą ENU kotwicy

- Status: przyjęta
- Data: 2026-10-15

## Kontekst

Model świata ma układ glTF = (Wschód, Góra, −Północ) w metrach względem kotwicy z `metadata.json`.
Po tilowaniu na Cesium ion tileset nie ma transformacji (`georeferenced: false`): ion zamienił osie
na lokalne (Wschód, Północ, Góra), ale zostawił model w środku Ziemi. Bez poprawki świat był
obrócony i oświetlony od spodu.

## Decyzja

`MapService` wczytuje tileset z `modelMatrix = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(lon, lat, h))`
dla kotwicy odczytanej z `metadata.json`. Lokalne osie tilesetu pokrywają się z ramą ENU, więc nie
potrzeba dodatkowego obrotu. Lokalizacji assetu na ion nie ustawiamy.

## Konsekwencje

- Model i punkty z danych (WGS84 względem tej samej kotwicy) pasują do siebie bez przeliczeń.
- Kotwica musi być znana przed wczytaniem tilesetu — fasada najpierw pobiera `metadata.json`.
- Gdyby asset na ion dostał lokalizację, macierz trzeba będzie usunąć — inaczej przesunięcie się zdubluje.
