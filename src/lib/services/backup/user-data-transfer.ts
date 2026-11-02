import type { BookmarksCoordinator } from '#lib/services/bookmarks/bookmarks-coordinator.js';
import type { NotebookCoordinator } from '#lib/services/notebook/notebook-coordinator.js';
import { UserDataBackupCodec } from './user-data-backup-codec.js';

export interface UserDataExport {
	fileName: string;
	text: string;
}

export interface UserDataImportResult {
	isSuccess: boolean;
	message: string;
}

/** Eksport i import danych gracza (zakładki, pinezki, lista „co zebrałem”) do pliku JSON. */
export class UserDataTransfer {
	private readonly codec = new UserDataBackupCodec();

	constructor(
		private readonly bookmarks: BookmarksCoordinator,
		private readonly notebook: NotebookCoordinator,
		private readonly now: () => Date = () => new Date()
	) {}

	exportBackup(): UserDataExport {
		const exportedAt = this.now();
		return {
			fileName: `gis-of-gothic-notatnik-${exportedAt.toISOString().slice(0, 10)}.json`,
			text: this.codec.serialize(
				{ bookmarks: this.bookmarks.exportViews(), notebook: this.notebook.exportData() },
				exportedAt
			)
		};
	}

	importBackup(text: string): UserDataImportResult {
		const backup = this.codec.parse(text);
		if (!backup) {
			return {
				isSuccess: false,
				message: 'To nie jest plik z kopią zapasową GIS of Gothic. Nic nie zostało zmienione.'
			};
		}
		const addedBookmarks = this.bookmarks.importViews(backup.bookmarks);
		const added = this.notebook.importData(backup.notebook);
		return {
			isSuccess: true,
			message: `Zaimportowano — zakładki: ${addedBookmarks}, pinezki: ${added.pins}, lista „co zebrałem”: ${added.collected}. Powtórki pominięto.`
		};
	}
}
