# 0032. Gizmo i widmo świata odniesienia w narzędziu Rozmiary

Status: przyjęta

## Kontekst

ADR 0031 wprowadził narzędzie Rozmiary: wybrane światy jako półprzezroczyste widma, przesuwane polami liczbowymi albo
przeciąganiem po płaszczyźnie. Odłożono wtedy gizmo, a otwarty świat zostawał nieprzezroczysty, więc przykrywał widma,
które leżały pod jego powierzchnią. Użytkownik chciał, żeby odniesienie też było przezroczyste, ustawianie było łatwiejsze
i barwy były kontrastowe.

## Decyzja

- **Otwarty świat też jest widmem** (jasna, prawie biała barwa, ta sama przezroczystość co pozostałe), razem ze swoimi
  obiektami. Shader widma zastępuje jego shader tylko na czas działania narzędzia: po jego zamknięciu `MapService`
  nakłada korektę koloru i nakładki od nowa (`setPrimaryWorldGhost`). Odniesienie jest nieruchome (od jego pozycji zależą
  znaczniki, pomiary i pinezki), ale można je podświetlić najechaniem, a jego wiersz jest w panelu.
- **Gizmo wybranego świata** (`WorldSizeGizmo`): trzy osie (czerwona wschód, zielona północ, niebieska góra) z kulką na końcu
  oraz biały pierścień obrotu z kulką kierunku. Przeciągnięcie osi przesuwa świat wzdłuż niej (punkt prostej
  najbliższy promieniowi z kamery, `findClosestParameterOnLine`), a przeciągnięcie pierścienia obraca świat wokół środka
  obrysu (kąt od północy zgodnie z ruchem wskazówek zegara). Świat wybiera się nazwą w panelu albo kliknięciem na mapie;
  przeciąganie samego świata po płaszczyźnie zostaje.
- **Gizmo rysują punkty, nie linie.** Osie to gęste kropki, a kulki to większe punkty: punkty mają wyłączony test głębi
  (środek obrysu leży zwykle wewnątrz modelu, więc linie by znikały), mają wbudowane rozpoznawanie myszą, a skala
  na ekranie jest stała dzięki macierzy kolekcji przeliczanej co klatkę. Próba z `Primitive` i `PolylineGeometry` upadła:
  geometria w układzie lokalnym wymaga wyłączenia rzutowania na 2D, a `depthFailAppearance` z kolorem per instancja
  odrzucał atrybut `depthFailColor`.
- **Barwy:** sześć nasyconych barw odległych na kole barw (`SIZE_WORLD_COLORS`) i jasne odniesienie; siła mieszania barwy
  z teksturą rośnie do 62%, żeby światy dało się rozróżnić także po nałożeniu.
- Pola liczbowe (środek wschód/północ/wysokość, obrót) zostają obok gizma i przeciągania.

## Konsekwencje

- Wiele półprzezroczystych, współśrodkowych światów nakłada się na siebie i bywa mętne; rozdzielają je przesunięcie
  i barwy, ale nie znikają całkiem.
- Punkty gizma są zawsze na wierzchu, także za terenem; to zamierzone, bo gizmo ma być użyteczne wewnątrz modelu.
- Zdarzenie wskaźnika trafiające w uchwyt gizma albo świat jest przechwytywane przed kamerą, więc kamerę rusza się
  przeciąganiem tła.
