import { describe, expect, it } from 'vitest';
import { NotebookStore, readNotebookData, type NotebookStorage } from './notebook-store.js';

class FakeStorage implements NotebookStorage {
	readonly values = new Map<string, string>();

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

const pin = {
	id: 'p1',
	gameId: 'g2nk',
	worldId: 'khorinis',
	name: 'Kuźnia',
	note: 'Tu kupię rudę',
	east: 1,
	north: 2,
	height: 3,
	createdAt: '2026-11-02T10:00:00.000Z'
};

describe('NotebookStore', () => {
	it('zapisuje i odczytuje pinezki oraz wpisy listy', () => {
		const store = new NotebookStore(new FakeStorage());
		const data = {
			pins: [pin],
			collected: [
				{
					gameId: 'g2nk',
					worldId: 'khorinis',
					entryId: 'item:A',
					entryType: 'item' as const,
					entryName: 'A'
				}
			]
		};
		expect(store.save(data)).toBe(true);
		expect(store.load()).toEqual(data);
	});

	it('pomija uszkodzone rekordy i zły JSON', () => {
		const storage = new FakeStorage();
		storage.setItem(
			'gisofgothic:notebook:v1',
			JSON.stringify({
				pins: [pin, { id: 'x' }, 5, { ...pin, east: 'daleko' }],
				collected: [{ entryId: 'item:A', entryType: 'hologram' }]
			})
		);
		const loaded = new NotebookStore(storage).load();
		expect(loaded.pins).toEqual([pin]);
		expect(loaded.collected).toEqual([]);

		storage.setItem('gisofgothic:notebook:v1', '{nie json');
		expect(new NotebookStore(storage).load()).toEqual({ pins: [], collected: [] });
	});

	it('bez pamięci przeglądarki zapis się nie udaje, ale odczyt jest pusty', () => {
		const store = new NotebookStore(null);
		expect(store.save({ pins: [], collected: [] })).toBe(false);
		expect(store.load()).toEqual({ pins: [], collected: [] });
	});

	it('brakująca notatka i data dostają wartości domyślne', () => {
		const { note, createdAt, ...withoutOptional } = pin;
		void note;
		void createdAt;
		expect(readNotebookData({ pins: [withoutOptional] }).pins[0]).toMatchObject({
			note: '',
			createdAt: ''
		});
	});
});
