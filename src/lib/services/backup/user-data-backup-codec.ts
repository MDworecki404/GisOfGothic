import { isRecord } from '#lib/data/parsers.js';
import { readSavedView, type SavedView } from '#lib/services/bookmarks/bookmark-store.js';
import { readNotebookData, type NotebookData } from '#lib/services/notebook/notebook-store.js';

export interface UserDataBackup {
	bookmarks: SavedView[];
	notebook: NotebookData;
}

const APPLICATION_NAME = 'gisofgothic';
const FORMAT_VERSION = 1;

/**
 * Plik kopii zapasowej danych gracza: zakładki, pinezki i lista „co zebrałem” ze wszystkich światów.
 * Odczyt przepuszcza tylko poprawne rekordy, więc uszkodzony albo obcy plik nie psuje zapisanych danych.
 */
export class UserDataBackupCodec {
	serialize(backup: UserDataBackup, exportedAt: Date): string {
		return JSON.stringify(
			{
				application: APPLICATION_NAME,
				version: FORMAT_VERSION,
				exportedAt: exportedAt.toISOString(),
				bookmarks: backup.bookmarks,
				pins: backup.notebook.pins,
				collectedQuests: backup.notebook.collectedQuests,
				collectedPlaces: backup.notebook.collectedPlaces
			},
			null,
			2
		);
	}

	/** Zwraca `null`, gdy tekst nie jest kopią zapasową tej aplikacji w znanej wersji. */
	parse(text: string): UserDataBackup | null {
		let parsed: unknown;
		try {
			parsed = JSON.parse(text);
		} catch {
			return null;
		}
		if (
			!isRecord(parsed) ||
			parsed.application !== APPLICATION_NAME ||
			parsed.version !== FORMAT_VERSION
		) {
			return null;
		}
		const bookmarks = Array.isArray(parsed.bookmarks)
			? parsed.bookmarks.flatMap((item) => {
					const view = readSavedView(item);
					return view ? [view] : [];
				})
			: [];
		return { bookmarks, notebook: readNotebookData(parsed) };
	}
}
