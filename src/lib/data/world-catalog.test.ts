import { describe, expect, it } from 'vitest';
import { WorldCatalog, type WorldDefinition } from './world-catalog.js';

const khorinis: WorldDefinition = {
	id: 'khorinis',
	gameId: 'g2nk',
	name: 'Khorinis',
	localCoordinateSystemName: 'Układ Khorinis 1992',
	dataBaseUrl: '/data/g2nk/khorinis',
	modelNamespace: 'g2nk/khorinis',
	protectedModelsUrl: 'https://modele.example/g2nk/khorinis/items',
	worldTilesetUrl: 'https://bramka.example/ion/1/tileset.json'
};
const oldCamp: WorldDefinition = { ...khorinis, id: 'colony', gameId: 'g1', name: 'Kolonia' };

const catalog = new WorldCatalog(
	[
		{ id: 'g1', name: 'Gothic', worlds: [oldCamp] },
		{ id: 'g2nk', name: 'Gothic 2: Noc Kruka', worlds: [khorinis] }
	],
	khorinis
);

describe('WorldCatalog', () => {
	it('znajduje świat po grze i identyfikatorze świata', () => {
		expect(catalog.findWorld('g2nk', 'khorinis')).toBe(khorinis);
		expect(catalog.findWorld('g1', 'colony')).toBe(oldCamp);
	});

	it('nie znajduje świata z innej gry ani nieznanego', () => {
		expect(catalog.findWorld('g1', 'khorinis')).toBeUndefined();
		expect(catalog.findWorld('g3', 'myrtana')).toBeUndefined();
	});

	it('listuje wszystkie światy i buduje ścieżkę', () => {
		expect(catalog.listAllWorlds()).toEqual([oldCamp, khorinis]);
		expect(catalog.buildWorldPath(khorinis)).toBe('/g2nk/khorinis');
	});
});
