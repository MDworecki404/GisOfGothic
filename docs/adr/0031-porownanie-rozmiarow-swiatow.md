# 0031. Porównanie rozmiarów światów: widma z przesuwaniem

Status: przyjęta

## Kontekst

Gracz chce zobaczyć, jak duże są światy względem siebie, i ustawić je obok siebie według własnego uznania. Porównanie
suwakiem (ADR 0030) pokazuje dwa światy w tym samym miejscu, ale nie pozwala ich przesuwać ani pokazać kilku naraz.
Obwiednie modeli (`tileset.json`) są pudełkami w ramie Wschód–Północ–Góra z jednostkami w metrach, więc wymiary
światów da się porównywać bezpośrednio (Khorinis około 1,6 × 1,7 km, Myrtana około 4,9 × 5,0 km).

## Decyzja

- Narzędzie **Rozmiary** (`sizes`) pokazuje wybrane pola wyboru światy jako osobne tilesety obok otwartego. Otwarty świat
  zostaje nieruchomym odniesieniem, a jego wymiary i wymiary każdego wybranego świata (z obwiedni) widać w panelu.
- Światy są półprzezroczystymi „widmami”: `CustomShader` w trybie `TRANSLUCENT` miesza kolor modelu z barwą świata, a
  przezroczystość to uniform, więc podświetlenie po najechaniu (z mapy albo z listy) zmienia tylko tę wartość.
- Nowy świat staje środkiem obrysu na środku otwartego (porównanie współśrodkowe), a „Zresetuj pozycję” tu wraca.
  Pozycję zmienia się polami liczbowymi (środek wschód/północ/wysokość i obrót) albo przeciągnięciem świata na mapie.
  Obrót odbywa się wokół środka obrysu.
- Przeciąganie przechwytuje zdarzenie wskaźnika w fazie przechwytywania na oknie (`WorldSizeLayer`), zanim zobaczy je
  Cesium, i przesuwa świat po płaszczyźnie poziomej przez jego środek. Wyłączanie akcji kamery nie wystarcza: kontroler
  kumuluje ruch myszy i po ponownym włączeniu „nadrabia” go, przez co kamera skacze.
- Świat pod kursorem wskazuje `drillPick` (światy leżą jeden na drugim), sprawdzany raz na klatkę.
- Stan jest sesyjny; zamknięcie narzędzia, zmiana otwartego świata albo start porównania suwakiem go czyści.
- Ograniczenie do sześciu światów naraz (liczba barw); dalej pola wyboru są nieaktywne.
- Gizmo (strzałki osi) świadomie odłożone: przeciąganie po płaszczyźnie i pola liczbowe pokrywają potrzebę taniej.

## Konsekwencje

- Każdy zaznaczony świat to pełny tileset do pobrania; duże światy (Myrtana) obciążają sieć i pamięć, zwłaszcza
  na telefonie. Dlatego ładują się tylko po zaznaczeniu i znikają po odznaczeniu.
- Gęsta, nakładająca się geometria w półprzezroczystości bywa mętna; barwy światów ją porządkują, ale nie usuwają.
- Przeciąganie rusza tylko wysokość stałą i położenie poziome; podniesienie świata odbywa się polem liczbowym.
- Zakładki i adres nie zapamiętują rozstawienia.
