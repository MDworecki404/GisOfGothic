import { describe, expect, it } from 'vitest';
import { BookmarkStore, type BookmarkStorage, type SavedView } from './bookmark-store.js';

class FakeStorage implements BookmarkStorage {
	readonly values = new Map<string, string>();

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

const view: SavedView = {
	id: 'a1',
	name: 'Targ',
	savedAt: '2026-10-15T18:00:00.000Z',
	gameId: 'g2nk',
	worldId: 'khorinis',
	entryId: 'item:ITPL_PERM_HERB',
	entryName: 'Szczaw królewski',
	toolId: 'measure',
	camera: { east: 1, north: 2, height: 3, headingDegrees: 4, pitchDegrees: -5 },
	chapter: 2,
	projection: null
};

describe('BookmarkStore', () => {
	it('zapisuje i odczytuje zakładki', () => {
		const store = new BookmarkStore(new FakeStorage());
		expect(store.saveAll([view])).toBe(true);
		expect(store.loadAll()).toEqual([view]);
	});

	it('pusta pamięć daje pustą listę', () => {
		expect(new BookmarkStore(new FakeStorage()).loadAll()).toEqual([]);
	});

	it('uszkodzony JSON daje pustą listę zamiast błędu', () => {
		const storage = new FakeStorage();
		storage.setItem('gisofgothic:bookmarks:v1', '{nie json');
		expect(new BookmarkStore(storage).loadAll()).toEqual([]);
	});

	it('pomija wpisy bez wymaganych pól, a nieznane narzędzie zamienia na zamknięty panel', () => {
		const storage = new FakeStorage();
		storage.setItem(
			'gisofgothic:bookmarks:v1',
			JSON.stringify([{ id: 'x' }, 5, { ...view, toolId: 'hologram', camera: 'zepsuta' }])
		);
		const [loaded, ...rest] = new BookmarkStore(storage).loadAll();
		expect(rest).toEqual([]);
		expect(loaded).toMatchObject({ id: 'a1', toolId: null, camera: null, chapter: 2 });
	});

	it('zakładka bez pola rzutu odczytuje się z rzutem domyślnym', () => {
		const storage = new FakeStorage();
		const withoutProjection = JSON.stringify([view], (key, value: unknown) =>
			key === 'projection' ? undefined : value
		);
		storage.setItem('gisofgothic:bookmarks:v1', withoutProjection);
		expect(new BookmarkStore(storage).loadAll()).toEqual([view]);
	});

	it('zapisuje i odczytuje rzut ortogonalny', () => {
		const store = new BookmarkStore(new FakeStorage());
		const orthographicView: SavedView = { ...view, projection: { kind: 'orthographic' } };
		store.saveAll([orthographicView]);
		expect(store.loadAll()).toEqual([orthographicView]);
	});

	it('nieprawidłowy rzut zamienia na domyślny, zachowując resztę zakładki', () => {
		const storage = new FakeStorage();
		storage.setItem(
			'gisofgothic:bookmarks:v1',
			JSON.stringify([
				{ ...view, projection: { kind: 'perspective', fovDegrees: 5 } },
				{ ...view, id: 'a2', projection: 'o' }
			])
		);
		const loaded = new BookmarkStore(storage).loadAll();
		expect(loaded.map((item) => item.projection)).toEqual([null, null]);
		expect(loaded[0]).toMatchObject({ id: 'a1', name: 'Targ' });
	});

	it('bez pamięci przeglądarki nic nie zapisuje i nie rzuca', () => {
		const store = new BookmarkStore(null);
		expect(store.saveAll([view])).toBe(false);
		expect(store.loadAll()).toEqual([]);
	});

	it('zapis do przepełnionej pamięci kończy się wynikiem fałsz', () => {
		const store = new BookmarkStore({
			getItem: () => null,
			setItem: () => {
				throw new Error('QuotaExceededError');
			}
		});
		expect(store.saveAll([view])).toBe(false);
	});
});
