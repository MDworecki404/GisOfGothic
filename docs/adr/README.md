# Decyzje architektoniczne (ADR)

Krótkie zapisy ważnych decyzji: kontekst, decyzja, konsekwencje. Zasady prowadzenia: [rozwoj.md](../rozwoj.md#decyzje-projektowe).

| Nr                                                                 | Decyzja                                                | Status            |
| ------------------------------------------------------------------ | ------------------------------------------------------ | ----------------- |
| [0001](0001-architektura-klasowa-fasada-event-bus.md)              | Architektura klasowa z fasadą i event busem            | przyjęta          |
| [0002](0002-ciezkie-warstwy-na-cesium-ion.md)                      | Ciężkie warstwy na Cesium ion                          | przyjęta          |
| [0003](0003-zasoby-cesium-przez-static-copy.md)                    | Zasoby Cesium przez vite-plugin-static-copy            | przyjęta          |
| [0004](0004-tileset-w-kotwicy-enu.md)                              | Tileset świata ustawiany macierzą ENU kotwicy          | przyjęta          |
| [0005](0005-swiat-w-adresie-i-katalog-swiatow.md)                  | Świat w adresie URL i katalog światów                  | przyjęta          |
| [0006](0006-analizy-na-czystych-klasach-i-lokalnym-rzucie.md)      | Analizy na czystych klasach i lokalnym rzucie          | przyjęta          |
| [0007](0007-widok-w-adresie-i-zakladki-w-localstorage.md)          | Widok w adresie URL i zakładki w localStorage          | przyjęta          |
| [0008](0008-kadrowanie-kamery-z-marginesem-na-panele.md)           | Kadrowanie kamery z marginesem na panele               | przyjęta          |
| [0009](0009-wlasny-arkusz-mobilny-zamiast-drawera.md)              | Własny arkusz mobilny zamiast drawera                  | przyjęta          |
| [0010](0010-hosting-cloudflare-pages-z-wgrywaniem-lokalnym.md)     | Hosting na Cloudflare Pages z wgrywaniem z komputera   | przyjęta          |
| [0011](0011-pwa-z-wlasnym-service-workerem.md)                     | PWA z własnym service workerem SvelteKit               | przyjęta          |
| [0012](0012-ochrona-modeli-przedmiotow.md)                         | Ochrona modeli przedmiotów przed pobraniem             | przyjęta          |
| [0013](0013-model-swiata-przez-bramke-ion.md)                      | Model świata przez bramkę do Cesium ion                | przyjęta          |
| [0014](0014-produkcja-tylko-z-wydan.md)                            | Produkcja tylko z wydań, po testach                    | przyjęta          |
| [0015](0015-jakosc-renderowania-auto-tylko-w-dol.md)               | Jakość renderowania: automatyka tylko w dół            | przyjęta          |
| [0016](0016-nowe-funkcje-podnosza-wersje-minor.md)                 | Nowe funkcje podnoszą wersję minor przed 1.0.0         | przyjęta          |
| [0017](0017-szczegoly-questow-ladowane-leniwie.md)                 | Szczegóły questów ładowane leniwie z `quests.json`     | przyjęta          |
| [0018](0018-nazwy-gildii-z-danych-swiata.md)                       | Nazwy gildii z danych świata, nie z kodu aplikacji     | przyjęta          |
| [0019](0019-motyw-mapa-z-sakwy-i-tokeny-ukladu.md)                 | Motyw „Mapa z sakwy kopacza” i tokeny układu           | zastąpiona (0036) |
| [0020](0020-pergamin-pod-plotnem-i-widoczne-atrybucje.md)          | Pergamin pod płótnem i widoczne atrybucje              | przyjęta          |
| [0021](0021-rzut-kamery.md)                                        | Rzut kamery: wbudowany ortogonalny Cesium z korektą    | przyjęta          |
| [0022](0022-losowy-lup-gothic-3.md)                                | Losowy łup Gothica 3 z osobnego pliku, na żądanie      | przyjęta          |
| [0023](0023-voby-dzielone-na-kilka-assetow-ion.md)                 | Voby dużych światów dzielone na kilka assetów ion      | zastąpiona (0027) |
| [0024](0024-ekran-ladowania-aplikacji.md)                          | Ekran ładowania: statyczny przed JS i komponent        | przyjęta          |
| [0025](0025-opis-przedmiotu-jako-nazwa-widoczna.md)                | Opis przedmiotu z gry jako nazwa widoczna              | przyjęta          |
| [0026](0026-widok-2d.md)                                           | Widok 2D: widok z góry i płaszczyzna cięcia            | przyjęta          |
| [0027](0027-myrtana-voby-w-jednym-assecie-ion.md)                  | Myrtana: voby w jednym assecie ion, nowy eksport       | przyjęta          |
| [0028](0028-nakladki-terenu.md)                                    | Poziomice i siatka rysowane shaderem z pozycji oka     | przyjęta          |
| [0029](0029-notatnik-gracza-lokalnie-z-kopia-w-pliku.md)           | Notatnik gracza lokalnie, kopia zapasowa w pliku       | przyjęta          |
| [0030](0030-porownanie-swiatow-podzialem-ekranu.md)                | Porównanie światów suwakiem podziału ekranu            | przyjęta          |
| [0031](0031-porownanie-rozmiarow-swiatow.md)                       | Porównanie rozmiarów światów: widma z przesuwaniem     | zmieniona (0032)  |
| [0032](0032-gizmo-i-widmo-swiata-odniesienia.md)                   | Gizmo i widmo świata odniesienia w Rozmiarach          | przyjęta          |
| [0033](0033-trasy-po-sieci-waypointow.md)                          | Trasy po sieci waypointów                              | przyjęta          |
| [0034](0034-siec-drog-gothica-3.md)                                | Sieć dróg Gothica 3 ze stref nawigacyjnych             | przyjęta          |
| [0035](0035-animacja-rutyn-po-sieci-drog.md)                       | Animacja rutyn postaci po sieci dróg                   | przyjęta          |
| [0036](0036-motyw-latarnia-w-kopalni.md)                           | Motyw „latarnia w kopalni”                             | zastąpiona (0043) |
| [0037](0037-ksiega-i-karta-wpisu.md)                               | Księga i karta wpisu zamiast panelu wyszukiwania       | przyjęta          |
| [0038](0038-lokacje-i-przejscia-miedzy-swiatami.md)                | Lokacje i przejścia między światami                    | przyjęta          |
| [0039](0039-przewodnik-po-questach.md)                             | Przewodnik po questach                                 | przyjęta          |
| [0040](0040-trasa-przewodnika-po-drogach.md)                       | Trasa przewodnika po drogach i gałęzie alternatywne    | przyjęta          |
| [0041](0041-otwarcie-repozytorium.md)                              | Otwarcie repozytorium i CI bez danych z gry            | przyjęta          |
| [0042](0042-podglad-postaci-skladany-z-czesci.md)                  | Podgląd 3D postaci składany z części                   | przyjęta          |
| [0043](0043-motyw-krag-i-tryb-jasny.md)                            | Motyw „Krąg” i tryb jasny                              | przyjęta          |
| [0044](0044-uklad-krag-kolo-narzedzi-i-tarcza-zegara.md)           | Układ „Krąg”: koło narzędzi i tarcza zegara            | przyjęta          |
| [0045](0045-sterowanie-podgladem-3d-przez-sesje.md)                | Sterowanie podglądem 3D przez sesję, nie event bus     | przyjęta          |
| [0046](0046-naglowki-bezpieczenstwa-i-csp.md)                      | Nagłówki bezpieczeństwa i polityka CSP                 | przyjęta          |
| [0047](0047-makiety-atlas-gothic-w-design-mockups.md)              | Makiety „Atlas Gothic” w osobnej aplikacji             | przyjęta          |
| [0048](0048-motyw-atlas.md)                                        | Motyw „Atlas”: grafit, mosiądz, Cormorant i Inter      | przyjęta          |
| [0049](0049-uklad-atlas-pasek-gorny-i-szyna-narzedzi.md)           | Układ „Atlas”: pasek górny i szyna narzędzi            | przyjęta          |
| [0050](0050-ksiega-z-wierszami-w-stylu-palety.md)                  | Księga: wiersze wyników w stylu palety                 | przyjęta          |
| [0051](0051-linijki-wspolrzednych-w-widoku-2d.md)                  | Linijki współrzędnych w widoku 2D                      | przyjęta          |
| [0052](0052-znaczniki-miejsc-jako-ikony-z-ksztaltem-rodzaju.md)    | Znaczniki miejsc jako ikony z kształtem rodzaju        | przyjęta          |
| [0053](0053-wyszukiwarka-jako-paleta.md)                           | Wyszukiwarka jako paleta, Księga po „Otwórz w Księdze” | przyjęta          |
| [0054](0054-karta-wpisu-jako-panel-przy-prawej-krawedzi.md)        | Karta wpisu jako panel przy prawej krawędzi            | przyjęta          |
| [0055](0055-znaczniki-warstw-danych-w-odznakach.md)                | Znaczniki warstw danych w odznakach                    | przyjęta          |
| [0056](0056-service-worker-nie-zapisuje-html-zamiast-plikow.md)    | Service worker nie zapisuje HTML-a zamiast plików      | przyjęta          |
| [0057](0057-instalacja-service-workera-nie-utyka-na-zlym-pliku.md) | Instalacja service workera nie utyka na złym pliku     | przyjęta          |
| [0058](0058-rozmiary-swiatow-kolory-widocznosc-uklad.md)           | Rozmiary światów: kolory, widoczność i układ           | przyjęta          |
