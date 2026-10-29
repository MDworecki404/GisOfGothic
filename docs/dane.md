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
	modelNamespace: 'g2nk/khorinis', // przestrzeń nazw chronionych modeli
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g2nk/khorinis/items', // bramka modeli (ADR 0012)
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6033666/tileset.json' // model świata z ion przez bramkę (ADR 0013)
};
```

Adres świata to `/<gameId>/<id>`. Strona `/` przekierowuje do świata domyślnego,
a nieznany świat pokazuje stronę błędu 404.

## Jak dodać nowy świat

Tak dodano Górniczą Dolinę (`/g2nk/gornicza-dolina`, asset ion 6044750) i Jarkendar (`/g2nk/jarkendar`,
świat 6045115, voby 6045113) oraz Irdorath (`/g2nk/irdorath`,
świat 6047295, voby 6047297). Gothica 1 dodano jednym ruchem (pięć światów w grze `g1`: `kolonia`,
`wolna-kopalnia`, `stara-kopalnia`, `cmentarzysko-orkow`, `swiatynia-orkow`, po dwa assety ion na świat). Bramka
zasobów przepuszcza podglądy przedmiotów ze ścieżek `/g1/…` i `/g2nk/…`.

1. **Wygeneruj paczkę** świata w projekcie ekstrakcji (`dist/<gra>/<świat>/`, ten sam kontrakt co Khorinis).
2. **Wgraj model** `world.glb` na [Cesium ion](https://ion.cesium.com) jako _3D Model (tile as 3D Tiles)_.
   Lokalizacji nie ustawiaj — aplikacja sama stawia tileset w kotwicy. Zanotuj asset ID i dodaj asset
   do zasobów tokenu bramki na ion. **Zapis zmiany regeneruje token** (stary ciąg przestaje działać), więc zaraz po zapisie
   wstaw nowy do `.env` → `CESIUM_ION_SERVER_TOKEN` i `npx wrangler secret put CESIUM_ION_SERVER_TOKEN` w `workers/model-gate`;
   do tego czasu produkcyjna mapa nie ładuje kafli.
3. **Dopuść asset w bramce:** `ALLOWED_ION_ASSETS` w `workers/model-gate/wrangler.jsonc`, potem `npm run deploy:gate`.
4. **Skopiuj lekkie dane** do `static/data/<gra>/<świat>/` — bez `world.glb` i `models/`.
5. **Zaszyfruj i wgraj podglądy przedmiotów** z przestrzenią `<gra>/<świat>` (docs/rozwoj.md, „Modele przedmiotów”).
6. **Dodaj wpis** do `WorldCatalog` w `world-catalog.ts`: `id`, `name`, `localCoordinateSystemName`,
   `dataBaseUrl`, `modelNamespace`, `protectedModelsUrl`, `worldTilesetUrl` i `staticObjectsTilesetUrl`
   (bramka `/ion/<asset>/tileset.json`; drugi adres to `vobs.glb` świata wgrany na ion jako osobny asset,
   oba assety trzeba dopuścić w `ALLOWED_ION_ASSETS`).
   Przełącznik światów w pasku górnym (lista gier, po najechaniu albo stuknięciu lista ich światów) pokaże go sam.
7. **Sprawdź** `npm run deploy:preview` → `https://podglad.gis-of-gothic.pages.dev/<gra>/<świat>`: model
   poprawnie ustawiony, znaczniki na terenie, podglądy przedmiotów, brak błędów w konsoli. Na produkcję
   świat trafia z najbliższym wydaniem.

## Archolos (Kroniki Myrtany)

Gra `archolos` to modyfikacja Gothica 2 NK (silnik ZenGin, te same układy plików, osie i kotwica) z pięcioma światami:
`archolos` (kontynent), `finalowy-etap`, `kanaly`, `srebrna-kopalnia` i `volfzacke`. Ich definicje (nazwy robocze, bo mod
nie nadaje nazw światom) zapisuje `ARCHOLOS_WORLD_SPECIFICATIONS` w `world-catalog.ts`; nazwę zmienia się w jednym miejscu.
Paczki v4 leżą w `static/data/archolos/<świat>/`, kotwica jest wspólna, więc światy ogląda się osobno. Różnice względem G2 NK:

