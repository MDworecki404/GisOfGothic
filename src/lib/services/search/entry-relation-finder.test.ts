import { describe, expect, it } from 'vitest';
import type { Place, SearchEntry } from '#lib/data/types.js';
import { EntryRelationFinder } from './entry-relation-finder.js';

function createPlace(overrides: Partial<Place>): Place {
	return { kind: 'ground', lon: 0, lat: 0, h: 0, label: 'na ziemi', ...overrides };
}

function createEntry(overrides: Partial<SearchEntry>): SearchEntry {
	return { id: 'x', type: 'item', code: 'X', name: 'X', category: null, places: [], ...overrides };
}

const harad = createEntry({
	id: 'character:HARAD',
	type: 'character',
	name: 'Harad',
	places: [createPlace({ kind: 'spawn', ref: 'npc-1' }), createPlace({ kind: 'routine', ref: 'r' })]
});

const sword = createEntry({
	id: 'item:SWORD',
	name: 'Miecz',
	places: [
		createPlace({ kind: 'npc', ref: 'npc-1', label: 'u NPC: Harad' }),
		createPlace({ kind: 'npc', ref: 'npc-9', label: 'u NPC: Wilk' }),
		createPlace({ kind: 'npc', ref: 'npc-10', label: 'u NPC: Wilk' }),
		createPlace({ kind: 'ground', ref: 'item-1' })
	]
});

const finder = new EntryRelationFinder({ version: 1, entries: [harad, sword] });

describe('EntryRelationFinder', () => {
	it('przedmiot pokazuje postać z indeksu jako link, a spoza indeksu jako tekst z liczbą', () => {
		const [group] = finder.describeRelations(sword);
		expect(group.heading).toBe('Ma go przy sobie');
		expect(group.links).toEqual([
			{ name: 'Harad', description: '', isUncertain: false, entryId: 'character:HARAD' },
			{ name: 'Wilk', description: '×2', isUncertain: false, entryId: null }
		]);
		expect(group.hiddenCount).toBe(0);
	});

	it('postać pokazuje przedmioty, które ma przy sobie', () => {
		const [group] = finder.describeRelations(harad);
		expect(group.heading).toBe('Ma przy sobie');
		expect(group.links).toEqual([
			{ name: 'Miecz', description: '', isUncertain: false, entryId: 'item:SWORD' }
		]);
	});

	it('przedmiot bez nosiciela i quest nie mają grup powiązań', () => {
		const lonely = createEntry({ id: 'item:A', places: [createPlace({})] });
		const questEntry = createEntry({ id: 'quest:Q', type: 'quest' });
		const emptyFinder = new EntryRelationFinder({ version: 1, entries: [lonely, questEntry] });
		expect(emptyFinder.describeRelations(lonely)).toEqual([]);
		expect(emptyFinder.describeRelations(questEntry)).toEqual([]);
	});

	it('niepewny nosiciel jest oznaczony, a ilości się sumują', () => {
		const potion = createEntry({
			id: 'item:POTION',
			places: [
				createPlace({
					kind: 'npc',
					ref: 'npc-1',
					label: 'u NPC: Harad',
					amount: 2,
					certainty: 'possible'
				}),
				createPlace({
					kind: 'npc',
					ref: 'npc-1',
					label: 'u NPC: Harad',
					amount: 3,
					certainty: 'possible'
				})
			]
		});
		const [group] = new EntryRelationFinder({
			version: 1,
			entries: [harad, potion]
		}).describeRelations(potion);
		expect(group.links).toEqual([
			{ name: 'Harad', description: '×5', isUncertain: true, entryId: 'character:HARAD' }
		]);
	});

	it('długa lista jest obcięta, a reszta policzona', () => {
		const crowd = createEntry({
			id: 'item:CROWD',
			places: Array.from({ length: 55 }, (_, index) =>
				createPlace({ kind: 'npc', ref: `npc-x${index}`, label: `u NPC: Postać ${index}` })
			)
		});
		const [group] = new EntryRelationFinder({ version: 1, entries: [crowd] }).describeRelations(
			crowd
		);
		expect(group.links).toHaveLength(40);
		expect(group.hiddenCount).toBe(15);
	});
});
