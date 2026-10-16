# 0014. Produkcja tylko z wydań, po testach

- Status: przyjęta (zmienia proces z [0010](0010-hosting-cloudflare-pages-z-wgrywaniem-lokalnym.md))
- Data: 2026-10-16

## Kontekst

Do tej pory `npm run deploy` wysyłał na produkcję bieżący stan katalogu roboczego, więc każda zmiana
trafiała do użytkowników od razu — także niezacommitowana i nieprzetestowana w przeglądarce.
Produkcja wyprzedziła ostatnie wydanie (v0.1.0) o kilka funkcji, a `CHANGELOG.md` przestał
opisywać to, co faktycznie działa na stronie.

## Decyzja

- **Produkcja = wydanie.** `npm run deploy` (`scripts/deploy-release.mjs`) wdraża tylko commit
  oznaczony tagiem `vX.Y.Z`, przy czystym katalogu roboczym, gdy commit i tag są wypchnięte na GitHuba.
- **Najpierw testy.** Skrypt przed wysyłką uruchamia `check`, `lint`, testy jednostkowe i testy
  w przeglądarce (Playwright); pierwszy błąd przerywa wdrożenie.
- **Podgląd przed wydaniem.** `npm run deploy:preview` wysyła bieżący build na gałąź `podglad`
  Cloudflare Pages: stały adres `https://podglad.gis-of-gothic.pages.dev` (bramka zasobów go
  dopuszcza). Tam sprawdzamy zmiany ręcznie; produkcja się nie zmienia.
- **Bramka zasobów** (`npm run deploy:gate`) to infrastruktura: wdrażamy ją razem z wydaniem albo
  przy zmianie jej konfiguracji (np. nowy dozwolony adres), zawsze zgodnie z `workers/model-gate/`.

Proces wydania: commity → `npm run deploy:preview` i ręczne sprawdzenie → `npm run release` →
`git push --follow-tags origin main` → `npm run deploy`.

## Konsekwencje

- Na produkcji jest zawsze dokładnie jakieś wydanie z `CHANGELOG.md`, możliwe do odtworzenia z repozytorium.
- Commity nadal powstają po każdej zmianie (dla changeloga), ale nie zmieniają strony.
- Adres podglądu jest publiczny dla znających go; jeśli ma być prywatny, w panelu Cloudflare Pages
  można włączyć Cloudflare Access dla wdrożeń podglądu.
