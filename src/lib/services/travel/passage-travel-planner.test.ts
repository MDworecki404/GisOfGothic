import { describe, expect, it } from 'vitest';
import { WorldCatalog, type WorldDefinition } from '#lib/data/world-catalog.js';
import { PassageTravelPlanner } from './passage-travel-planner.js';

const TARGET_WORLD: WorldDefinition = {
	id: 'gornicza-dolina',
	gameId: 'g2nk',
	name: 'Górnicza Dolina',
	localCoordinateSystemName: 'Układ testowy',
	dataBaseUrl: '/data/g2nk/gornicza-dolina',
	modelNamespace: 'g2nk/gornicza-dolina',
	protectedModelsUrl: '',
	worldTilesetUrl: '',
	staticObjectsTilesetUrls: [],
	hasChapters: true,
	hasApproximateRoutineTimes: false,
	tileColorGrade: null
};
const CATALOG = new WorldCatalog(
	[{ id: 'g2nk', name: 'Gothic II', worlds: [TARGET_WORLD] }],
	TARGET_WORLD
);
const ANCHOR = { lon: 0, lat: 0, h: 0 };

describe('PassageTravelPlanner', () => {
	const planner = new PassageTravelPlanner(CATALOG, async () => ANCHOR);

	it('zwraca świat docelowy bez widoku, gdy nie znamy punktu przybycia', async () => {
		const target = await planner.planTravel({ toWorld: 'g2nk/gornicza-dolina', arrival: null });
		expect(target).toEqual({ gameId: 'g2nk', worldId: 'gornicza-dolina', query: '' });
	});

	it('ustawia kamerę na południe od punktu przybycia, nad nim', async () => {
		const target = await planner.planTravel({
			toWorld: 'g2nk/gornicza-dolina',
			arrival: { lon: 0, lat: 0, h: 100 }
		});
		expect(target?.query).toMatch(/^\?widok=0_-69\.\d_140_0_-30$/);
	});

	it('nie planuje podróży do świata spoza katalogu', async () => {
		expect(await planner.planTravel({ toWorld: 'g1/nie-ma', arrival: null })).toBeNull();
	});
});
