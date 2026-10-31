import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { hasAnyMapOverlay, type MapOverlays } from './map-overlays.js';
import { MapOverlaysCoordinator } from './map-overlays-coordinator.js';

function setUp(isMapReady = true) {
	const eventBus = new EventBus<AppEvent>();
	const shownOverlays: MapOverlays[] = [];
	const publishedOverlays: MapOverlays[] = [];
	eventBus.subscribe('map-overlays-changed', ({ overlays }) => publishedOverlays.push(overlays));
	const coordinator = new MapOverlaysCoordinator(eventBus, () =>
		isMapReady ? { showMapOverlays: (overlays) => shownOverlays.push(overlays) } : null
	);
	return { coordinator, shownOverlays, publishedOverlays };
}

describe('MapOverlaysCoordinator', () => {
	it('domyślnie nie pokazuje żadnej nakładki', () => {
		expect(hasAnyMapOverlay(setUp().coordinator.currentOverlays)).toBe(false);
	});

	it('przełączenie poziomic włącza je i pokazuje na mapie', () => {
		const { coordinator, shownOverlays, publishedOverlays } = setUp();
		coordinator.toggleOverlay('areContoursVisible');
		expect(coordinator.currentOverlays).toEqual({ areContoursVisible: true, isGridVisible: false });
		expect(shownOverlays).toEqual([{ areContoursVisible: true, isGridVisible: false }]);
		expect(publishedOverlays).toEqual(shownOverlays);
	});

	it('poziomice i siatka przełączają się niezależnie, a drugie przełączenie wyłącza nakładkę', () => {
		const { coordinator } = setUp();
		coordinator.toggleOverlay('areContoursVisible');
		coordinator.toggleOverlay('isGridVisible');
		expect(coordinator.currentOverlays).toEqual({ areContoursVisible: true, isGridVisible: true });
		coordinator.toggleOverlay('areContoursVisible');
		expect(coordinator.currentOverlays).toEqual({ areContoursVisible: false, isGridVisible: true });
	});

	it('bez mapy zapamiętuje wybór i pokazuje go po wczytaniu świata', () => {
		const eventBus = new EventBus<AppEvent>();
		const shownOverlays: MapOverlays[] = [];
		let isMapReady = false;
		const coordinator = new MapOverlaysCoordinator(eventBus, () =>
			isMapReady ? { showMapOverlays: (overlays) => shownOverlays.push(overlays) } : null
		);
		coordinator.toggleOverlay('isGridVisible');
		isMapReady = true;
		coordinator.showOnMap();
		expect(shownOverlays).toEqual([{ areContoursVisible: false, isGridVisible: true }]);
	});
});
