# 0051. Linijki współrzędnych w widoku 2D

- Status: przyjęta
- Data: 2026-11-17

## Kontekst

Makiety „Atlas Gothic” (ADR 0047) mają na brzegach mapy linijki z odległościami, które nadają jej charakter atlasu
i pokazują skalę. W widoku 3D z przechyłem metry na piksel zmieniają się po ekranie, więc linijka byłaby
nieprawdziwa. W widoku 2D (ADR 0026) kamera patrzy prosto w dół w rzucie ortogonalnym i północ jest u góry.

## Decyzja

- Linijki pokazujemy **tylko w widoku 2D i na komputerze**. Wschód leży na pasku pod nagłówkiem, Północ na pasku przy
  szynie narzędzi; wartości w metrach i kilometrach od kotwicy świata.
- `MapViewObserver` wylicza `ViewExtent` (środek ekranu z `camera.pickEllipsoid`, skala z rzutu ortogonalnego, rozmiar
  płótna) przy każdej zmianie kamery; poza 2D zgłasza `null`. Wystarcza to, bo w 2D oba wymiary zależą liniowo od ekranu.
- `CoordinateRulerTickBuilder` (czysta klasa, testowana) dobiera okrągłe odstępy (1, 2, 5 × 10ⁿ) nie gęściej niż
  90 px. `AppState.coordinateRulers` jest wyliczane z `viewExtent`.
- Linijki leżą pod panelami (`z-10`) i nie przechwytują kliknięć.

## Konsekwencje

- Linijki liczą w układzie lokalnym świata; wybór układu współrzędnych w odczycie ich nie zmienia.
- Znaczniki przeliczają się przy każdej zmianie kamery w 2D; kosztem jest kilkadziesiąt elementów DOM.
- Znaczniki miejsc z makiet (rombowe pinezki z podpisami) nadal są poza zakresem.
