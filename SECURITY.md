# Bezpieczeństwo

## Zgłaszanie podatności

Nie zgłaszaj podatności w publicznym zgłoszeniu. Użyj prywatnego zgłoszenia GitHub: zakładka **Security** →
**Report a vulnerability** w repozytorium.

Odpowiadam najszybciej, jak to możliwe. Zgłoszenie opisz tak, żeby dało się je odtworzyć: wersja aplikacji (stopka
albo `CHANGELOG.md`), adres, kroki i skutek.

## Zakres

Dotyczy kodu aplikacji (`src/`), bramki zasobów (`workers/model-gate/`) i skryptów (`scripts/`). Szczególnie istotne:

- ominięcie bramki zasobów, które pozwoliłoby pobrać modele lub kafle spoza aplikacji
  ([ADR 0012](docs/adr/0012-ochrona-modeli-przedmiotow.md), [ADR 0013](docs/adr/0013-model-swiata-przez-bramke-ion.md)),
- wyciek sekretów (tokenów, kluczy) do kodu strony albo repozytorium.

Poza zakresem: sam fakt, że przeglądarka musi odszyfrować i wyrenderować model, żeby go pokazać.

## Wspierane wersje

Wspierana jest tylko najnowsza wersja z gałęzi `main` (ta, która jest na produkcji).
