import { describe, expect, it } from 'vitest';
import { DATA_LAYERS } from '#lib/services/layers/data-layer-catalog.js';
import { SearchService } from '#lib/services/search/search-service.js';
import { parseSearchIndex, readItemNames } from './parsers.js';
import { parseQuestCatalog } from './quest-parsers.js';
import { parseTreasureSetCatalog } from './treasure-set-parsers.js';

function createItemEntry(
	code: string,
	name: string,
	description?: string,
	category = 'Mikstury'
): unknown {
	return {
		id: `item:${code}`,
		type: 'item',
		code,
		name,
		description,
		category,
		places: []
	};
}

describe('readItemNames', () => {
	it('opis z gry zastępuje nazwę ogólną, którą zostawia jako nazwę ogólną', () => {
		expect(
			readItemNames({ description: 'Esencja lecznicza' }, 'ITPO_HEALTH_01', 'Mikstura')
		).toEqual({ displayName: 'Esencja lecznicza', genericName: 'Mikstura' });
	});

	it('bez opisu, z pustym opisem albo równym nazwie zostawia nazwę', () => {
		for (const record of [{}, { description: '   ' }, { description: 'Mikstura' }]) {
			expect(readItemNames(record, 'ITPO_HEALTH_01', 'Mikstura')).toEqual({
				displayName: 'Mikstura',
				genericName: undefined
			});
		}
	});

	it('kamienne tablice bez opisu nadal dostają atrybut z kodu', () => {
		expect(readItemNames({}, 'ITWR_STRSTONEPLATE2_ADDON', 'Kamienna tablica').displayName).toBe(
			'Kamienna tablica siły II'
		);
	});
});

describe('opis przedmiotu w danych świata', () => {
	it('indeks wyszukiwania pokazuje opis, a po nazwie ogólnej nadal się wyszukuje', () => {
		const index = parseSearchIndex({
			version: 4,
			entries: [
				createItemEntry('ITPO_HEALTH_01', 'Mikstura', 'Esencja lecznicza'),
				createItemEntry('ITPO_MANA_01', 'Mikstura', 'Esencja z many'),
				createItemEntry('ITFO_APPLE', 'Jabłko', undefined, 'Jedzenie')
			]
		});
		const service = new SearchService(index);
		expect(index.entries.map((entry) => entry.name)).toEqual([
			'Esencja lecznicza',
			'Esencja z many',
			'Jabłko'
		]);
		expect(service.search('esencja lecznicza', 'all').map((entry) => entry.code)).toEqual([
			'ITPO_HEALTH_01'
		]);
		expect(
			service
				.search('mikstura', 'all')
				.map((entry) => entry.code)
				.sort()
		).toEqual(['ITPO_HEALTH_01', 'ITPO_MANA_01']);
	});

	it('warstwa przedmiotów i zawartość skrzyń używają opisu', () => {
		const itemsLayer = DATA_LAYERS.find((layer) => layer.id === 'items');
		const containersLayer = DATA_LAYERS.find((layer) => layer.id === 'containers');
		const point = (properties: unknown): unknown => ({
			type: 'FeatureCollection',
			features: [
				{ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0, 0] }, properties }
			]
		});
		const item = itemsLayer?.readFeatures(
			point({ id: 'i', code: 'ITPO_HEALTH_01', name: 'Mikstura', description: 'Esencja lecznicza' })
		);
		expect(item?.[0].identification.title).toBe('Esencja lecznicza');
		const container = containersLayer?.readFeatures(
			point({
				id: 'c',
				contents: [
					{ code: 'ITPO_HEALTH_01', name: 'Mikstura', description: 'Esencja lecznicza', amount: 2 }
				]
			})
		);
		expect(container?.[0].identification.listItems).toEqual(['Esencja lecznicza ×2']);
	});

	it('zestawy łupu i przedmioty questów używają opisu', () => {
		const sets = parseTreasureSetCatalog({
			version: 1,
			sets: {
				TS: {
					kind: 'chest',
					min_stacks: 1,
					max_stacks: 1,
					items: [
						{
							code: 'It_Potion_Health',
							name: 'Mikstura',
							description: 'Mikstura lecznicza',
							amount: 1
						}
					]
				}
			}
		});
		expect(sets.get('TS')?.items[0].name).toBe('Mikstura lecznicza');
		const quests = parseQuestCatalog({
			version: 4,
			quests: [
				{
					id: 'q',
					name: 'Zadanie',
					section: 'mission',
					items: [
						{
							code: 'ITPO_HEALTH_01',
							name: 'Mikstura',
							description: 'Esencja lecznicza',
							role: 'reward'
						}
					]
				}
			]
		});
		expect(quests.quests[0].items[0].name).toBe('Esencja lecznicza');
	});

	it('pozycja skrzyni bez nazwy (kodu nie ma w skryptach gry) pokazuje kod zamiast zniknąć', () => {
		const containersLayer = DATA_LAYERS.find((layer) => layer.id === 'containers');
		const container = containersLayer?.readFeatures({
			type: 'FeatureCollection',
			features: [
				{
					type: 'Feature',
					geometry: { type: 'Point', coordinates: [0, 0, 0] },
					properties: {
						id: 'c',
						contents: [{ code: 'ITFO_MUTTON', name: null, category: null, amount: 5 }]
					}
				}
			]
		});
		expect(container?.[0].identification.listItems).toEqual(['ITFO_MUTTON ×5']);
	});
});
