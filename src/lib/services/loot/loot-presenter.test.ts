import { describe, expect, it } from 'vitest';
import type { TreasureSetCatalog } from '#lib/data/types.js';
import { LootPresenter } from './loot-presenter.js';

const catalog: TreasureSetCatalog = new Map([
	[
		'TS_A',
		{
			kind: 'chest',
			minStacks: 1,
			maxStacks: 2,
			holders: 3,
			items: [
				{ code: 'It_Gold', name: 'Złoto', category: null, amount: 50 },
				{ code: 'It_Herb', name: 'Ziele', category: null, amount: 1 }
			]
		}
	],
	[
		'TS_B',
		{
			kind: 'npc',
			minStacks: 1,
			maxStacks: 1,
			holders: 1,
			items: [{ code: 'It_Gold', name: 'Złoto', category: null, amount: 100 }]
		}
	]
]);

describe('LootPresenter', () => {
	const presenter = new LootPresenter();

	it('łączy przedmioty z kilku zestawów i bierze największą ilość', () => {
		expect(presenter.describePossibleContents(['TS_A', 'TS_B'], catalog)).toEqual([
			'Złoto ×100',
			'Ziele'
		]);
	});

	it('pomija zestawy spoza katalogu', () => {
		expect(presenter.describePossibleContents(['TS_BRAK'], catalog)).toEqual([]);
	});

	it('skraca bardzo długą listę', () => {
		const items = Array.from({ length: 45 }, (_, index) => ({
			code: `It_${index}`,
			name: `Rzecz ${index}`,
			category: null,
			amount: 1
		}));
		const big: TreasureSetCatalog = new Map([
			['TS_BIG', { kind: 'chest', minStacks: 1, maxStacks: 1, holders: 1, items }]
		]);
		const lines = presenter.describePossibleContents(['TS_BIG'], big);
		expect(lines).toHaveLength(41);
		expect(lines.at(-1)).toBe('…i 5 innych');
	});

	it('opisuje źródła łupu z odmianą słowa „zestaw”', () => {
		const sources = [
			{ set: 'a', kind: 'chest', holders: 1 },
			{ set: 'b', kind: 'chest', holders: 1 },
			{ set: 'c', kind: 'trader', holders: 1 }
		] as const;
		expect(presenter.describeLootSources(sources)).toEqual([
			'losowa zawartość skrzyń (2 zestawy)',
			'towar handlarzy (1 zestaw)'
		]);
	});
});
