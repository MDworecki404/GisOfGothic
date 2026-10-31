# 0027. Myrtana: voby w jednym assecie ion, nowy eksport

Status: przyjęta (zastępuje [ADR 0023](0023-voby-dzielone-na-kilka-assetow-ion.md) dla Myrtany)

## Kontekst

ADR 0023 dzielił `vobs.glb` Myrtany na 4 części, bo ion odrzucił cały plik. Ekstraktor poprawił błędy modeli
(tryb alfa z shadera materiału, kolor i meshe wody, 74 zepsute nazwy materiałów) i wygenerował `G3_Vobs_Full`
(ok. 370 MB), który ion tym razem przyjął jako jeden asset. Równolegle poprawiono teren Kolonii Karnej
(`world.glb` bez 32 565 wielokątów, których gra nie rysuje).

## Decyzja

- Myrtana: teren `6104039`, voby `6104032` (jeden asset); stare `6088791` i części `6088864`, `6088836`,
  `6088838`, `6088842` zostają w bramce do końca weryfikacji.
- Kolonia Karna: teren `6104037`; voby `6067768` bez zmian.
- Lista `staticObjectsTilesetUrls` zostaje listą (jeden element); `scripts/split-vobs-glb.mjs` zostaje w repozytorium,
  ale nie jest używany dla Myrtany.

## Konsekwencje

- Nowe identyfikatory trzeba dopuścić w `ALLOWED_ION_ASSETS` i w zasobach tokenu ion (robi to właściciel konta).
- Po weryfikacji można usunąć stare ID z bramki i stare assety z ion.
