# 0006. Analizy na czystych klasach i lokalnym rzucie

Status: przyjęta

## Kontekst

Narzędzie Analizy (najbliższe wystąpienia, zasięg, mapa zagęszczenia) liczy odległości i zlicza
obiekty. Dane z paczki mają pozycje jako lon/lat/h (WGS 84), a klasa `WorldFrame` zna ramę świata
(E, N, H w metrach od kotwicy), ale zależy od Cesium — nie da się jej użyć w testach Vitest bez
przeglądarki. Analizy mają być testowane na liczbach, a rysowanie ma zostać osobno.

## Decyzja

- Obliczenia to **czyste klasy** w `src/lib/services/analysis/` (`NearestPlacesFinder`,
  `BufferAnalyzer`, `DensityGridBuilder`) działające na `LocalPoint` (E, N, H w metrach), bez Cesium
  i bez zdarzeń. Każda ma testy Vitest.
- Rzut lon/lat/h → rama świata robi `LocalProjector`: to samo przekształcenie ENU co `WorldFrame`,
  policzone wprost na elipsoidzie WGS 84. Dzięki temu analizy nie importują Cesium.
- Stan narzędzia (temat, punkt odniesienia, promień, siatka) trzyma `AnalysisCoordinator`; wynik
  publikuje jako zdarzenie `analysis-changed`, a rysowanie zleca interfejsowi `AnalysisDisplay`,
  który implementuje `MapService`.
- Rysuje `AnalysisRenderer` w `services/map/`: oddzielne kolekcje prymitywów Cesium dla wyniku,
  pomijane przy próbkowaniu wysokości terenu.
- Gdy narzędzie Analizy jest aktywne, kliknięcie mapy ustawia punkt odniesienia (nie wywołuje
  identyfikacji obiektu); wynik znika z mapy po zamknięciu narzędzia.

## Konsekwencje

- Rzut `LocalProjector` i `WorldFrame` muszą dawać ten sam wynik; przy zmianie jednego sprawdź drugi.
- Dopisanie analizy to nowa czysta klasa z testem, gałąź w `AnalysisCoordinator`, metoda w
  `AnalysisDisplay` i rysowanie w rendererze — UI dostaje tylko nowe pole widoku.
