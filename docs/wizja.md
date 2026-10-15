# Wizja: GIS of Gothic

## Koncepcja

Wiki Gothica jest tekstowe — zrzut ekranu nie pokazuje, gdzie dokładnie coś leży ani jak tam dojść.
GIS of Gothic to **trójwymiarowa wikipedia świata Gothic**: przedmioty, postacie, a później questy
i lokacje pokazane na modelu 3D świata gry.

Zakres gier: Gothic 1 i Gothic 2: Noc Kruka, w przyszłości modyfikacje i Gothic 3.

Kamień milowy: dorównać zakresem [Gothicpedii](https://gothic.fandom.com/pl/wiki/Gothic_i_ArcaniA)
(postacie, lokacje) — w formie 3D.

## Założenia

- **Bez logowania.** Ewentualnie kiedyś Firebase, ale na razie nie ma do czego.
- **Przełączanie gier i światów**, np.:
  - Gothic 1: Górnicza Dolina, Stara Kopalnia, Cmentarzysko Orków, …
  - Gothic 2 NK: Khorinis, Górnicza Dolina, Jarkendar, Dwór Irdorath, …
  - kolejne części i modyfikacje według tego samego schematu.
- **Rodzaje danych**: na start przedmioty i unikatowe postacie, później questy (i lokacje).
  Każdy rodzaj ma własne typy.
- **Wydajność**: kod nie może zamulać aplikacji.
- **UX/UI**: wygodne w przeglądarce na komputerze i telefonie; aplikacja **PWA**.

## Konsekwencje dla architektury

- Hierarchia danych: **gra → świat → warstwy danych** (przedmioty, postacie, questy…). Identyfikator
  świata (np. `g2nk/khorinis`) jest częścią adresu URL, żeby dało się linkować do świata i wpisu.
- Każdy świat to osobna paczka danych o tym samym kontrakcie; lista gier i światów w jednym katalogu
  (manifeście), a nie w kodzie.
- Rodzaje danych jako osobne moduły (typy, parser, warstwa na mapie, widok szczegółów) dopinane do
  wspólnych interfejsów, żeby dodanie questów nie wymagało zmian w reszcie.
- Ciężkie modele 3D z Cesium ion (3D Tiles), dane lekkie (indeksy, GeoJSON) statycznie i w cache PWA.
- Wydajność: wczytywanie leniwe per świat, wyszukiwanie (MiniSearch) poza głównym wątkiem
  przy dużych indeksach, sprzątanie zasobów Cesium przy zmianie świata.
