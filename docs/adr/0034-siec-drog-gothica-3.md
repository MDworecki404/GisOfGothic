# 0034. Sieć dróg Gothica 3 ze stref i ścieżek nawigacyjnych

Status: przyjęta (uzupełnia ADR 0033)

## Kontekst

ADR 0033 zakładał, że Gothic 3 nie ma sieci dróg, bo nie ma waynetu. Przegląd archiwów gry pokazał inny system
nawigacji: globalną siatkę `navigationmap.xnav` (14,5 MB, własny format, bez widocznych współrzędnych) i strefy
nawigacyjne w sektorach `…NavZones_01…/*.node`. W Myrtanie jest tam 701 stref (`gCNavZone_PS`, wielokąty) i 858 ścieżek
(`gCNavPath_PS`, łamane z promieniem, łączące dwie strefy przez ich identyfikatory).

## Decyzja

- Exporter nie czyta `.xnav`. Buduje z encji stref i ścieżek ten sam zwarty `waypoints.json` co dla G1 i G2:
  węzły to punkty ścieżek (`NAVPATH_<n>_<i>`) i miejsca styku ścieżki ze strefą (`NAVZONE_<n>_<A|B>`), krawędzie to
  kolejne punkty ścieżki, połączenia węzła ze ścieżką i odcinki między wszystkimi węzłami jednej strefy.
- Aplikacja nie zmienia się: ten sam parser, graf i planista. Wynik dla Myrtany: 3338 węzłów, 6123 krawędzie,
  213 KB (55 KB po gzip).

## Konsekwencje

- To **przybliżenie**, nie sieć z gry. Odcinki w obrębie strefy mogą wyjść poza jej obrys, a trasa bywa wyraźnie
  dłuższa niż prosta (skrajne punkty największej składowej: 2,85 km przy ok. 1,6 km w linii prostej).
- Pokrycie jest częściowe: sieć rozpada się na 29 składowych, największa (2289 węzłów) obejmuje ok. 1,8 × 1,5 km
  rejonu Ardei. Do 60 m od niej leży ok. 47% miejsc postaci i 40% przedmiotów, więc w pozostałej części świata
  tryb Trasa mówi, że w pobliżu nie ma dróg z gry (próg z ADR 0033).
- Wysokość węzłów zgadza się z terenem (±2 m) dla 74% z nich; reszta to prawdopodobnie wnętrza i mosty.
- Rozbudowa pokrycia wymaga danych spoza `NavZones` (np. dróg zewnętrznych) albo trasowania po terenie.
