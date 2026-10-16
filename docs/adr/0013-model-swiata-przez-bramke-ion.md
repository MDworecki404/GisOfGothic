# 0013. Model świata przez bramkę do Cesium ion

- Status: przyjęta (uzupełnia [0002](0002-ciezkie-warstwy-na-cesium-ion.md), zastępuje jej część o tokenie w przeglądarce)
- Data: 2026-10-16

## Kontekst

Model świata (3D Tiles na Cesium ion) jest zasobem gry. Dotąd przeglądarka dostawała token ion
w kodzie strony, pytała API ion o adres i token assetu, a potem pobierała kafle z serwerów ion.
Token był ograniczony do domen aplikacji, ale ion sprawdza tylko nagłówek `Referer`, który da się
podrobić — z tokenem ze strony można było pobrać cały świat poza aplikacją.

## Decyzja

- Token ion jest **wyłącznie sekretem Workera** (`CESIUM_ION_SERVER_TOKEN`), nigdy w kodzie strony.
- Bramka zasobów (`workers/model-gate/`, ta sama co dla modeli przedmiotów) ma ścieżkę
  `/ion/<asset>/<plik>`: pobiera z API ion krótkotrwały token assetu (pamięta go do wygaśnięcia),
  pobiera `tileset.json` i kafle z serwerów ion i oddaje je pod własnym adresem. Kafle trzyma pamięć
  podręczna Cloudflare, żeby oszczędzać limit ion.
- Te same zasady co dla modeli (`RequestGuard`): tylko żądania `fetch` z nagłówkiem `Origin`
  dozwolonej strony, bez nawigacji wprost, limit 300 żądań na minutę na adres IP; tylko assety
  z listy `ALLOWED_ION_ASSETS` i ścieżki plików 3D Tiles (bez wychodzenia poza katalog).
- Aplikacja ładuje świat przez `Cesium3DTileset.fromUrl(worldTilesetUrl)`; `worldTilesetUrl`
  w katalogu światów wskazuje bramkę. Przeglądarka nie zna adresów ani tokenów ion.

## Konsekwencje

- Pobranie świata wymaga przejścia przez bramkę (podrobienie `Origin`, limit żądań) — nie wystarczy
  już token skopiowany ze strony. Kafle 3D Tiles nie są szyfrowane: zdeterminowana osoba może je
  zebrać z ruchu sieciowego przeglądarki; pełne szyfrowanie kafli byłoby osobnym, dużym krokiem.
- Token wbudowany w poprzednie wersje strony należy unieważnić, a dla Workera utworzyć nowy
  (zakres `assets:read`, tylko asset świata, bez ograniczeń adresów).
- Nowy świat: asset ID do `ALLOWED_ION_ASSETS` w `wrangler.jsonc` (i wdrożenie Workera) oraz
  `worldTilesetUrl` w katalogu światów.
- Lokalny rozwój korzysta z tej samej bramki (localhost jest na liście dozwolonych stron).
