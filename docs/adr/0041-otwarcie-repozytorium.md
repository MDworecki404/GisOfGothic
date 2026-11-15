# 0041. Otwarcie repozytorium i CI bez danych z gry

Status: przyjęta.

## Kontekst

Repozytorium ma stać się publiczne. Zasoby gry nie mogą trafić do repozytorium ani być do pobrania (ADR 0012), a token
Cesium ion jest sekretem bramki (ADR 0013). Przegląd przed otwarciem (2026-11-15) wykazał:

- historia (232 commity, 2,3 MiB) nie zawiera danych z gry (`static/data/` jest w `.gitignore`), dużych plików ani
  sekretów (skan wzorców tokenów i kluczy); `.env` nie jest śledzony, `.env.example` ma puste wartości,
- `LICENSE` (MIT, tylko kod) i zastrzeżenie praw do zasobów gry są w `README.md`,
- czysty klon bez danych przechodzi `check`, `lint`, wszystkie testy jednostkowe i `build`.

## Decyzja

- Dodajemy `CONTRIBUTING.md` (zasady wkładu, zakaz dodawania zasobów gry) i `SECURITY.md` (prywatne zgłoszenia
  podatności przez GitHub), a w `package.json` pola `repository`, `homepage` i `bugs`.
- CI (`.github/workflows/ci.yml`) uruchamia `check`, `lint`, `test` i `build`. Nie puszcza `test:e2e`, bo wymaga
  lokalnych danych z gry, i niczego nie wdraża: dane i klucz modeli nie trafiają do GitHuba, więc wdrożenia
  zostają lokalne z wydania (ADR 0010, 0014).
- Pozycja „dane do R2 w CI” z listy pomysłów odpada: wgrywanie zaszyfrowanych modeli wymaga danych z gry,
  których nie wolno trzymać w repozytorium ani w jego sekretach.

## Konsekwencje

- Pull request jest sprawdzany tym samym, co lokalny hook `pre-commit`, poza testami e2e.
- Regresje widoczne tylko w e2e wychodzą dopiero przy wydaniu (`publish-release` puszcza e2e przed wdrożeniem).
- Wszystkie commity mają adres e-mail autora w historii; jego ukrycie wymagałoby przepisania historii, więc decyzja
  należy do autora.
