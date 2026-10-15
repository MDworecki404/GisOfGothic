# 0008. Kadrowanie kamery z marginesem na panele

Status: przyjęta

## Kontekst

Panel narzędzia zasłania mapę: na komputerze stoi z lewej (ok. 440 px razem z szyną), na telefonie
wysuwa się od dołu (ponad połowa ekranu). Przeloty `flyToBoundingSphere` stawiały cel w środku całego
płótna, więc znaczniki wybranego wpisu i miejsca z list lądowały pod panelem.

## Decyzja

- UI zgłasza fasadzie, ile pikseli mapy od lewej i od dołu jest zasłonięte (`reserveMapSpace`).
  Robi to `MapInsetsReporter`, który mierzy elementy oznaczone `data-map-obstacle` (szyna i panel):
  element szerszy niż 60% okna uznaje za dolny arkusz, pozostałe za lewy panel.
- `CameraFramer` wykonuje przeloty: kamera ma ten sam kierunek, nachylenie i odległość co w zwykłym
  przelocie, ale jest przesunięta w bok i w górę, tak by cel wypadł w środku wolnego obszaru. Przy
  przelotach „dopasuj do wszystkich” odległość rośnie proporcjonalnie do zasłoniętej części.
- Rachunek wolnego obszaru (`FreeAreaCalculator`) jest czysty i testowany; wektory w układzie
  Wschód–Północ–Góra składa `CameraFramer` na obiektach Cesium.
- Kadrowanie dotyczy przelotów do znaczników, miejsc, wyników analiz i całego świata. Widok z linku
  albo zakładki jest dokładną pozycją kamery i marginesów nie uwzględnia.
- Przy `prefers-reduced-motion` przeloty są natychmiastowe.

## Konsekwencje

- Nowy panel albo element zasłaniający mapę wystarczy oznaczyć `data-map-obstacle`.
- Nowe przeloty kamery powinny iść przez `CameraFramer`, nie bezpośrednio przez `flyToBoundingSphere`.
- Prawa kolumna kontrolek i pasek górny nie są liczone — są małe i nie zasłaniają celu.
