# 0055. Znaczniki warstw danych w odznakach

- Status: przyjęta (uzupełnia ADR 0052, który zostawił warstwy danych bez zmian)
- Data: 2026-11-17

## Kontekst

Znaczniki warstw danych (przedmioty, skrzynie, postacie, questy, lokacje) były samymi konturowymi ikonami kategorii
z ciemną obwódką. Makieta „Atlas Gothic” (ADR 0047) osadza ikonę w odznace: lokacje w rombie, pozostałe rodzaje w kole.

## Decyzja

- `DataLayersRenderer.buildIconImage` rysuje odznakę pod ikoną: koło (domyślnie) albo romb dla ikon `location` i
  `passage`. Odznaka ma ciemne półprzezroczyste wypełnienie i obwódkę w kolorze warstwy (albo szarą dla „ducha”
  zasłoniętego przez teren); ikona jest pomniejszona w jej wnętrzu. Rozmiar billboardu to 28 px.
- Cache obrazów po parze ikona–kolor zostaje, więc koszt rysowania się nie zmienia.

## Konsekwencje

- Rodzaj punktu widać po kształcie i ikonie, nie tylko po kolorze.
- Gęste skupiska (np. pola ziół) zajmują nieco więcej miejsca niż same ikony.
