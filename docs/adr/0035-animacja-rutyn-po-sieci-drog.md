# 0035. Animacja rutyn postaci po sieci dróg

Status: przyjęta

## Kontekst

Warstwa „Postacie o tej porze” pokazywała, gdzie postacie są o wybranej godzinie, ale przy zmianie godziny punkty skakały
z miejsca na miejsce. Dane rutyn (`character_places.geojson`) mają miejsca z przedziałami godzin, a ok. połowa postaci
zmienia miejsce w ciągu doby (Khorinis 93 z 187, Kolonia 81 ze 133). Mamy sieć dróg z gry (ADR 0033, 0034) i prędkość
marszu bohatera z metadanych świata. Przedziały godzin jednej postaci składają się w ciągłą dobę dla 98% postaci
w Khorinis i Kolonii, ale tylko dla 25% w Gothicu 3, gdzie godziny są orientacyjne.

## Decyzja

- **Oś czasu postaci** (`CharacterTimeline`) powstaje z domyślnych miejsc rutyny tablicą 1440 minut: minuta objęta kilkoma
  przedziałami należy do pobytu o późniejszym początku, minuta bez przedziału zostaje przy ostatnim znanym miejscu, a kolejne
  minuty tego samego miejsca łączą się w jeden pobyt. Przedział z początkiem równym końcowi to cała doba.
- **Ruch po drogach.** Przejście z pobytu do pobytu zaczyna się o początku nowego pobytu. `RoutineMovementPlanner` wyznacza
  drogę przez `RoutePlanner` (ADR 0033), a czas marszu to długość drogi z dojściem przez prędkość marszu i 4 s rzeczywiste
  na minutę gry. `RoutineAnimator` liczy pozycję postaci w danej minucie: stoi albo idzie po drodze.
- **Bez drogi postać skacze:** gdy brak sieci świata albo miejsce leży za daleko od drogi, nowe miejsce pojawia się o godzinie
  przejścia. Panel pokazuje, ile postaci idzie drogami, a ile skacze.
- **Marsz dłuższy niż pobyt:** następny pobyt zaczyna się od miejsca docelowego poprzedniego (uproszczenie).
- **Odtwarzanie** (`RoutinePlayback`): pętla `requestAnimationFrame` w trzech tempach (0,25 / 4 / 60 minut gry na sekundę),
  aktualizacja co najmniej co 50 ms (20 Hz), pojedyncza klatka liczy się za najwyżej 100 ms. Zatrzymuje je przeciągnięcie
  suwaka, ukrycie warstwy, zmiana świata i zamknięcie narzędzia Czas.
- **Wydajność:** `DataLayersRenderer.moveLayerPoints` przesuwa istniejące billboardy, gdy zmieniają się tylko pozycje
  (`DataLayerShapeComparer`), zamiast przebudowywać warstwę przy każdej aktualizacji. Pomiar w przeglądarce: ok. 61 FPS przy
  najszybszym tempie i 187 postaciach.
- Drogi liczą się leniwie, porcjami po 25 postaci, przy pierwszym „Odtwórz” w świecie; wynik starszego żądania jest pomijany.

## Konsekwencje

- Rutyny inne niż domyślne i zachowania poza rutyną nie są animowane.
- W Gothicu 3 animacja jest przybliżona: godziny są orientacyjne, a sieć dróg obejmuje tylko część świata.
- Stan odtwarzania nie trafia do adresu ani do zakładek.
