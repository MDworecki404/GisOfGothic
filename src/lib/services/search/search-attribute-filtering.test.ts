import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import type { QuestRecord, SearchEntry } from '#lib/data/types.js';
import { NO_ATTRIBUTE_FILTER } from './attribute-filter.js';
import { QuestPresenter } from './quest-presenter.js';
import { SearchCoordinator } from './search-coordinator.js';
import { SearchService } from './search-service.js';

function createEntry(overrides: Partial<SearchEntry>): SearchEntry {
	return { id: 'x', type: 'item', code: 'X', name: 'X', category: null, places: [], ...overrides };
}

const entries: SearchEntry[] = [
	createEntry({ id: 'character:a', type: 'character', name: 'Adept', level: 5 }),
	createEntry({ id: 'character:b', type: 'character', name: 'Bandyta', level: 15 }),
	createEntry({ id: 'character:c', type: 'character', name: 'Czarodziej', level: 40 }),
	createEntry({ id: 'quest:1', type: 'quest', name: 'Pierwszy zlecenie', chapter: 1 }),
	createEntry({ id: 'quest:2', type: 'quest', name: 'Drugie zlecenie', chapter: 2 }),
	createEntry({ id: 'quest:3', type: 'quest', name: 'Trzecie zlecenie', chapter: null })
];

describe('SearchService: filtry cech', () => {
	const service = new SearchService({ version: 1, entries });

	it('lista bez frazy zawęża postacie do przedziału poziomu', () => {
		const names = service
			.listAll('character', null, { ...NO_ATTRIBUTE_FILTER, minimumLevel: 10, maximumLevel: 20 })
			.map((entry) => entry.name);
		expect(names).toEqual(['Bandyta']);
	});

	it('fraza też respektuje filtr, a limit wyników liczy się po filtrze', () => {
		const results = service.search('zlecenie', 'quest', null, {
			...NO_ATTRIBUTE_FILTER,
			questChapter: 2
		});
		expect(results.map((entry) => entry.name)).toEqual(['Drugie zlecenie']);
	});
});

describe('SearchCoordinator: filtry cech', () => {
	function createCoordinator(): {
		coordinator: SearchCoordinator;
		listedNames: () => string[];
		latestFilter: () => unknown;
	} {
		const eventBus = new EventBus<AppEvent>();
		let names: string[] = [];
		let filter: unknown = null;
		eventBus.subscribe('search-results-changed', (event) => {
			names = event.results.map((result) => result.name);
			filter = event.attributeFilter;
		});
		const coordinator = new SearchCoordinator(eventBus, () => null);
		coordinator.useIndex({ version: 1, entries });
		return { coordinator, listedNames: () => names, latestFilter: () => filter };
	}

	it('filtr poziomu i rozdziału zmienia listę, a zmiana rodzaju go czyści', () => {
		const { coordinator, listedNames, latestFilter } = createCoordinator();
		coordinator.filterByType('character');
		coordinator.filterByLevelRange(null, 15);
		expect(listedNames()).toEqual(['Adept', 'Bandyta']);
		coordinator.filterByType('quest');
		expect(latestFilter()).toEqual(NO_ATTRIBUTE_FILTER);
		coordinator.filterByQuestChapter(1);
		expect(listedNames()).toEqual(['Pierwszy zlecenie']);
	});

	it('wybór wpisu publikuje jego powiązania', () => {
		const eventBus = new EventBus<AppEvent>();
		const published: string[] = [];
		eventBus.subscribe('related-entries-changed', (event) => published.push(event.entryId));
		const coordinator = new SearchCoordinator(eventBus, () => null);
		coordinator.useIndex({ version: 1, entries });
		coordinator.selectEntry('character:b');
		expect(published).toEqual(['character:b']);
	});
});

describe('QuestPresenter.presentQuestsOfItem', () => {
	const quest = (
		id: string,
		name: string,
		chapter: number | null,
		itemCode: string
	): QuestRecord => ({
		id,
		name,
		section: 'mission',
		chapter,
		giver: null,
		giverCandidates: [],
		stages: [],
		people: [],
		items: [
			{
				code: itemCode,
				name: 'Rzecz',
				role: 'reward',
				amount: 3,
				certainty: 'always',
				entryId: null
			}
		],
		experiencePoints: null
	});

	it('wybiera questy z danym przedmiotem i opisuje jego rolę', () => {
		const links = new QuestPresenter().presentQuestsOfItem(
			[
				quest('quest:b', 'Bbb', 2, 'ITEM_A'),
				quest('quest:a', 'Aaa', null, 'ITEM_A'),
				quest('quest:c', 'Ccc', 1, 'ITEM_B')
			],
			'ITEM_A'
		);
		expect(links).toEqual([
			{ name: 'Aaa', description: 'nagroda, ×3', isUncertain: false, entryId: 'quest:a' },
			{ name: 'Bbb', description: 'nagroda, ×3, rozdz. 2', isUncertain: false, entryId: 'quest:b' }
		]);
	});
});
