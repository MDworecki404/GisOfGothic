import { describe, expect, it } from 'vitest';
import { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import { EventBus } from '#lib/events/event-bus.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { ChapterFilter } from '#lib/services/chapters/chapter-filter.js';
import type { DataLayerPoint } from '#lib/services/map/data-layers-renderer.js';
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
	const coordinator = new DataLayersCoordinator(eventBus, () => display);
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
