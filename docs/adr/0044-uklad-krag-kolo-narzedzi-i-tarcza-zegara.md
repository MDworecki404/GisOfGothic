# 0044. Układ „Krąg”: koło narzędzi, tarcza zegara i pieczęć wpisu

Status: przyjęta (zastępuje układ pionowego doku z ADR 0019 i ADR 0036 na komputerze; telefon bez zmian)

## Kontekst

Etap 1 motywu „Krąg” (ADR 0043) zmienił paletę, pismo, kształt płyt i dodał tryb jasny. Układ ekranu został
z pionowym dokiem narzędzi po lewej, łukiem zegara doby i kartą wpisu bez znaku rozpoznawczego. Makiety
(`docs/makiety/kierunki-wygladu.html`, kierunek Krąg) pokazały koło narzędzi, tarczę zegara 24 h i pieczęć na
karcie wpisu.

## Decyzja

- **Koło narzędzi (komputer).** Pionowa szyna ustępuje `ToolWheel`: okrągła piasta w lewym dolnym rogu (64 px),
  która pokazuje ikonę aktywnego narzędzia. Kliknięcie piasty rozkłada osiem narzędzi na dwóch łukach w ćwiartce
  nad nią (cztery na promieniu 104 px, cztery na 172 px); wybór narzędzia, `Escape` albo kliknięcie poza kołem
  zamyka koło. Zamknięte koło zajmuje tylko piastę, więc nie zabiera miejsca mapie ani panelom, a `--rail-width`
  zostaje szerokością lewej kolumny pod panele, odczyt i legendę. Piasta ma `aria-label` „Narzędzia, aktywne: …”
  i `aria-expanded`, narzędzia mają `aria-pressed` i są poza kolejnością `Tab`, dopóki koło jest zamknięte.
  Telefon zachowuje dolną nawigację z menu „Inne”.
- **Wykrywanie kliknięcia poza kołem** używa `event.composedPath()`, a nie `contains`: ikona piasty wymienia się
  (obrót na „×”) między obsługą kliknięcia na piaście a obsługą na oknie, więc odłączony węzeł wyglądałby jak
  „poza kołem”. Zauważyliśmy to dopiero przy prawdziwym kliknięciu, bo `element.click()` z kodu tego nie odtwarza.
- **Tarcza zegara.** Rozwinięty `DayClock` rysuje tarczę 24 h zamiast półokrągłego łuku: północ na dole, południe
  u góry, jasny łuk dnia (06:00–20:00) i znacznik bieżącej godziny. Godzinę ustawia się przeciągnięciem po tarczy
  (kąt wskaźnika zamieniany na minutę, krok 5 min) albo strzałkami (krok 30 min), `role="slider"` zostaje. Stan
  zwinięty (przycisk, godzina, strzałka) bez zmian.
- **Pieczęć wpisu.** `EntrySummaryCard` pokazuje okrągły medalion z ikoną rodzaju wpisu (postać, przedmiot, quest,
  lokacja) obok nazwy; klasa `.entry-seal` w `app.css` używa tylko tokenów.
- **Testy.** Testy e2e wybierają narzędzia przez `selectTool` (`e2e/support/test.ts`), który otwiera koło, jeśli
  jest zamknięte. Test układu sprawdza osiem narzędzi, aktywne w piaście i zamykanie `Escape`.

## Konsekwencje

- Wybór narzędzia to dwa kliknięcia (piasta, narzędzie) zamiast jednego; w zamian lewa kolumna jest wolna, a
  aktywne narzędzie widać w piaście. Jeśli okaże się to zbyt wolne, można pamiętać ostatnie narzędzie i wybierać
  je jednym kliknięciem piasty z przytrzymaniem.
- Trzecia, wewnętrzna strefa układu (karta wpisu z pieczęcią w Księdze, `BookEntry`) nie ma jeszcze pieczęci.
- Paleta warstw mapy na tryb jasny (`MAP_PALETTE`) zostaje na później.
- Tarcza nie pokazuje jeszcze łuku rutyny wybranej postaci; wymaga wystawienia przedziałów rutyny w stanie
  aplikacji.
