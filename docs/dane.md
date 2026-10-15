# Dane

Dane jednego świata dzielą się na dwie części:

| Część  | Co                                                           | Gdzie                        | W repo?            |
| ------ | ------------------------------------------------------------ | ---------------------------- | ------------------ |
| Ciężka | model świata (teren, budynki), w przyszłości modele obiektów | Cesium ion, jako 3D Tiles    | nie                |
| Lekka  | `metadata.json`, `search_index.json`, warstwy GeoJSON        | `static/data/<gra>/<świat>/` | nie (`.gitignore`) |

Obie pochodzą z gry i są chronione prawem autorskim, dlatego nie ma ich w repozytorium.
Generuje je osobny projekt ekstrakcji (`python -m gothic_extract.geoportal`) jako paczkę
`dist/<gra>/<świat>/`. Kontrakt paczki (pola, osie, kotwica) opisuje jej własny `README.md`,
kopiowany razem z danymi do `static/data/<gra>/<świat>/README.md`.

## Układ współrzędnych

- Świat gry jest „przyklejony” do globusa w punkcie `metadata.json → anchor` (dla Khorinis lon 0°,
  lat 0°, h 0 m) w skali 1:1. Kotwicy nie wpisujemy w kod — zawsze czytamy ją z `metadata.json`.
- Współrzędne w plikach to WGS84 `[lon, lat, h]`, `h` w metrach nad elipsoidą.
- Teren leży częściowo poniżej 0 m, dlatego globus Cesium jest wyłączony.
- Tileset z ion **nie jest georeferencjonowany**: ion zamienia osie glTF (Wschód, Góra, −Północ)
  na lokalne (Wschód, Północ, Góra) wokół środka Ziemi. `MapService` stawia go w kotwicy macierzą
  `Transforms.eastNorthUpToFixedFrame` — szczegóły w [ADR 0004](adr/0004-tileset-w-kotwicy-enu.md).

## Katalog gier i światów

`src/lib/data/world-catalog.ts` opisuje wszystkie gry i ich światy:

```ts
const KHORINIS: WorldDefinition = {
	id: 'khorinis', // część adresu: /g2nk/khorinis
	gameId: 'g2nk',
	name: 'Khorinis', // nazwa w UI
	dataBaseUrl: '/data/g2nk/khorinis', // lekkie dane
	modelsBaseUrl: 'https://gisofgothicmodels.dworecki.dev/g2nk/khorinis/models', // modele przedmiotów
	worldTilesetIonAssetId: 6033666 // model świata na Cesium ion
};
```

Adres świata to `/<gameId>/<id>`. Strona `/` przekierowuje do świata domyślnego,
a nieznany świat pokazuje stronę błędu 404.

## Jak dodać nowy świat

1. **Wygeneruj paczkę** świata w projekcie ekstrakcji (`dist/<gra>/<świat>/`).
2. **Wgraj model** `world.glb` na [Cesium ion](https://ion.cesium.com) jako _3D Model (tile as 3D Tiles)_.
   Lokalizacji nie ustawiaj — aplikacja sama stawia tileset w kotwicy. Zanotuj asset ID.
3. **Skopiuj lekkie dane** do `static/data/<gra>/<świat>/` — bez `world.glb` i `models/`.
4. **Dodaj wpis** do `WorldCatalog` w `world-catalog.ts` (nowa gra albo nowy świat w istniejącej).
5. **Sprawdź** `npm run dev` → `/<gra>/<świat>`: model widoczny, poprawnie ustawiony, pasek statusu
   pokazuje liczby z indeksu, brak błędów w konsoli.

## Indeks wyszukiwania

`search_index.json` to lista wpisów `item` (przedmiot) i `character` (unikatowa postać) z miejscami
występowania. Typy TS: `src/lib/data/types.ts`. Parsery (`src/lib/data/parsers.ts`) walidują każde
pole i odrzucają błędne dane z komunikatem wskazującym wpis — bez asercji typów.

Znane odstępstwa od kontraktu, które parser dopuszcza:

- `category` bywa `null` (np. `ITFO_MUTTON`) — typ `string | null`.

## Modele przedmiotów

Wpis przedmiotu w `search_index.json` ma pole `model`: ścieżka pliku podglądu względem `modelsBaseUrl`
świata (np. `previews/itpl_perm_herb.glb`) albo `null`, gdy przedmiot nie ma modelu (łuki i kusze `.mms`,
brak wizualizacji w grze). Plik podglądu to **jedna kopia** przedmiotu, wyśrodkowana na początku układu, bez
instancji (inaczej niż pliki `models/*.glb`, które zawierają wszystkie wystąpienia w świecie). Tekstury
leżą w `models/textures/`, a pliki podglądu odwołują się do nich przez `../textures/`.

Modele leżą w buckecie Cloudflare R2 (`gis-of-gothic-models`) pod własną domeną, poza repozytorium i poza
Cesium ion — to małe pliki ładowane pojedynczo. Dostęp z przeglądarki ograniczony jest regułą CORS bucketa
(`localhost` i domena aplikacji). Wgrywa je `node scripts/upload-models-to-r2.mjs <folder> <bucket> <prefiks>`
(wymaga `npx wrangler login`). Karta przedmiotu nie linkuje do pliku `.glb` (nie zachęcamy do pobierania), ale pokazuje podgląd 3D
(`ModelPreview`, osobny `CesiumWidget` bez globusa), który ładuje model z `SearchEntryDetails.modelUrl`.
Przeglądarka musi pobrać plik, żeby go narysować, więc adres widać w narzędziach deweloperskich.
