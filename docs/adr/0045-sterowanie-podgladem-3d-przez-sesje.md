# 0045. Sterowanie podglądem 3D przez sesję, nie event bus

Status: przyjęta.

## Kontekst

Podgląd 3D przedmiotu lub postaci (ADR 0012, 0042) miał tylko obrót wokół osi pionowej i zoom.
Użytkownicy chcą przechylać model w górę i w dół, wracać do widoku domyślnego, obracać go automatycznie
i oglądać na pełnym ekranie, także na telefonie. Zasady projektu: komponenty nie znają Cesium, a UI i logikę łączy
event bus lub stan udostępniany przez fasadę.

## Decyzja

- Fasada zwraca `ModelPreviewSession` (zamiast funkcji sprzątającej): polecenia kamery i reaktywny
  `ModelPreviewControlsState` (tylko dane). Komponent `ModelPreviewFrame` renderuje pasek przycisków.
- Nie używamy event busa, bo ten jest globalny, a każdy podgląd ma własną kamerę i może być kilka naraz
  (karta Księgi i karta identyfikacji); wymagałoby to identyfikatorów i rejestru podglądów.
- Gesty obsługuje `ModelPreview` na zdarzeniach wskaźnika, a kontroler kamery Cesium jest wyłączony,
  bo nie daje limitów przechyłu, resetu ani spójnego szczypania. Obliczenia kątów i odległości
  są w `PreviewCameraMath` i mają testy jednostkowe.
- Pełny ekran nie dodaje żadnej drogi pobrania modelu: to Fullscreen API na ramce lub nakładka CSS.

## Konsekwencje

- Nowy podgląd = nowa sesja; komponent musi wywołać `destroy` (robi to `{@attach}`).
- Zmiana poleceń podglądu dotyka sesji i `ModelPreview`, a nie komponentów używających ramki.
