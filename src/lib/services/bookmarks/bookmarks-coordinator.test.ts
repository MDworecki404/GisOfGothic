import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { BookmarkStore, type BookmarkStorage } from './bookmark-store.js';
import {
	BookmarksCoordinator,
	type BookmarkView,
	type NewBookmark
} from './bookmarks-coordinator.js';

class FakeStorage implements BookmarkStorage {
	readonly values = new Map<string, string>();

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

const newBookmark: NewBookmark = {
	name: 'Targ',
	entryId: 'item:ITPL_PERM_HERB',
	entryName: 'Szczaw królewski',
	toolId: 'measure',
	camera: { east: 10, north: 20, height: 300, headingDegrees: 90, pitchDegrees: -45 },
	chapter: null,
	projection: null
};

function createCoordinator(storage = new FakeStorage()): {
	coordinator: BookmarksCoordinator;
	storage: FakeStorage;
	latestBookmarks: () => BookmarkView[];
} {
	const eventBus = new EventBus<AppEvent>();
	let bookmarks: BookmarkView[] = [];
	eventBus.subscribe('bookmarks-changed', (event) => {
		bookmarks = event.bookmarks;
	});
	let nextId = 0;
	const coordinator = new BookmarksCoordinator(
		eventBus,
		new BookmarkStore(storage),
		() => new Date('2026-10-15T18:00:00.000Z'),
		() => `id-${++nextId}`
	);
	return { coordinator, storage, latestBookmarks: () => bookmarks };
}

describe('BookmarksCoordinator', () => {
	it('dodaje zakładkę z linkiem odtwarzającym widok', () => {
		const { coordinator, latestBookmarks } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addBookmark(newBookmark);
		const [bookmark] = latestBookmarks();
		expect(bookmark).toMatchObject({
			id: 'id-1',
			name: 'Targ',
			details: 'Narzędzie: Pomiary · Wpis: Szczaw królewski',
			linkQuery: '?wpis=item%3AITPL_PERM_HERB&widok=10_20_300_90_-45&narzedzie=measure'
		});
		expect(bookmark.savedAtLabel).not.toBe('');
	});

	it('zapamiętuje wybrany rozdział w opisie i w linku', () => {
		const { coordinator, latestBookmarks } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addBookmark({ ...newBookmark, chapter: 4 });
		const [bookmark] = latestBookmarks();
		expect(bookmark.details).toBe('Narzędzie: Pomiary · Wpis: Szczaw królewski · Rozdział IV');
		expect(bookmark.linkQuery).toContain('rozdzial=4');
	});

	it('zakładka w rzucie ortogonalnym ma rzut w linku i w opisie', () => {
		const { coordinator, latestBookmarks } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addBookmark({ ...newBookmark, projection: { kind: 'orthographic' } });
		const [bookmark] = latestBookmarks();
		expect(bookmark.details).toBe('Narzędzie: Pomiary · Wpis: Szczaw królewski · Rzut ortogonalny');
		expect(bookmark.linkQuery).toContain('rzut=o');
	});

	it('zakładka w perspektywie 60° nie dodaje rzutu do linku ani opisu', () => {
		const { coordinator, latestBookmarks } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addBookmark({
			...newBookmark,
			projection: { kind: 'perspective', fovDegrees: 60 }
		});
		const [bookmark] = latestBookmarks();
		expect(bookmark.linkQuery).not.toContain('rzut');
		expect(bookmark.details).not.toContain('Rzut');
	});

	it('pusta nazwa dostaje numerowaną nazwę domyślną', () => {
		const { coordinator, latestBookmarks } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addBookmark({ ...newBookmark, name: '   ' });
		coordinator.addBookmark({ ...newBookmark, name: '' });
		expect(latestBookmarks().map((bookmark) => bookmark.name)).toEqual([
			'Zakładka 1',
			'Zakładka 2'
		]);
	});

	it('zakładki przeżywają ponowne otwarcie świata, a lista dotyczy tylko jednego świata', () => {
		const { coordinator, storage, latestBookmarks } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addBookmark(newBookmark);
		coordinator.useWorld('g3', 'myrtana');
		expect(latestBookmarks()).toEqual([]);
		coordinator.addBookmark({ ...newBookmark, name: 'Inna gra' });

		const reopened = createCoordinator(storage);
		reopened.coordinator.useWorld('g2nk', 'khorinis');
		expect(reopened.latestBookmarks().map((bookmark) => bookmark.name)).toEqual(['Targ']);
	});

	it('usuwa zakładkę i znajduje ją po identyfikatorze tylko w bieżącym świecie', () => {
		const { coordinator, latestBookmarks } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addBookmark(newBookmark);
		expect(coordinator.findBookmark('id-1')?.entryId).toBe('item:ITPL_PERM_HERB');
		coordinator.removeBookmark('id-1');
		expect(latestBookmarks()).toEqual([]);
		expect(coordinator.findBookmark('id-1')).toBeUndefined();
	});

	it('zgłasza błąd, gdy pamięci przeglądarki nie da się zapisać', () => {
		const eventBus = new EventBus<AppEvent>();
		let hasStorageError = false;
		eventBus.subscribe('bookmarks-changed', (event) => {
			hasStorageError = event.hasStorageError;
		});
		const coordinator = new BookmarksCoordinator(eventBus, new BookmarkStore(null));
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addBookmark(newBookmark);
		expect(hasStorageError).toBe(true);
	});
});
