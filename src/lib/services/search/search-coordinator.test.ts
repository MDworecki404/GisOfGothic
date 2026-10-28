import { describe, expect, it } from 'vitest';
import type { SearchEntry } from '#lib/data/types.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { SearchCoordinator } from './search-coordinator.js';

function createEntry(id: string, type: SearchEntry['type'], name: string): SearchEntry {
	return { id, type, code: id, name, category: null, places: [] };
}

function createCoordinator(): { coordinator: SearchCoordinator; listedNames: string[][] } {
	const eventBus = new EventBus<AppEvent>();
	const listedNames: string[][] = [];
	eventBus.subscribe('search-results-changed', ({ results }) =>
		listedNames.push(results.map((result) => result.name))
	);
	const coordinator = new SearchCoordinator(eventBus, () => null);
	coordinator.useIndex({
		version: 1,
		entries: [
			createEntry('item:b', 'item', 'Miecz'),
			createEntry('character:a', 'character', 'Harad'),
			createEntry('item:c', 'item', 'Ziele')
		]
	});
	return { coordinator, listedNames };
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
