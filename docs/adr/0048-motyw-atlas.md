# 0048. Motyw „Atlas”: grafit, mosiądz, Cormorant i Inter

- Status: przyjęta (zastępuje paletę, pismo i kształt płyt z ADR 0043; tryby jasny i ciemny oraz `ThemeCoordinator` zostają)
- Data: 2026-11-17

## Kontekst

Makiety `design-mockups/` (ADR 0047) pokazały kierunek „Modern Fantasy Cartography”: grafit i ciemny kamień,
mosiądz jako akcent, atlas zamiast mchu. Właściciel wybrał go do wdrożenia w całej aplikacji. Wdrożenie idzie
etapami, każdy w osobnym commicie: (1) tokeny i kształt płyt, (2) układ powłoki (pasek górny, szyna narzędzi,
panele), (3) wyszukiwarka i panel szczegółów, (4) nakładki mapy.

## Decyzja (etap 1)

- **Paleta** zostaje pod starymi nazwami tokenów (łupek, woda, popiół, żar, bariera…), więc komponenty się nie
  zmieniają. Ciemny: łupek `#1f2327`, woda `#121a1d`, krawędź `#121416`, popiół `#ece6d6`, żar (mosiądz) `#c4a15f`,
  bariera `#8fb0c9`. Jasny: łupek `#f1ede2`, woda `#b6c4c2`, popiół `#1b1d1a`, żar `#7a5c1c`, bariera `#2f5f7a`.
- **Role:** `--active`, `--hover` i `--ring` używają mosiądzu; `bariera` zostaje przygaszonym błękitem tylko dla
  obiektów wybranych na mapie i pomiarów, żeby warstwy na mapie nadal dało się rozróżnić.
- **Pismo:** Cormorant (nagłówki, nazwy, waga 600) i Inter (reszta), oba z `@fontsource-variable`. Uncial Antiqua
  i Lexend znikają.
- **Kształt:** płyty mają promień 9 px i podwójną linię wewnątrz (cień i dwie obwódki, bez gradientu), przyciski
  4 px, chipy zostają pigułkami. Poświaty zamieniono na jednopikselowe obwódki.
- `MAP_PALETTE` i kolory przeglądarki (`theme-color`, ekran startowy) dostosowano do nowej palety; testy kontrastu
  i zgodności `MAP_PALETTE` z tokenami zostały.

## Konsekwencje

- Ikony PWA (`static/icons`) nadal mają starą paletę; do przemalowania.
- Układ ekranu (koło narzędzi z ADR 0044) zostaje do etapu 2.
- Service worker trzyma zapisaną powłokę: po zmianie motywu trzeba odświeżyć lub wyrejestrować worker, żeby
  zobaczyć nowe style w trybie deweloperskim.
