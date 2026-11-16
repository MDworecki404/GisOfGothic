# Sterowanie podglądem 3D — plan

Projekt: `docs/superpowers/specs/2026-11-16-sterowanie-podgladem-3d-design.md`.

1. `PreviewCameraMath` + test jednostkowy (`services/map/preview-camera-math.ts`).
2. `ModelPreview`: stan kamery, gesty, polecenia (`tilt`, `zoom`, `resetView`, `setAutoRotation`, `refreshSize`).
3. `ModelPreviewControlsState` (`state/`) i `ModelPreviewSession` (`services/map/`); fasada zwraca sesję.
4. `ModelPreviewFrame.svelte` w `BookEntry` i `IdentifyCard`.
5. e2e paska narzędzi, dokumentacja (architektura, rozwój, ADR 0045).
6. check, lint, test, build, e2e; commit `feat:`.