- rozdziały ma tylko kontynent (`hasChapters`); w pozostałych czterech światach UI ukrywa wybór rozdziału;
- nazwy gildii wyłącznie z `metadata.guild_names` (kody G2 w nowych znaczeniach, np. `HUMAN` → „Paladyn”), także dziwne
  (`BLOODFLY_RUNE` → „Z”, `YOUNGTROLL` → „Strażnik”); `ARENASNAKE` nie ma nazwy i wyświetla się jako kod;
- brak `description` przedmiotów: lista pokazuje nazwę ogólną, kategorię i kod;
- wpis przedmiotu bez nazwy i bez kodu (jeden w kontynencie) `parseSearchIndex` pomija;
- bez losowego łupu; modele jak w G2 NK (skrzynie i obiekty MDS/ASC bez podglądu);
- ion: `world.glb` i `vobs.glb` każdego świata to osobne assety, dopuszczone w `ALLOWED_ION_ASSETS`.

## Gothic 3 (Myrtana)

Gra `g3` ma jeden świat `myrtana` (cały kontynent; nazwa robocza). Kod jest w `src/lib/data/world-catalog.ts`,
ale świat trafia do katalogu dopiero po wpisaniu identyfikatorów assetów ion w `MYRTANA_ION_ASSETS`
(`world.glb` ok. 152 MB wgrywany jak w „Jak dodać nowy świat”; `vobs.glb` ok. 376 MB ion odrzucił, więc dzielimy go
`node scripts/split-vobs-glb.mjs <vobs.glb> <folder> 4` i wgrywamy części jako osobne assety, [ADR 0023](adr/0023-voby-dzielone-na-kilka-assetow-ion.md); wszystkie dopuścić
w `ALLOWED_ION_ASSETS`). Różnice względem G1/G2, które obsługuje aplikacja:

- brak rozdziałów (`WorldDefinition.hasChapters: false` ukrywa wybór rozdziału);
- stronnictwa zamiast gildii: kody bez polskiej nazwy (`OUT`, `SLAVE`) pokazujemy jako kod;
- godziny rutyn są robocze (`hasApproximateRoutineTimes`), karta oznacza je „orientacyjnie”;
- losowy łup: `treasure_sets.json`, pole `treasure_sets` w skrzyniach i postaciach, `loot` i miejsca `set`
  w indeksie ([ADR 0022](adr/0022-losowy-lup-gothic-3.md));
- `quests.json` ma rolę postaci `target` (cel zadania);
- skrzynie mają podgląd 3D (`model` w `containers.geojson`), widoczny w karcie skrzyni;
- kolory kafli są rozjaśnione: `WorldDefinition.tileColorGrade` (gamma 0,72, nasycenie 1,25, jasność 1,15) nakłada shader `TileColorGrader`
  (`services/map/`) na teren i obiekty; inne światy mają `null` i zostają bez korekty;
- kody mają oryginalną wielkość liter, a wiele przedmiotów ma wspólną nazwę (np. „Amulet”), więc odróżnia je kod.

## Indeks wyszukiwania

`search_index.json` to lista wpisów `item` (przedmiot), `character` (unikatowa postać) i `quest` (temat dziennika)
z miejscami występowania. Typy TS: `src/lib/data/types.ts`. Parsery (`src/lib/data/parsers.ts`) walidują każde
pole i odrzucają błędne dane z komunikatem wskazującym wpis — bez asercji typów.

