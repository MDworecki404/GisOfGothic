import { describe, expect, it } from 'vitest';
import { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import { EventBus } from '#lib/events/event-bus.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { ChapterFilter } from '#lib/services/chapters/chapter-filter.js';
import type { DataLayerPoint } from '#lib/services/map/data-layers-renderer.js';
import { TreasureSetBook } from '#lib/services/loot/treasure-set-book.js';
import { DataLayersCoordinator, type DataLayersDisplay } from './data-layers-coordinator.js';

function characterFeature(name: string, chapter: number | null): unknown {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [0, 0, 0] },
		properties: { id: name, code: name.toUpperCase(), name, chapter }
	};
}

const CHARACTERS_JSON = {
	type: 'FeatureCollection',
	features: [
		characterFeature('Harad', null),
		characterFeature('Biff', 5),
		characterFeature('Talbin', 4)
	]
};

class RecordingDisplay implements DataLayersDisplay {
	shownPoints = new Map<string, readonly DataLayerPoint[]>();

	showDataLayer(layerId: string, points: readonly DataLayerPoint[]): void {
		this.shownPoints.set(layerId, points);
	}

	hideDataLayer(layerId: string): void {
		this.shownPoints.delete(layerId);
	}
}

async function createCoordinatorWithCharactersShown(): Promise<{
	coordinator: DataLayersCoordinator;
	display: RecordingDisplay;
	identifiedTitles: (string | null)[];
}> {
	const eventBus = new EventBus<AppEvent>();
	const display = new RecordingDisplay();
	const identifiedTitles: (string | null)[] = [];
	eventBus.subscribe('feature-identified', ({ identification }) =>
		identifiedTitles.push(identification?.title ?? null)
	);
	const coordinator = new DataLayersCoordinator(eventBus, () => display, new TreasureSetBook());
	coordinator.useWorld(
		new GeoportalDataLoader(
			'/dane',
			async () => new Response(JSON.stringify(CHARACTERS_JSON), { status: 200 })
		),
		{}
	);
	await coordinator.toggleLayer('characters');
	return { coordinator, display, identifiedTitles };
}

describe('DataLayersCoordinator — rozdział', () => {
	it('bez filtra pokazuje wszystkie postacie', async () => {
		const { display } = await createCoordinatorWithCharactersShown();
		expect(display.shownPoints.get('characters')).toHaveLength(3);
	});

	it('wybrany rozdział ukrywa postacie wstawiane później', async () => {
		const { coordinator, display } = await createCoordinatorWithCharactersShown();
		coordinator.useChapterFilter(new ChapterFilter(4));
		expect(display.shownPoints.get('characters')).toHaveLength(2);
		coordinator.useChapterFilter(new ChapterFilter(null));
		expect(display.shownPoints.get('characters')).toHaveLength(3);
	});

	it('kliknięcie po filtrowaniu wskazuje postać z przefiltrowanej listy', async () => {
		const { coordinator, identifiedTitles } = await createCoordinatorWithCharactersShown();
		coordinator.useChapterFilter(new ChapterFilter(4));
		coordinator.identifyFeature({ layerId: 'characters', featureIndex: 1 });
		expect(identifiedTitles).toEqual(['Talbin']);
	});
});

const CONTAINERS_JSON = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [0, 0, 0] },
			properties: { id: 'container-0', treasure_sets: ['TS_Small'], model: 'previews/chest.glb' }
		}
	]
};

const TREASURE_SETS_JSON = {
	version: 1,
	sets: {
		TS_Small: {
			kind: 'chest',
			min_stacks: 1,
			max_stacks: 1,
			holders: 1,
			items: [{ code: 'It_Gold', name: 'Złoto', category: null, amount: 30 }]
		}
	}
};

describe('DataLayersCoordinator — losowy łup', () => {
	async function identifyContainer(treasureSetsStatus: number): Promise<(string[] | null)[]> {
		const eventBus = new EventBus<AppEvent>();
		const display = new RecordingDisplay();
		const possibleItemsHistory: (string[] | null)[] = [];
		eventBus.subscribe('feature-identified', ({ identification }) =>
			possibleItemsHistory.push(identification?.possibleItems ?? null)
		);
		const loader = new GeoportalDataLoader('/dane', async (url) =>
			url.endsWith('treasure_sets.json')
				? new Response(JSON.stringify(TREASURE_SETS_JSON), { status: treasureSetsStatus })
				: new Response(JSON.stringify(CONTAINERS_JSON), { status: 200 })
		);
		const treasureSetBook = new TreasureSetBook();
		treasureSetBook.useWorld(loader);
		const coordinator = new DataLayersCoordinator(eventBus, () => display, treasureSetBook);
		coordinator.useWorld(loader, {});
		await coordinator.toggleLayer('containers');
		coordinator.identifyFeature({ layerId: 'containers', featureIndex: 0 });
		await new Promise((resolve) => setTimeout(resolve, 0));
		return possibleItemsHistory;
	}

	it('najpierw pokazuje kartę, potem dopisuje możliwą zawartość z zestawów', async () => {
		expect(await identifyContainer(200)).toEqual([[], ['Złoto ×30']]);
	});

	it('zostawia samą kartę, gdy zestawów nie da się pobrać', async () => {
		expect(await identifyContainer(404)).toEqual([[]]);
	});

	it('nie dopisuje zawartości do zamkniętej karty', async () => {
		const eventBus = new EventBus<AppEvent>();
		const display = new RecordingDisplay();
		const history: (string[] | null)[] = [];
		eventBus.subscribe('feature-identified', ({ identification }) =>
			history.push(identification?.possibleItems ?? null)
		);
		const loader = new GeoportalDataLoader('/dane', async (url) =>
			url.endsWith('treasure_sets.json')
				? new Response(JSON.stringify(TREASURE_SETS_JSON), { status: 200 })
				: new Response(JSON.stringify(CONTAINERS_JSON), { status: 200 })
		);
		const treasureSetBook = new TreasureSetBook();
		treasureSetBook.useWorld(loader);
		const coordinator = new DataLayersCoordinator(eventBus, () => display, treasureSetBook);
		coordinator.useWorld(loader, {});
		await coordinator.toggleLayer('containers');
		coordinator.identifyFeature({ layerId: 'containers', featureIndex: 0 });
		coordinator.cancelPendingIdentification();
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(history).toEqual([[]]);
	});
});
