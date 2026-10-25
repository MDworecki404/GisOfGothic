# 0020. Pergamin pod przezroczystym płótnem i widoczne atrybucje

Status: przyjęta

## Kontekst

Poza modelem świata scena Cesium miała jednolite, prawie czarne tło. Mapa nie przypominała arkusza
z ekwipunku gracza, a motyw z [ADR 0019](0019-motyw-mapa-z-sakwy-i-tokeny-ukladu.md) tego wymaga.
Atrybucje Cesium trafiały do odłączonego elementu, więc logo Cesium ion nie było widoczne. Warunki
Cesium ion wymagają jego pokazania.

## Decyzja

- **Tło:**
  - `ViewerOptionsBuilder.withTransparentBackground()` włącza kanał alfa płótna
    (`contextOptions.webgl.alpha`), a `scene.backgroundColor` jest przezroczysty.
  - Pergamin (ziarno, plamy, ciemniejące brzegi) rysuje CSS w `.map-parchment` pod płótnem, bez obrazków.
  - Przypalone brzegi nad mapą to nakładka `.map-parchment-frame` z `pointer-events: none`,
    więc nie przechwytuje kliknięć.
- **Atrybucje:**
  - `withHiddenCredits()` zastępuje `withCreditsIn(element)`. `GeoportalFacade.attachMapTo` przyjmuje
    drugi argument: element na atrybucje.
  - Element dostarcza komponent `MapAttribution`, który obok logo Cesium ion pokazuje prawa do świata gry.
  - Atrybucja przeniesiona z tekstu paska stanu do `MapAttribution`.
  - Style Cesium (`widgets.css`) są poza `@layer`, więc nasze nadpisania klas `cesium-*` też są poza
    warstwą.

## Konsekwencje

- Przezroczyste płótno dokłada pracy przy kompozycji strony. Wpływu na liczbę klatek nie mierzono;
  przy zgłoszeniach o spadku płynności to pierwszy kandydat do sprawdzenia (pomiar z okna „Wydajność”).
- Podgląd modelu przedmiotu (`ModelPreview`) ma nadal własne, jednolite tło.
- Zmiana kolorów pergaminu to edycja klas w `src/app.css`, bez dotykania kodu mapy.
