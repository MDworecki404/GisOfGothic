# 0059. Domena gisofgothic.app

Status: przyjęta (zastępuje adres z [ADR 0010](0010-hosting-cloudflare-pages-z-wgrywaniem-lokalnym.md))

## Kontekst

Aplikacja działała pod `gisofgothic.dworecki.dev`, czyli pod subdomeną strony autora.

## Decyzja

- Adres główny to `https://gisofgothic.app` (domena własna projektu Pages `gis-of-gothic`).
- Bramka modeli ma w `ALLOWED_ORIGINS` nowy adres oraz — na czas przejścia — stary.
  `ION_REFERER` wskazuje nowy adres.
- Stary adres warto przekierować na nowy (301) i po okresie przejściowym usunąć z `ALLOWED_ORIGINS`.

## Konsekwencje

- Zapisane w przeglądarce dane użytkowników (zakładki, ustawienia) są przypisane do origin, więc pod nowym
  adresem zaczynają od zera — pomaga eksport i import kopii zapasowej.
