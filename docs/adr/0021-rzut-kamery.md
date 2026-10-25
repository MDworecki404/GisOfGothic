# 0021. Rzut kamery: wbudowany ortogonalny Cesium z korektą odległości

Status: przyjęta

## Kontekst

Chcemy, żeby użytkownik przełączał kamerę między rzutem środkowym a ortogonalnym (plan mapy, w którym
metr ma wszędzie tyle samo pikseli) i ustawiał kąt widzenia. Spike na Cesium 1.146 i prawdziwym świecie
Khorinis pokazał:

- W rzucie ortogonalnym Cesium sam ustawia `frustum.width` na odległość kamery od punktu pod środkiem
  ekranu (zoom, `move`, przeloty). Odległość i skala są więc sprzężone.
- `switchToOrthographicFrustum()` daje skok widoku o czynnik zależny od kąta widzenia i proporcji ekranu
  (przy 4:3 i 60° ok. 1,15×).
- `look` (obrót w miejscu) i `moveUp/moveDown` nie odświeżają szerokości (rozjazd rzędu 12%).
- `PerspectiveFrustum.fov` to większy z dwóch kątów widzenia, a `switchToPerspectiveFrustum()` zeruje go do 60°.
- Kaskadowe mapy cieni Cesium nie działają przy kamerze ortogonalnej (`computeCascades` używa perspektywicznego
  `scratchFrustum`) i przerywają renderowanie błędem `fov, aspectRatio, near, or far parameters are not set`.
- Pick, `pickPosition`, 3D Tiles, `flyTo`, `setView` i zoom kółkiem działają w ortho bez zmian.

## Decyzja

- Używamy **wbudowanego rzutu ortogonalnego Cesium** i nie zarządzamy szerokością sami (odrzucone: własny
  zoom wymagałby przepisania wejścia myszy i dotyku; „pseudo-ortho” przez małe FOV zniekształca obraz i psuje głębię).
- `CameraProjectionController` (`services/map/`) jest jedynym miejscem, które zmienia frustum. Przy przełączeniu
  przelicza odległość kamery wzorami `CameraProjectionConverter` tak, by cel zachował rozmiar na ekranie;
  przy powrocie do perspektywy obowiązuje dolna granica odległości (5 m), żeby kamera nie weszła w teren.
- Kąt widzenia perspektywy jest pamiętany także w ortho (`CameraViewGeometry`): przeloty i kadrowanie liczą
  w „zakresie perspektywy” i zamieniają go na odległość kamery, więc `showWholeWorld` i przeloty do miejsc
  dają ten sam rozmiar w obu rzutach.
- Skala w ortho to `frustum.width / szerokość płótna`, bez `pickPosition`; w perspektywie zostaje pomiar.
- Po obrocie `look` szerokość nie jest odświeżana: skala i kadrowanie biorą szerokość z frustum.
  Następny zoom ustawia ją na odległość od powierzchni, więc może skoczyć (do ok. 12%).
- W ortho przyciski wysokości (Q/E) działają jak zoom, bo odległość kamery nie zmienia rozmiaru obrazu.
- Cienie są w rzucie ortogonalnym wyłączone, a po powrocie do perspektywy wracają (`MapService.applyShadows`).
- Link i zakładki: opcjonalny parametr `rzut` (`o` albo `p_<fov>`), brak oznacza perspektywę 60°, więc stare
  linki i zakładki działają bez zmian ([ADR 0007](0007-widok-w-adresie-i-zakladki-w-localstorage.md)).

## Konsekwencje

- Rzut ortogonalny nie ma cieni; interfejs ma to wyjaśniać w panelu Czas.
- Po przywróceniu widoku z linku w ortho, zanim wczytają się kafle, szerokość jest ustawiana ponownie
  (`synchronizeWidthWhenSurfaceKnown`), bo Cesium liczy ją wtedy z wysokości nad elipsoidą.
- Pomiary wykonano tylko na komputerze (liczba kafli i trójkątów podobna w obu rzutach); czasu klatki na
  telefonie nie mierzono.
- Aktualizacja Cesium wymaga ponownego sprawdzenia: zachowanie szerokości w ortho i błąd cieni.
