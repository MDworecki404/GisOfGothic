import { describe, expect, it } from 'vitest';
import type { SearchEntry } from '#lib/data/types.js';
import { SearchEntryPresenter } from './search-entry-presenter.js';
import { normalizeSearchTerm, SearchService } from './search-service.js';

function createItem(id: string, name: string, category: string, total: number): SearchEntry {
	return {
		id: `item:${id}`,
		type: 'item',
		code: id,
		name,
		category,
		total,
		places: [
			{ kind: 'ground', lon: 0, lat: 0, h: 1, label: 'na ziemi', amount: 1 },
			{
				kind: 'npc',
				lon: 0,
				lat: 0,
				h: 1,
				label: 'u NPC: Baltram',
				amount: 2,
				certainty: 'possible'
			}
		]
	};
}

const harad: SearchEntry = {
	id: 'character:VLK_412_HARAD',
	type: 'character',
	code: 'VLK_412_HARAD',
	name: 'Harad',
	category: 'VLK',
	level: 30,
	places: [{ kind: 'routine', lon: 0, lat: 0, h: 0, label: '07:00–21:30', routine: 'START' }]
};

const service = new SearchService({
	version: 1,
	entries: [
		createItem('ITPL_HEALTH_HERB_02', 'Ziele lecznicze', 'Rośliny', 132),
		createItem('ITPL_HEALTH_HERB_01', 'Roślina lecznicza', 'Rośliny', 328),
		createItem('ITMI_KEY', 'Klucz do kufra', 'Różne', 1),
		harad
	]
});

function findNames(query: string, filter: 'all' | 'item' | 'character' = 'all'): string[] {
	return service.search(query, filter).map((entry) => entry.name);
}

describe('SearchService', () => {
	it('zdejmuje polskie znaki i wielkie litery', () => {
		expect(normalizeSearchTerm('Łowca Smoków')).toBe('lowca smokow');
	});

	it('znajduje po początku słowa i bez polskich znaków', () => {
		expect(findNames('leczn')).toEqual(
			expect.arrayContaining(['Ziele lecznicze', 'Roślina lecznicza'])
		);
		expect(findNames('roslina')[0]).toBe('Roślina lecznicza');
	});

	it('wybacza literówkę w dłuższym słowie', () => {
		expect(findNames('lecznicza')).toContain('Roślina lecznicza');
		expect(findNames('kluscz')).toContain('Klucz do kufra');
	});

	it('szuka postaci po nazwie gildii i filtruje rodzaj', () => {
		expect(findNames('mieszczanin')).toEqual(['Harad']);
		expect(findNames('harad', 'item')).toEqual([]);
	});

	it('pusty tekst nie daje wyników', () => {
		expect(findNames('   ')).toEqual([]);
	});
});

describe('SearchEntryPresenter', () => {
	const presenter = new SearchEntryPresenter();

	it('składa logiczną ścieżkę podglądu z przestrzeni świata i pola model', () => {
		const withModel = { ...createItem('X', 'Ziele', 'Rośliny', 1), model: 'previews/ziele.glb' };
		expect(presenter.presentDetails(withModel, 'g2nk/khorinis').modelPath).toBe(
			'g2nk/khorinis/previews/ziele.glb'
		);
		expect(
			presenter.presentDetails(createItem('Y', 'Łuk', 'Broń', 1), 'g2nk/khorinis').modelPath
		).toBeNull();
	});

	it('opisuje przedmiot: liczba sztuk i rozkład według miejsc', () => {
		const details = presenter.presentDetails(
			createItem('X', 'Ziele lecznicze', 'Rośliny', 3),
			'g2nk/khorinis'
		);
		expect(details.facts).toEqual([
			{ label: 'sztuk w świecie', value: '3' },
			{ label: 'na ziemi', value: '1' },
			{ label: 'u postaci', value: '2' }
		]);
		expect(details.places[1]).toMatchObject({ description: 'U NPC: Baltram', isUncertain: true });
	});

	it('zamienia kod gildii postaci na nazwę', () => {
		expect(presenter.presentResult(harad)).toMatchObject({
			categoryLabel: 'Mieszczanin',
			summary: 'poz. 30'
		});
	});
});
