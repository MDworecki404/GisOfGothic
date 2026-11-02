import { describe, expect, it } from 'vitest';
import type { Anchor } from '#lib/data/types.js';
import type { WorldDefinition } from '#lib/data/world-catalog.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import {
	WorldComparisonCoordinator,
	type WorldComparisonDisplay,
	type WorldComparisonView
} from './world-comparison-coordinator.js';

function createWorld(gameId: string, id: string, name: string): WorldDefinition {
	return {
		id,
		gameId,
		name,
		localCoordinateSystemName: '',
		dataBaseUrl: `/data/${gameId}/${id}`,
		modelNamespace: `${gameId}/${id}`,
		protectedModelsUrl: '',
		worldTilesetUrl: `https://gate/${id}/tileset.json`,
		staticObjectsTilesetUrls: [],
		hasChapters: true,
		hasApproximateRoutineTimes: false,
		tileColorGrade: null
	};
}

const khorinis = createWorld('g2nk', 'khorinis', 'Khorinis');
const kolonia = createWorld('g1', 'kolonia', 'Górnicza Dolina');
const archolos = createWorld('archolos', 'archolos', 'Archolos');
const anchor: Anchor = { lon: 0, lat: 0, h: 0 };

class FakeDisplay implements WorldComparisonDisplay {
	shownTilesets: string[] = [];
	removals = 0;
	splitPosition: number | null = null;
	pendingShow: (() => void) | null = null;
	shouldWaitForRelease = false;

	async showComparisonTileset(tilesetUrl: string): Promise<void> {
		if (this.shouldWaitForRelease) {
			await new Promise<void>((resolve) => (this.pendingShow = resolve));
		}
		this.shownTilesets.push(tilesetUrl);
	}

	removeComparisonTileset(): void {
		this.removals++;
	}

	setComparisonSplitPosition(fraction: number): void {
		this.splitPosition = fraction;
	}
}

function createCoordinator(loadAnchor = (): Promise<Anchor> => Promise.resolve(anchor)): {
	coordinator: WorldComparisonCoordinator;
	display: FakeDisplay;
	latest: () => WorldComparisonView;
} {
	const eventBus = new EventBus<AppEvent>();
	let view: WorldComparisonView | null = null;
	eventBus.subscribe('world-comparison-changed', (event) => {
		view = event.comparison;
	});
	const display = new FakeDisplay();
	const coordinator = new WorldComparisonCoordinator(eventBus, () => display, loadAnchor);
	coordinator.usePrimaryWorld(khorinis);
	return {
		coordinator,
		display,
		latest: () => {
			if (!view) throw new Error('Brak stanu porównania');
			return view;
		}
	};
}

describe('WorldComparisonCoordinator', () => {
	it('porównanie kładzie drugi świat na mapie i ustawia podział', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.start(kolonia, 'Gothic — Górnicza Dolina');
		expect(display.shownTilesets).toEqual(['https://gate/kolonia/tileset.json']);
		expect(display.splitPosition).toBe(0.5);
		expect(latest()).toMatchObject({
			status: 'ready',
			primaryWorldName: 'Khorinis',
			comparedWorldName: 'Gothic — Górnicza Dolina'
		});
	});

	it('nie porównuje świata z nim samym', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.start(khorinis);
		expect(display.shownTilesets).toEqual([]);
		expect(latest().status).toBe('inactive');
	});

	it('pozycja podziału jest przycinana do brzegów', () => {
		const { coordinator, display, latest } = createCoordinator();
		coordinator.setSplitFraction(2);
		expect(display.splitPosition).toBe(0.97);
		coordinator.setSplitFraction(-1);
		expect(latest().splitFraction).toBe(0.03);
	});

	it('zakończenie zdejmuje drugi świat, a zmiana świata otwartego kończy porównanie', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.start(kolonia);
		coordinator.stop();
		expect(latest().status).toBe('inactive');
		expect(latest().comparedWorldName).toBeNull();
		await coordinator.start(archolos);
		coordinator.usePrimaryWorld(kolonia);
		expect(latest().status).toBe('inactive');
		expect(display.removals).toBeGreaterThanOrEqual(2);
	});

	it('błąd wczytania daje stan błędu z komunikatem', async () => {
		const { coordinator, latest } = createCoordinator(() =>
			Promise.reject(new Error('brak sieci'))
		);
		await coordinator.start(kolonia);
		expect(latest()).toMatchObject({ status: 'error', errorMessage: 'brak sieci' });
	});

	it('wynik starszego wczytania jest pomijany po zmianie wyboru', async () => {
		const { coordinator, display, latest } = createCoordinator();
		display.shouldWaitForRelease = true;
		const first = coordinator.start(kolonia);
		await Promise.resolve();
		await Promise.resolve();
		display.shouldWaitForRelease = false;
		await coordinator.start(archolos);
		display.pendingShow?.();
		await first;
		expect(latest().comparedWorldName).toBe('Archolos');
		expect(display.shownTilesets).toEqual([
			'https://gate/archolos/tileset.json',
			'https://gate/kolonia/tileset.json'
		]);
		expect(latest().status).toBe('ready');
	});

	it('po ponownym utworzeniu mapy kładzie porównywany świat od nowa', async () => {
		const { coordinator, display } = createCoordinator();
		await coordinator.start(kolonia);
		await coordinator.showOnMap();
		expect(display.shownTilesets).toHaveLength(2);
	});
});
