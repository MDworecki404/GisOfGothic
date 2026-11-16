# Sterowanie kamerą podglądu 3D — projekt

## Cel
Podgląd 3D przedmiotu lub postaci (karta Księgi, karta identyfikacji obiektu) ma pełniejsze sterowanie
kamerą: obrót w górę/dół, przybliżanie, powrót do widoku domyślnego, automatyczny obrót i pełny ekran.
Działa na desktopie i telefonie, z polskimi podpisami i dostępnością.

## Zakres i nie-cele
- Jest: przechył (pitch ograniczony do −85°…+10°), zoom +/−, reset, automatyczny obrót (domyślnie
  wyłączony, zatrzymuje się po dotknięciu podglądu), pełny ekran, gesty (przeciągnięcie, kółko, szczypanie).
- Nie ma: żadnej drogi pobrania modelu (ADR 0012, 0042) — pełny ekran to tylko widok, bez adresu blob ani zapisu.

## Podejścia
- **A (wybrane):** fasada zwraca sesję podglądu (`ModelPreviewSession`) z poleceniami i reaktywnym stanem
  przycisków; komponent `ModelPreviewFrame` rysuje pasek narzędzi.
- B: wszystko przez event bus z identyfikatorem podglądu — odrzucone, bo bus służy globalnej mapie, a tu
  każdy podgląd ma własną kamerę.
- C: włączenie przechyłu Cesium — odrzucone, bo nie daje limitów, resetu ani przycisków.

## Decyzje
- Gesty obsługuje `ModelPreview` sam (zdarzenia wskaźnika na canvasie), wyłączając kontroler Cesium; obliczenia
  kątów i odległości są w `PreviewCameraMath` (testowane bez WebGL).
- Pełny ekran: Fullscreen API na ramce, a gdzie go brak (iOS) — nakładka `fixed inset-0`.
- Do ustalenia przez wykonawcę: kroki, prędkość obrotu, ikony.
