import { describe, expect, it } from 'vitest';
import { guildNameBook } from '#lib/data/category-names.js';
import { DATA_LAYERS, type DataLayerId } from './data-layer-catalog.js';

function readLayer(layerId: DataLayerId, properties: Record<string, unknown>) {
	const layer = DATA_LAYERS.find((definition) => definition.id === layerId);
	if (!layer) throw new Error(`brak warstwy ${layerId}`);
	return layer.readFeatures({
		type: 'FeatureCollection',
		features: [
			{ type: 'Feature', geometry: { type: 'Point', coordinates: [0.001, 0.002, 33] }, properties }
		]
	});
}

describe('warstwy danych', () => {
	it('czyta przedmiot z położeniem i opisem', () => {
		const [feature] = readLayer('items', {
			id: 'item-0',
			code: 'ITPL_BLUEPLANT',
			name: 'Niebieski bez',
			category: 'Rośliny',
			amount: 2,
			source: 'zen'
		});
		expect(feature).toMatchObject({ lon: 0.001, lat: 0.002, h: 33 });
		expect(feature.identification).toMatchObject({
			title: 'Niebieski bez',
			subtitle: 'Rośliny',
			searchQuery: 'Niebieski bez'
		});
	});

	it('pomija obiekt przedmiotu bez instancji (pusty kod i brak nazwy) zamiast psuć warstwę', () => {
		const layer = DATA_LAYERS.find((definition) => definition.id === 'items');
		const point = { type: 'Point', coordinates: [0.001, 0.002, 33] };
		const features = layer?.readFeatures({
			type: 'FeatureCollection',
			features: [
				{ type: 'Feature', geometry: point, properties: { id: 'item-0', code: '', name: null } },
				{
					type: 'Feature',
					geometry: point,
					properties: { id: 'item-1', code: 'ITFO_APPLE', name: 'Jabłko', category: 'Jedzenie' }
				}
			]
		});
		expect(features?.map((feature) => feature.identification.title)).toEqual(['Jabłko']);
	});

	it('opisuje zamkniętą skrzynię z kluczem i zawartością', () => {
		const [feature] = readLayer('containers', {
			id: 'container-1',
			locked: true,
			key: 'Klucz Harada',
			pick_string: null,
			contents: [{ code: 'ITMI_GOLD', name: 'Złoto', category: 'Różne', amount: 35 }]
		});
		expect(feature.identification.subtitle).toBe('zamknięta na klucz Klucz Harada');
		expect(feature.identification.listItems).toEqual(['Złoto ×35']);
	});

	it('zamienia kod gildii NPC na nazwę', () => {
		guildNameBook.useGuildNames({ KDW: 'Mag Wody' });
		const [feature] = readLayer('npcs', {
			id: 'npc-0',
			code: 'KDW_140300_ADDON_MYXIR_CITY',
			name: 'Myxir',
			guild_name: 'KDW',
			level: 50,
			chapter: 1,
			insert_waypoint: 'CITY1'
		});
		expect(feature.identification.subtitle).toBe('Mag Wody');
		expect(feature.identification.facts).toContainEqual({
			label: 'Punkt wstawienia',
			value: 'CITY1'
		});
	});

	it('odrzuca obiekt bez trzech współrzędnych', () => {
		const layer = DATA_LAYERS[0];
		expect(() =>
			layer.readFeatures({ features: [{ geometry: { coordinates: [0, 0] }, properties: {} }] })
		).toThrow(/\[lon, lat, h\]/);
	});
});
