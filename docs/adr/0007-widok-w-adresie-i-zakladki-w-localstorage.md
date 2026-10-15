# 0007. Widok w adresie URL i zakładki w localStorage

Status: przyjęta

## Kontekst

Aplikacja nie ma logowania ani serwera (statyczna strona, [ADR 0005](0005-swiat-w-adresie-i-katalog-swiatow.md)),
a użytkownicy chcą wracać do miejsc i wysyłać je innym. Adres miał już parametr `wpis`; brakowało kamery
i narzędzia oraz miejsca na własne, nazwane widoki.

## Decyzja

- Widok = wybrany wpis + kamera + otwarte narzędzie. Opisują go parametry adresu `wpis`, `widok`,
  `narzedzie`; parametry o wartościach domyślnych są pomijane.
- Kamera w adresie to pozycja w ramie świata (metry od kotwicy E, N, H, zaokrąglone do 0,1) i kąty
  kierunku oraz nachylenia (`widok=581.8_200.9_350_45_-50`). Nie używamy współrzędnych globusa ani
  ECEF, bo kotwica świata jest dowolna, a metry od kotwicy są też tym, co pokazuje pasek przyrządu.
- Strona nie zna nazw parametrów: przekazuje fasadzie `location.search` (`openSharedView`) i dopisuje do
  adresu `AppState.sharedViewQuery`. Kodowanie i dekodowanie robi `ViewLinkCodec` w logice.
- Zakładki trafiają do `localStorage` jako jedna lista JSON, odczytywana z walidacją każdego pola.
  Niedostępna pamięć nie przerywa działania — pokazujemy ostrzeżenie. Zakładka przechowuje ten sam
  widok co link, więc „Kopiuj link” składa adres z tych samych parametrów.

## Konsekwencje

- Zakładek nie widać na innych urządzeniach ani w innych przeglądarkach; do przeniesienia służy link.
- Zmiana formatu `widok` łamie stare linki — nowy format wymaga nowego parametru albo wersji w wartości.
- Adres zmienia się po każdym zatrzymaniu kamery (`replaceState`, bez wpisów w historii).
