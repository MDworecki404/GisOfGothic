# 0058. Rozmiary światów: prawdziwe kolory, widoczność i układ

- Status: przyjęta (rozszerza ADR 0031 i 0032)
- Data: 2026-11-18

## Kontekst

Narzędzie Rozmiary zabarwiało każdy świat jedną barwą (ADR 0032), co ułatwia ich rozróżnienie, ale utrudnia ocenę
rzeczywistego wyglądu, np. zalesienia czy zabudowy. Światy nie dawały się chować bez odznaczenia (czyli rozładowania),
a ustawianie porównania wymagało ręcznych pól liczbowych dla każdego świata.

## Decyzja

- **Prawdziwe kolory:** przełącznik w panelu zeruje uniform `u_tintStrength` shadera widma (`GhostWorldShaderBuilder`),
  więc model ma swoje kolory. Przy pierwszym włączeniu nieprzezroczystość rośnie do 85%, o ile użytkownik sam jej nie
  ustawił. Kropki przy nazwach zostają w barwach światów jako identyfikatory.
- **Nieprzezroczystość:** suwak 10–100% (`setBaseOpacity`); światy wyróżnione zostają co najmniej tak wyraźne jak zwykle.
- **Widoczność:** oko przy każdym wczytanym świecie i przycisk dla otwartego świata ustawiają `Cesium3DTileset.show`.
  Świat zostaje w pamięci, więc ponowne pokazanie jest natychmiastowe; ukryty nie jest wybierany myszą i nie ma
  gizma. „Pokaż tylko otwarty świat” i „Pokaż wszystkie światy” działają jednym przyciskiem.
- **Układ:** `WorldArrangementCalculator` (czysta klasa) ustawia wczytane światy współśrodkowo, od wspólnego
  południowo-zachodniego narożnika (od razu widać, który wystaje na wschód i północ) albo w rzędzie na wschód od
  otwartego świata ze stałym odstępem.
- Pola położenia pokazują się tylko dla wybranego świata, a pod nim jest proporcja powierzchni względem otwartego.
- Wygląd (kolory, nieprzezroczystość, widoczność) jest sesyjny i wraca do domyślnego po zamknięciu narzędzia albo zmianie
  otwartego świata, jak reszta stanu narzędzia.

## Konsekwencje

- W trybie prawdziwych kolorów światy o podobnej zabudowie trudno odróżnić na pierwszy rzut oka; pomagają widoczność,
  układ w rzędzie i kolejność w panelu.
- Zakładki i adres nadal nie zapamiętują rozstawienia.
