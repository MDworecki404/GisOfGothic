import { describe, expect, it } from 'vitest';
import type { SearchEntry } from '#lib/data/types.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { SearchCoordinator } from './search-coordinator.js';

function createEntry(
	id: string,
	type: SearchEntry['type'],
	name: string,
	category: string | null = null
): SearchEntry {
	return { id, type, code: id, name, category, places: [] };
}

function createCoordinator(): {
	coordinator: SearchCoordinator;
	listedNames: string[][];
	offeredCategories: string[][];
} {
	const eventBus = new EventBus<AppEvent>();
	const listedNames: string[][] = [];
	const offeredCategories: string[][] = [];
	eventBus.subscribe('search-results-changed', ({ results, categories }) => {
		listedNames.push(results.map((result) => result.name));
		offeredCategories.push(categories.map((category) => category.label));
	});
	const coordinator = new SearchCoordinator(eventBus, () => null);
	coordinator.useIndex({
		version: 1,
		entries: [
			createEntry('item:b', 'item', 'Miecz', 'Broń biała'),
			createEntry('character:a', 'character', 'Harad'),
			createEntry('item:c', 'item', 'Ziele', 'Rośliny')
		]
	});
	return { coordinator, listedNames, offeredCategories };
}

describe('SearchCoordinator — lista bez frazy', () => {
	it('po wczytaniu indeksu pokazuje wszystkie wpisy alfabetycznie', () => {
		const { listedNames } = createCoordinator();
		expect(listedNames.at(-1)).toEqual(['Harad', 'Miecz', 'Ziele']);
	});

	it('filtr rodzaju zawęża listę bez frazy', () => {
		const { coordinator, listedNames } = createCoordinator();
		coordinator.filterByType('item');
		expect(listedNames.at(-1)).toEqual(['Miecz', 'Ziele']);
	});

	it('fraza zawęża listę do trafień, a jej wyczyszczenie przywraca wszystko', () => {
		const { coordinator, listedNames } = createCoordinator();
		coordinator.search('harad');
		expect(listedNames.at(-1)).toEqual(['Harad']);
		coordinator.search('   ');
		expect(listedNames.at(-1)).toEqual(['Harad', 'Miecz', 'Ziele']);
	});
});

describe('SearchCoordinator — kategorie', () => {
	it('dla rodzaju wpisu proponuje jego kategorie, a dla „wszystkiego” żadnych', () => {
		const { coordinator, offeredCategories } = createCoordinator();
		expect(offeredCategories.at(-1)).toEqual([]);
		coordinator.filterByType('item');
		expect(offeredCategories.at(-1)).toEqual(['Broń biała', 'Rośliny']);
	});

	it('filtr kategorii zawęża listę, a zmiana rodzaju go czyści', () => {
		const { coordinator, listedNames } = createCoordinator();
		coordinator.filterByType('item');
		coordinator.filterByCategory('Rośliny');
		expect(listedNames.at(-1)).toEqual(['Ziele']);
		coordinator.filterByType('character');
		expect(listedNames.at(-1)).toEqual(['Harad']);
		coordinator.filterByType('item');
		expect(listedNames.at(-1)).toEqual(['Miecz', 'Ziele']);
	});
});
