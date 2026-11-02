import { describe, expect, it } from 'vitest';
import {
	createEmptyNotebookData,
	NotebookStore,
	readNotebookData,
	type NotebookStorage
} from './notebook-store.js';

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
	it('zapisuje i odczytuje pinezki, questy i miejsca przedmiotów', () => {
		const store = new NotebookStore(new FakeStorage());
		const data = {
			pins: [pin],
			collectedQuests: [
				{ gameId: 'g2nk', worldId: 'khorinis', questId: 'quest:A', questName: 'A' }
			],
			collectedPlaces: [
				{
					gameId: 'g3',
					worldId: 'myrtana',
					entryId: 'item:B',
					entryName: 'Bełt',
					placeKey: 'ground:item-1'
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
				collectedQuests: [{ questId: 'quest:A' }],
				collectedPlaces: [{ entryId: 'item:A', placeKey: 5 }]
			})
		);
		const loaded = new NotebookStore(storage).load();
		expect(loaded.pins).toEqual([pin]);
		expect(loaded.collectedQuests).toEqual([]);
		expect(loaded.collectedPlaces).toEqual([]);

		storage.setItem('gisofgothic:notebook:v1', '{nie json');
		expect(new NotebookStore(storage).load()).toEqual(createEmptyNotebookData());
	});

	it('bez pamięci przeglądarki zapis się nie udaje, ale odczyt jest pusty', () => {
		const store = new NotebookStore(null);
		expect(store.save(createEmptyNotebookData())).toBe(false);
		expect(store.load()).toEqual(createEmptyNotebookData());
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
