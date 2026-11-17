# 0053. Wyszukiwarka jako paleta, Księga po „Otwórz w Księdze”

- Status: przyjęta (zmienia przepływ z ADR 0037 i 0050: wybór wyniku nie otwiera już Księgi)
- Data: 2026-11-17

## Kontekst

W makiecie „Atlas Gothic” (ADR 0047) wyszukiwarka to paleta: krótkie okno z wynikami, które po wyborze zamyka się
i pokazuje kartę wpisu przy mapie. W aplikacji wybór wyniku zostawiał użytkownika w dużym oknie Księgi.

## Decyzja

- Narzędzie `search` bez wybranego wpisu otwiera **paletę**: okno 40 rem od góry z polem, chipami rodzaju,
  filtrami i wynikami **pogrupowanymi według rodzaju** (Lokacje, Postacie, Przedmioty, Questy; przy konkretnym
  filtrze rodzaju lista płaska) oraz podpowiedzią skrótów. Ta sama klasa `BookSearch` obsługuje oba tryby
  (`mode="palette"` albo `book`).
- Wybór wyniku (kliknięcie albo `Enter`) zaznacza wpis i **zamyka paletę**; karta wpisu zostaje przy mapie
  (`EntrySummaryCard`). Przycisk „Otwórz w Księdze” otwiera pełną Księgę z listą i kartą (podgląd 3D, powiązania).
- Adres z `narzedzie=search&wpis=…` nadal otwiera Księgę od razu. Układ okna (paleta albo Księga) ustala się przy
  otwarciu i nie zmienia w trakcie zamykania.

## Konsekwencje

- Wyszukiwanie to jeden krok mniej do mapy, ale pełna karta wymaga drugiego kliknięcia.
- Testy e2e, które oglądały kartę w Księdze, klikają teraz „Otwórz w Księdze”.
