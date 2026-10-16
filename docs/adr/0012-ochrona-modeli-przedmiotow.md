# 0012. Ochrona modeli przedmiotów przed pobraniem

- Status: przyjęta
- Data: 2026-10-16

## Kontekst

Modele 3D i tekstury należą do Piranha Bytes i THQ Nordic. Aplikacja pokazuje podgląd przedmiotu,
ale nie może ułatwiać pobierania zasobów gry. Bucket R2 z modelami miał publiczny adres: każdy mógł
pobrać spis wszystkich plików (`index.json`), podglądy, osobne tekstury, a nawet pełne modele obiektów
świata, których aplikacja nie używa — zwykłym `curl`, bez żadnych nagłówków.

Ograniczenie zasadnicze: wszystko, co przeglądarka wyświetla, musi do niej dotrzeć w postaci dającej
się odczytać. Zabezpieczenie nie do obejścia nie istnieje (np. zrzut z karty graficznej); celem jest
maksymalne utrudnienie i brak jakiejkolwiek „otwartej” drogi.

## Decyzja

- **Szyfrowanie:** `scripts/protect-item-models.mjs` wbudowuje tekstury w GLB, dokleja wymiary
  i szyfruje plik AES-GCM (`ProtectedModelCodec`, format `GGM1` + IV + szyfrogram).
- **Brak spisu i czytelnych nazw:** nazwa pliku to HMAC logicznej ścieżki modelu
  (`g2nk/khorinis/items/<32 znaki hex>.bin`); bez klucza nie da się zgadnąć nazw ani złożyć listy.
- **Bramka zamiast publicznego bucketu:** bucket nie ma publicznego adresu. Pliki wydaje Worker
  `gis-of-gothic-model-gate` (`workers/model-gate/`): tylko zaszyfrowane pliki o nazwie z HMAC,
  tylko żądania `fetch` z nagłówkiem `Origin` dozwolonej strony aplikacji (nie nawigację wprost),
  z limitem 60 żądań na minutę na adres IP. Spisy, tekstury i modele świata są nieosiągalne.
- **Odszyfrowanie tylko w pamięci:** aplikacja pobiera zaszyfrowany plik, odszyfrowuje go
  WebCrypto i przekazuje do Cesium przez `InMemoryModelResource` — odszyfrowany model nie ma
  żadnego adresu (ani sieciowego, ani `blob:`), który dałoby się otworzyć i zapisać.
- **Klucz** (`PUBLIC_MODEL_KEY`) jest w `.env`, poza repozytorium; trafia do zbudowanej strony.
- Service worker nie zapisuje modeli (adres bramki jest obcy), w pamięci przeglądarki zostają
  tylko zaszyfrowane pliki.

## Konsekwencje

- „Zapisz jako”, karta Sieć w narzędziach deweloperskich, pamięć przeglądarki czy `curl`
  dają tylko zaszyfrowane pliki o losowych nazwach.
- Zdeterminowana osoba z umiejętnościami programistycznymi nadal może wydobyć klucz z kodu strony
  albo przechwycić dane z karty graficznej — tego nie da się wykluczyć w przeglądarce.
- Model świata na Cesium ion nie jest objęty tym mechanizmem (kafle 3D Tiles pobiera Cesium
  z serwerów ion); token ion jest ograniczony do domen aplikacji — osobna decyzja.
- Nowe modele: `protect-item-models.mjs` → `upload-models-to-r2.mjs` (prefiks `<gra>/<świat>/items`).
  Zmiana klucza wymaga ponownego zaszyfrowania i wgrania wszystkich modeli.
- Nowy adres aplikacji trzeba dopisać do `ALLOWED_ORIGINS` w `workers/model-gate/wrangler.jsonc`
  i wdrożyć Worker (`npx wrangler deploy` w tym katalogu).
