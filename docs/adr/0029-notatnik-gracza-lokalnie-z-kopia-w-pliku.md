# 0029. Notatnik gracza zapisany lokalnie, z kopią zapasową w pliku

Status: przyjęta

## Kontekst

Aplikacja nie ma logowania ani serwera na dane użytkownika (`docs/wizja.md`). Gracze chcą stawiać własne pinezki
z opisem, odhaczać zebrane przedmioty i wykonane questy, udostępniać widok oraz przenosić swoje zakładki między
urządzeniami.

## Decyzja

- Własne dane gracza trzyma `NotebookStore` w `localStorage` (klucz `gisofgothic:notebook:v1`): pinezki
  (pozycja w metrach od kotwicy świata, nazwa, notatka) i lista „co zebrałem” (przedmioty i questy, osobno dla
  każdego świata). Zakładki zostają w `BookmarkStore`.
- Przenoszenie między urządzeniami to plik JSON (`UserDataBackupCodec`): zakładki, pinezki i lista ze wszystkich
  światów w jednym pliku z nazwą aplikacji i wersją formatu. Import dołącza tylko rekordy, których jeszcze nie ma
  (pinezki i zakładki po identyfikatorze, wpisy listy po grze, świecie i wpisie), więc można go powtarzać.
- Plik jest zwykłym zapisem danych użytkownika; zasada ADR 0012 o zasobach gry go nie dotyczy.
- Udostępnianie widoku nie ma osobnego mechanizmu: adres strony już niesie cały widok (ADR 0007), więc przycisk
  „Kopiuj link” kopiuje `window.location.href`.
- Pinezki rysuje `UserPinsRenderer` (punkty i podpisy w kolekcjach prymitywów), a stawia się je w trybie
  umieszczania: kliknięcie mapy przy otwartym narzędziu Notatnik dodaje pinezkę i kończy tryb.

## Konsekwencje

- Dane żyją w jednej przeglądarce; wyczyszczenie danych witryny je kasuje. Kopia w pliku jest jedyną drogą
  przeniesienia, więc panel ostrzega, gdy pamięć jest zablokowana.
- Pinezki nie wchodzą do linku ani zakładek (są prywatne); żeby je podzielić, trzeba przesłać plik.
- Liczba wpisów świata (mianownik postępu) pochodzi z indeksu wyszukiwania, więc postęp pojawia się po jego
  wczytaniu.
- Dodanie synchronizacji w chmurze wymagałoby nowej decyzji; format pliku ma pole `version`, żeby zmiany były możliwe.
