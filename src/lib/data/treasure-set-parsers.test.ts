import { describe, expect, it } from 'vitest';
import { parseSearchIndex } from './parsers.js';
import { parseQuestCatalog } from './quest-parsers.js';
import { parseTreasureSetCatalog } from './treasure-set-parsers.js';

describe('parseTreasureSetCatalog', () => {
	it('czyta zestawy z pozycjami', () => {
		const catalog = parseTreasureSetCatalog({
			version: 1,
			sets: {
				TS_Small: {
					kind: 'chest',
					min_stacks: 1,
					max_stacks: 2,
					holders: 40,
					items: [{ code: 'It_Gold', name: 'Złoto', category: 'Różne', amount: 25 }]
				}
			}
		});
		expect(catalog.get('TS_Small')).toEqual({
			kind: 'chest',
			minStacks: 1,
			maxStacks: 2,
			holders: 40,
			items: [{ code: 'It_Gold', name: 'Złoto', category: 'Różne', amount: 25 }]
		});
	});

	it('pomija zestaw nieznanego rodzaju zamiast przerywać wczytanie', () => {
		const catalog = parseTreasureSetCatalog({
			version: 1,
			sets: {
				TS_New: { kind: 'zupełnie-nowy', min_stacks: 1, max_stacks: 1, items: [] },
				TS_Old: { kind: 'npc', min_stacks: 0, max_stacks: 0, items: [] }
			}
		});
		expect([...catalog.keys()]).toEqual(['TS_Old']);
	});

	it('odrzuca plik bez zestawów', () => {
		expect(() => parseTreasureSetCatalog({ version: 1 })).toThrow('treasure_sets.json');
	});
});

describe('indeks wyszukiwania z losowym łupem', () => {
	const entryWithLoot = {
		id: 'item:It_Herb',
		type: 'item',
		code: 'It_Herb',
		name: 'Ziele',
		category: 'Rośliny',
		total: 0,
		loot: [
			{ set: 'TS_Small', kind: 'chest', holders: 400 },
			{ set: 'TS_Nowy', kind: 'nieznany', holders: 1 }
		],
		places: [
			{
				kind: 'container',
				lon: 0,
				lat: 0,
				h: 0,
				label: 'w skrzyni, losowo',
				ref: 'container-1',
				certainty: 'possible',
				set: 'TS_Unique'
			}
		]
	};

	it('czyta źródła łupu i zestaw miejsca, pomijając nieznany rodzaj zestawu', () => {
		const [entry] = parseSearchIndex({ version: 4, entries: [entryWithLoot] }).entries;
		expect(entry.loot).toEqual([{ set: 'TS_Small', kind: 'chest', holders: 400 }]);
		expect(entry.places[0].set).toBe('TS_Unique');
	});
});

describe('quests.json z celem zadania', () => {
	it('zachowuje rolę postaci „target”', () => {
		const catalog = parseQuestCatalog({
			version: 4,
			quests: [
				{
					id: 'quest:1',
					name: 'Zabij Inoga',
					section: 'mission',
					characters: [{ code: 'Inog', name: 'Inog', role: 'target' }]
				}
			]
		});
		expect(catalog.quests[0].people.map((person) => person.role)).toEqual(['target']);
	});
});
