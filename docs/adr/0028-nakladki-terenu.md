# 0028. Poziomice i siatka rysowane shaderem z pozycji oka

Status: przyjęta

## Kontekst

Panel Warstwy zapowiadał podkład z poziomicami i siatkę. Model świata jest w 3D Tiles z Cesium ion, bez danych
o wysokości w osobnym pliku, więc linie wysokości trzeba wyznaczyć z geometrii. Pergamin, rozważany jako podkład obok
poziomic, wypadł wizualnie źle i został odrzucony.

## Decyzja

- Poziomice i siatka to nakładki w shaderze kafli świata (`TileColorGrader`), przełączane niezależnie w panelu Warstwy.
  Nie są danymi ani osobnymi obiektami Cesium.
- Pozycję fragmentu w układzie świata (wschód, północ, góra) shader liczy z `positionEC` oraz uniformów
  `u_ecToEnu` i `u_cameraEnu`, które co klatkę podaje `OverlayCameraUniformsUpdater`. Próba z `positionMC` dała
  poprawne wysokości, ale osie poziome różniły się między kaflami (siatka północ–południe znikała na lądzie),
  a `positionWC` ma w float32 błąd ok. pół metra, za duży dla linii co 5 m.
- Linie mają stałą grubość w pikselach, a ich odstęp rośnie pięciokrotnie przy oddaleniu (adaptacyjny poziom szczegółu).
- Nakładki dotyczą tylko tilesetu świata, nie obiektów (voby).

## Konsekwencje

- Zmiana nakładki przebudowuje shader terenu (kilkadziesiąt milisekund); to rzadka akcja użytkownika.
- Dopóki któraś nakładka jest włączona, co klatkę wykonują się dwa wywołania `setUniform`.
- Wybór nakładek jest ustawieniem sesji; jeśli ma trafić do linku lub zakładek, trzeba rozszerzyć kodek widoku.
