import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { BookmarkStore, type BookmarkStorage } from '#lib/services/bookmarks/bookmark-store.js';
import { BookmarksCoordinator } from '#lib/services/bookmarks/bookmarks-coordinator.js';
import { NotebookCoordinator } from '#lib/services/notebook/notebook-coordinator.js';
import { NotebookStore, type NotebookStorage } from '#lib/services/notebook/notebook-store.js';
import { UserDataTransfer } from './user-data-transfer.js';

class FakeStorage implements BookmarkStorage, NotebookStorage {
	readonly values = new Map<string, string>();

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

function createTransfer(): {
	transfer: UserDataTransfer;
	bookmarks: BookmarksCoordinator;
	notebook: NotebookCoordinator;
} {
	const eventBus = new EventBus<AppEvent>();
	let nextId = 0;
	const bookmarks = new BookmarksCoordinator(
		eventBus,
		new BookmarkStore(new FakeStorage()),
		() => new Date('2026-11-02T10:00:00.000Z'),
		() => `b-${++nextId}`
	);
	const notebook = new NotebookCoordinator(
		eventBus,
		new NotebookStore(new FakeStorage()),
		() => null,
		() => new Date('2026-11-02T10:00:00.000Z'),
		() => `p-${++nextId}`
	);
	bookmarks.useWorld('g2nk', 'khorinis');
	notebook.useWorld('g2nk', 'khorinis');
	return {
		transfer: new UserDataTransfer(bookmarks, notebook, () => new Date('2026-11-02T10:00:00.000Z')),
		bookmarks,
		notebook
	};
}

describe('UserDataTransfer', () => {
	it('plik ma datę w nazwie, a eksport przechodzi tam i z powrotem do innego urządzenia', () => {
		const source = createTransfer();
		source.bookmarks.addBookmark({
			name: 'Targ',
			entryId: null,
			entryName: null,
			toolId: 'search',
			camera: null,
			projection: null,
			viewMode: 'view-3d',
			sliceHeightMetres: null,
			chapter: null
		});
		source.notebook.addPin({ east: 1, north: 2, height: 3 });
		source.notebook.toggleCollected({ id: 'item:A', name: 'A', type: 'item' });
		const backup = source.transfer.exportBackup();
		expect(backup.fileName).toBe('gis-of-gothic-notatnik-2026-11-02.json');

		const target = createTransfer();
		const result = target.transfer.importBackup(backup.text);
		expect(result.isSuccess).toBe(true);
		expect(result.message).toContain('zakładki: 1');
		expect(result.message).toContain('pinezki: 1');
		expect(result.message).toContain('„co zebrałem”: 1');
		expect(target.notebook.exportData().pins).toHaveLength(1);
		expect(target.bookmarks.exportViews()).toHaveLength(1);
	});

	it('drugi import tego samego pliku niczego nie dubluje', () => {
		const { transfer, notebook } = createTransfer();
		notebook.addPin({ east: 1, north: 2, height: 3 });
		const { text } = transfer.exportBackup();
		const result = transfer.importBackup(text);
		expect(result.message).toContain('zakładki: 0, pinezki: 0');
		expect(notebook.exportData().pins).toHaveLength(1);
	});

	it('odrzuca obcy plik i nic nie zmienia', () => {
		const { transfer, notebook } = createTransfer();
		for (const text of [
			'to nie json',
			'{"pins":[]}',
			'{"application":"gisofgothic","version":99}'
		]) {
			expect(transfer.importBackup(text).isSuccess).toBe(false);
		}
		expect(notebook.exportData().pins).toEqual([]);
	});
});
