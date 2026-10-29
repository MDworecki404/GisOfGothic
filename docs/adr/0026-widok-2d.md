# 0026. Widok 2D: zablokowany widok 3D z góry i płaszczyzna cięcia

Status: przyjęta

## Kontekst

Chcemy trybu wyświetlania, w którym geoportal jest płaską mapą (północ u góry, przesuwanie i zoom jak
w OpenLayers), a światy wielopoziomowe (kopalnie, wieże, jaskinie) da się oglądać poziom po poziomie.
Rozważone drogi:

- **A. Zablokowany widok 3D z góry i płaszczyzna cięcia** (wybrana): rzut ortogonalny z [ADR 0021](0021-rzut-kamery.md),
  kamera prosto w dół, `ClippingPlaneCollection` Cesium na tilesetach świata.
- B. Kafelki 2D renderowane offline per poziom: lekkie, ale wymagają nowego potoku w ekstraktorze i dużych
  danych dla każdego poziomu każdego świata. Odrzucone.
- C. `SceneMode.SCENE2D`: nie współgra z 3D Tiles i światem przyklejonym do globusa. Odrzucone.

## Decyzja

- Tryb widoku (`view-3d` / `view-2d`) trzyma `ViewModeCoordinator` (`services/camera/`). Tryb 2D wymusza rzut
  ortogonalny; rzut i kąt widzenia sprzed wejścia wracają po wyjściu.
- Domyślnie 2D to cały świat z góry bez cięcia, bo płaszczyzna na stałej wysokości obcina też wzgórza.
- Wysokość cięcia (`sliceHeightMetres`, metry nad elipsoidą) należy do trybu 2D i znika z nim. Zakres
  suwaka wynika z granic modelu świata.
- Adres: `tryb=2d` (brak = 3D) i `ciecie=<metry>` (tylko z `tryb=2d`). Zakładki dostają opcjonalne pola,
  więc stare zapisy otwierają się jako 3D.

## Konsekwencje

- 2D nie jest lżejsze od 3D: model świata ładuje się tak samo, więc na telefonie wydajność się nie poprawia.
- Cesium nie zamyka przekroju; wnętrza ciętych brył widać „od środka”, co z góry wygląda jak plan.
- W 2D nie ma cieni (rzut ortogonalny, ADR 0021). Znaczniki miejsc nie są cięte.
- Nazwane poziomy per świat i skrót klawiszowy trybu są poza zakresem pierwszej wersji.
