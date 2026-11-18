import { describe, expect, it } from 'vitest';
import type { Anchor } from '#lib/data/types.js';
import type { WorldDefinition } from '#lib/data/world-catalog.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import type { WorldExtent } from '#lib/services/map/world-extent-reader.js';
import type { SizeWorldPlacement } from '#lib/services/map/world-placement-calculator.js';
import {
	REFERENCE_WORLD_COLOR,
	SIZE_WORLD_COLORS,
	WorldSizeCoordinator,
	type WorldSizeDisplay,
	type WorldSizeView
} from './world-size-coordinator.js';

function createWorld(gameId: string, id: string): WorldDefinition {
	return {
		id,
		gameId,
		name: id,
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

const khorinis = createWorld('g2nk', 'khorinis');
const referenceExtent: WorldExtent = {
	centerEast: 500,
	centerNorth: 400,
	centerUp: 10,
	widthMetres: 1500,
	depthMetres: 1700
};
const anchor: Anchor = { lon: 0, lat: 0, h: 0 };

class FakeDisplay implements WorldSizeDisplay {
	shown: string[] = [];
	removed: string[] = [];
	placements = new Map<string, SizeWorldPlacement>();
	highlighted: string | null = null;
	selected: string | null = null;
	ghostColor: string | null = null;
	cleared = 0;
	extentsByKey = new Map<string, WorldExtent>();
	failingKeys = new Set<string>();

	async showSizeWorld(key: string): Promise<WorldExtent | null> {
		if (this.failingKeys.has(key)) throw new Error('brak sieci');
		this.shown.push(key);
		return (
			this.extentsByKey.get(key) ?? {
				centerEast: 100,
				centerNorth: 50,
				centerUp: 0,
				widthMetres: 3000,
				depthMetres: 3200
			}
		);
	}

	removeSizeWorld(key: string): void {
		this.removed.push(key);
	}

	placeSizeWorld(key: string, placement: SizeWorldPlacement): void {
		this.placements.set(key, placement);
	}

	highlightSizeWorld(key: string | null): void {
		this.highlighted = key;
	}

	selectSizeWorld(key: string | null): void {
		this.selected = key;
	}

	setPrimaryWorldGhost(tintCssColor: string | null): void {
		this.ghostColor = tintCssColor;
	}

	visibility = new Map<string, boolean>();
	naturalColors: boolean | null = null;
	opacity: number | null = null;

	setSizeWorldVisible(key: string, isVisible: boolean): void {
		this.visibility.set(key, isVisible);
	}

	setSizeWorldsNaturalColors(areNatural: boolean): void {
		this.naturalColors = areNatural;
	}

	setSizeWorldsOpacity(opacity: number): void {
		this.opacity = opacity;
	}

	clearSizeWorlds(): void {
		this.cleared++;
	}

	readPrimaryWorldExtent(): WorldExtent | null {
		return referenceExtent;
	}
}

function createCoordinator(): {
	coordinator: WorldSizeCoordinator;
	display: FakeDisplay;
	latest: () => WorldSizeView;
} {
	const eventBus = new EventBus<AppEvent>();
	let view: WorldSizeView | null = null;
	eventBus.subscribe('world-size-changed', (event) => {
		view = event.sizes;
	});
	const display = new FakeDisplay();
	const coordinator = new WorldSizeCoordinator(
		eventBus,
		() => display,
		() => Promise.resolve(anchor)
	);
	coordinator.usePrimaryWorld(khorinis, 'Gothic 2 — Khorinis');
	coordinator.activate();
	return {
		coordinator,
		display,
		latest: () => {
			if (!view) throw new Error('Brak stanu');
			return view;
		}
	};
}

describe('WorldSizeCoordinator', () => {
	it('po aktywacji zna obrys otwartego świata jako odniesienie', () => {
		const { latest } = createCoordinator();
		expect(latest().isActive).toBe(true);
		expect(latest().reference).toEqual({
			label: 'Gothic 2 — Khorinis',
			color: REFERENCE_WORLD_COLOR,
			isHighlighted: false,
			isVisible: true,
			widthMetres: 1500,
			depthMetres: 1700
		});
	});

	it('nowy świat staje środkiem obrysu na środku otwartego świata', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		const [world] = latest().worlds;
		expect(world).toMatchObject({
			key: 'g3/myrtana',
			status: 'ready',
			widthMetres: 3000,
			depthMetres: 3200,
			placement: { east: 400, north: 350, up: 10, headingDegrees: 0 }
		});
		expect(display.placements.get('g3/myrtana')).toEqual(world.placement);
		expect(world.color).toBe(SIZE_WORLD_COLORS[0]);
	});

	it('kolejny świat dostaje inną barwę, a odznaczenie zdejmuje go z mapy', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		await coordinator.toggleWorld(createWorld('archolos', 'archolos'));
		expect(latest().worlds.map((world) => world.color)).toEqual([
			SIZE_WORLD_COLORS[0],
			SIZE_WORLD_COLORS[1]
		]);
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		expect(latest().worlds.map((world) => world.key)).toEqual(['archolos/archolos']);
		expect(display.removed).toEqual(['g3/myrtana']);
	});

	it('nie pokazuje otwartego świata drugi raz i respektuje limit światów', async () => {
		const { coordinator, latest } = createCoordinator();
		await coordinator.toggleWorld(khorinis);
		expect(latest().worlds).toEqual([]);
		for (let index = 0; index < SIZE_WORLD_COLORS.length + 2; index++) {
			await coordinator.toggleWorld(createWorld('g2nk', `swiat-${index}`));
		}
		expect(latest().worlds).toHaveLength(SIZE_WORLD_COLORS.length);
		expect(latest().isLimitReached).toBe(true);
	});

	it('zmienia pozycję, a reset wraca do pozycji współśrodkowej', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		coordinator.setPlacement('g3/myrtana', { east: 0, headingDegrees: 45 });
		expect(display.placements.get('g3/myrtana')).toEqual({
			east: 0,
			north: 350,
			up: 10,
			headingDegrees: 45
		});
		coordinator.resetPlacement('g3/myrtana');
		expect(latest().worlds[0].placement).toEqual({
			east: 400,
			north: 350,
			up: 10,
			headingDegrees: 0
		});
	});

	it('przeciągnięcie myszą lub gizmem zapisuje pozycję bez ponownego ustawiania świata na mapie', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		const placementsBefore = display.placements.get('g3/myrtana');
		coordinator.reactToMapPlacement('g3/myrtana', {
			east: 10,
			north: 20,
			up: 5,
			headingDegrees: 30
		});
		expect(latest().worlds[0].placement).toEqual({
			east: 10,
			north: 20,
			up: 5,
			headingDegrees: 30
		});
		expect(display.placements.get('g3/myrtana')).toBe(placementsBefore);
	});

	it('otwarty świat staje się widmem po włączeniu narzędzia i wraca do zwykłego wyglądu po wyłączeniu', () => {
		const { coordinator, display, latest } = createCoordinator();
		expect(display.ghostColor).toBe(REFERENCE_WORLD_COLOR);
		expect(latest().reference?.color).toBe(REFERENCE_WORLD_COLOR);
		coordinator.deactivate();
		expect(display.ghostColor).toBeNull();
	});

	it('podświetlenie otwartego świata oznacza odniesienie, a nie żaden z dodanych', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		coordinator.highlight('reference');
		expect(display.highlighted).toBe('reference');
		expect(latest().reference?.isHighlighted).toBe(true);
		expect(latest().worlds[0].isHighlighted).toBe(false);
	});

	it('nowy świat jest wybrany (ma gizmo), a po usunięciu wybór przechodzi na ostatni', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		expect(latest().selectedKey).toBe('g3/myrtana');
		expect(display.selected).toBe('g3/myrtana');
		await coordinator.toggleWorld(createWorld('archolos', 'archolos'));
		expect(latest().selectedKey).toBe('archolos/archolos');
		coordinator.select('g3/myrtana');
		expect(display.selected).toBe('g3/myrtana');
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		expect(latest().selectedKey).toBe('archolos/archolos');
		await coordinator.toggleWorld(createWorld('archolos', 'archolos'));
		expect(latest().selectedKey).toBeNull();
		expect(display.selected).toBeNull();
	});

	it('nie wybiera świata, którego nie ma na liście', async () => {
		const { coordinator, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		coordinator.select('nie-ma/takiego');
		expect(latest().selectedKey).toBe('g3/myrtana');
	});

	it('barwy światów są różne i różnią się od barwy otwartego świata', () => {
		expect(new Set(SIZE_WORLD_COLORS).size).toBe(SIZE_WORLD_COLORS.length);
		expect(SIZE_WORLD_COLORS).not.toContain(REFERENCE_WORLD_COLOR);
	});

	it('podświetlenie z listy i z mapy oznacza świat, a lista ma pierwszeństwo', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		await coordinator.toggleWorld(createWorld('archolos', 'archolos'));
		coordinator.reactToMapHover('archolos/archolos');
		expect(latest().worlds.map((world) => world.isHighlighted)).toEqual([false, true]);
		coordinator.highlight('g3/myrtana');
		expect(display.highlighted).toBe('g3/myrtana');
		expect(latest().worlds.map((world) => world.isHighlighted)).toEqual([true, false]);
	});

	it('błąd wczytania daje stan błędu z komunikatem', async () => {
		const { coordinator, display, latest } = createCoordinator();
		display.failingKeys.add('g3/myrtana');
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		expect(latest().worlds[0]).toMatchObject({ status: 'error', errorMessage: 'brak sieci' });
	});

	it('dezaktywacja i zmiana otwartego świata czyszczą mapę', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		coordinator.usePrimaryWorld(createWorld('g1', 'kolonia'));
		expect(latest().worlds).toEqual([]);
		expect(display.cleared).toBeGreaterThan(0);
		coordinator.deactivate();
		expect(latest().isActive).toBe(false);
	});

	it('nie dodaje światów, gdy narzędzie nie jest aktywne', async () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.deactivate();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		expect(latest().worlds).toEqual([]);
	});

	it('chowa i pokazuje świat oraz odniesienie bez rozładowywania', async () => {
		const { coordinator, display, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		coordinator.toggleVisibility('g3/myrtana');
		expect(latest().worlds[0].isVisible).toBe(false);
		expect(display.visibility.get('g3/myrtana')).toBe(false);
		expect(display.removed).not.toContain('g3/myrtana');
		coordinator.toggleVisibility('reference');
		expect(latest().reference?.isVisible).toBe(false);
		coordinator.toggleVisibility('g3/myrtana');
		expect(latest().worlds[0].isVisible).toBe(true);
	});

	it('przełącznik wszystkich zostawia widoczny tylko otwarty świat, a drugie wciśnięcie pokazuje wszystkie', async () => {
		const { coordinator, latest } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		coordinator.toggleAllVisibility();
		expect(latest().worlds.every((world) => !world.isVisible)).toBe(true);
		expect(latest().reference?.isVisible).toBe(true);
		coordinator.toggleAllVisibility();
		expect(latest().worlds.every((world) => world.isVisible)).toBe(true);
	});

	it('prawdziwe kolory zwiększają nieprzezroczystość, o ile użytkownik jej nie ustawił', () => {
		const { coordinator, display, latest } = createCoordinator();
		coordinator.setNaturalColors(true);
		expect(display.naturalColors).toBe(true);
		expect(latest().areColorsNatural).toBe(true);
		expect(latest().opacity).toBeGreaterThan(0.5);
		coordinator.setNaturalColors(false);
		expect(latest().opacity).toBe(0.5);
		coordinator.setOpacity(0.3);
		coordinator.setNaturalColors(true);
		expect(latest().opacity).toBe(0.3);
		expect(display.opacity).toBe(0.3);
	});

	it('układ w rzędzie ustawia wczytane światy na wschód od otwartego', async () => {
		const { coordinator, display } = createCoordinator();
		await coordinator.toggleWorld(createWorld('g3', 'myrtana'));
		coordinator.arrangeWorlds('row');
		const placement = display.placements.get('g3/myrtana');
		expect(placement).toBeDefined();
		expect(placement?.east).toBeGreaterThan(referenceExtent.centerEast);
	});

	it('dezaktywacja przywraca wygląd domyślny', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.setNaturalColors(true);
		coordinator.toggleVisibility('reference');
		coordinator.deactivate();
		coordinator.activate();
		expect(latest().areColorsNatural).toBe(false);
		expect(latest().reference?.isVisible ?? true).toBe(true);
	});
});