Wpis `quest` jest lekki: `giver` (imię zleceniodawcy albo `null`, gdy exporter nie jest pewny), `chapter` (rozdział
startu albo `null`, ok. 55% questów) i miejsca z polem `role` (`giver` / `target` / `stage`), których kolor na mapie
zależy od roli. Pełne etapy dziennika, postacie, przedmioty i nagrody są w osobnym pliku `quests.json`
(paczka v4) wczytywanym dopiero przy otwarciu karty questa ([ADR 0017](adr/0017-szczegoly-questow-ladowane-leniwie.md)).
`parseQuestCatalog` (`src/lib/data/quest-parsers.ts`) zostawia `entryId` tylko tam, gdzie postać albo przedmiot ma wpis
w indeksie (`in_index`), pomija nieznane role i dopuszcza questy bez etapów, postaci i nagrody.

`metadata.json` paczki v4 ma też `guild_names`: kod gildii → polska nazwa z tabeli TXT_GUILDS gry, tylko dla gildii występujących
w świecie ([ADR 0018](adr/0018-nazwy-gildii-z-danych-swiata.md)). Kody bywają aliasami o tej samej wartości (`HUMAN` to w G2 paladyn, a w G1 magnat),
dlatego nazwa zależy od świata, a nie od samego kodu; `NONE` aplikacja pokazuje jako „Bez gildii”. Parser czyta `game` (`g2nk`, `g1`) z tego samego pliku.

`metadata.json` paczki v4 ma `movement_speeds_m_s` (`walk`, `run`, `sneak`, `walk_armed` w m/s); parser zwraca je jako
`MovementSpeeds` albo pomija pole, gdy brak go lub jest niepełne. Aplikacja używa ich w czasie przejścia w narzędziu Pomiary.

Znane odstępstwa od kontraktu, które parser dopuszcza:

- Warstwa przedmiotów w świecie (`items.geojson`) bywa z obiektami bez instancji (pusty `code`, `name: null`): kilka w ZEN-ach
  Gothica 1 (Kolonia 2, Świątynia orków 1). `omitItemPlaceholders` pomija je przed parsowaniem, bo inaczej jeden taki obiekt
  przerywa wczytanie całej warstwy.
- `category` bywa `null` (np. `ITFO_MUTTON`) — typ `string | null`.
- Kamienne tablice z dodatku mają w danych jedną nazwę („Kamienna tablica”); atrybut i stopień wynikają
  z kodu (`ITWR_STRSTONEPLATE2_ADDON`). `StonePlateNameResolver` (`src/lib/data/stone-plate-names.ts`)
  składa z niego nazwę, np. „Kamienna tablica siły II”, przy parsowaniu indeksu, warstwy przedmiotów
  i zawartości skrzyń, oraz podaje wyszukiwarce słowa kluczowe (`siła`, `zręczność`, `jednoręczna`…).

## Opis przedmiotu (`description`)

Wiele przedmiotów ma w grze tę samą ogólną nazwę (`name`: „Mikstura”, „Zwój”, „Pierścień”, „Klucz”), a różni je opis ze
skryptów (`description`: „Esencja lecznicza”). Paczka może go podać jako **opcjonalne** pole przy przedmiocie: we wpisie
`search_index.json`, w `items.geojson`, w liniach `contents` (`containers.geojson`) i `inventory` (`npcs.geojson`,
`characters.geojson`), w `items` z `treasure_sets.json` oraz w `items` z `quests.json`. Aplikacja pokazuje wtedy opis jako
nazwę, a ogólną nazwę zostawia w wyszukiwaniu ([ADR 0025](adr/0025-opis-przedmiotu-jako-nazwa-widoczna.md)).

Do zrobienia w ekstraktorze: w G1 i G2 pole `description` instancji przedmiotu (`C_ITEM.description`), np. `ITPO_HEALTH_01`
→ „Esencja lecznicza”; w G3 pierwszy tekst opisujący przedmiot, jeśli różni się od `name` (do sprawdzenia, bo duplikatów
„Amulet”, „Pierścień” i „Kostur maga” nie rozróżnia nic poza kodem). Wartość pusta albo równa `name` można pominąć.

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
