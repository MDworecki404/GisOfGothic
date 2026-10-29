import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { CameraProjectionCoordinator } from './camera-projection-coordinator.js';
import { ViewModeCoordinator, type ViewModeDisplay } from './view-mode-coordinator.js';
import { clampSliceHeight, type SliceHeightRange, type ViewMode } from './view-mode.js';

interface PublishedMode {
	mode: ViewMode;
	sliceHeightMetres: number | null;
}

function setUp(hasDisplay = true) {
	const eventBus = new EventBus<AppEvent>();
	const shownModes: { mode: ViewMode; flightSeconds: number }[] = [];
	const shownSliceHeights: (number | null)[] = [];
	const publishedModes: PublishedMode[] = [];
	const publishedRanges: (SliceHeightRange | null)[] = [];
	eventBus.subscribe('view-mode-changed', ({ mode, sliceHeightMetres }) =>
		publishedModes.push({ mode, sliceHeightMetres })
	);
	eventBus.subscribe('slice-height-range-changed', ({ range }) => publishedRanges.push(range));
	const display: ViewModeDisplay = {
		showViewMode: (mode, flightSeconds) => shownModes.push({ mode, flightSeconds }),
		showSliceHeight: (metres) => shownSliceHeights.push(metres)
	};
	const projection = new CameraProjectionCoordinator(eventBus, () => null);
	const coordinator = new ViewModeCoordinator(
		eventBus,
		() => (hasDisplay ? display : null),
		projection
	);
	return {
		coordinator,
		projection,
		shownModes,
		shownSliceHeights,
		publishedModes,
		publishedRanges
	};
}

describe('ViewModeCoordinator', () => {
	it('wejście w 2D wymusza rzut ortogonalny i pokazuje tryb na mapie', () => {
		const { coordinator, projection, shownModes, publishedModes } = setUp();
		coordinator.selectMode('view-2d');
		expect(projection.currentSetting).toEqual({ kind: 'orthographic' });
		expect(shownModes).toEqual([{ mode: 'view-2d', flightSeconds: 1 }]);
		expect(publishedModes).toEqual([{ mode: 'view-2d', sliceHeightMetres: null }]);
	});

	it('wyjście z 2D przywraca rzut i kąt widzenia sprzed wejścia oraz zdejmuje cięcie', () => {
		const { coordinator, projection, shownSliceHeights, publishedModes } = setUp();
		projection.setFieldOfView(75);
		coordinator.selectMode('view-2d');
		coordinator.setSliceHeight(40);
		coordinator.selectMode('view-3d');
		expect(projection.currentSetting).toEqual({ kind: 'perspective', fovDegrees: 75 });
		expect(coordinator.currentSliceHeightMetres).toBeNull();
		expect(shownSliceHeights.at(-1)).toBeNull();
		expect(publishedModes.at(-1)).toEqual({ mode: 'view-3d', sliceHeightMetres: null });
	});

	it('cięcie w 3D jest ignorowane', () => {
		const { coordinator, shownSliceHeights, publishedModes } = setUp();
		coordinator.setSliceHeight(120);
		expect(coordinator.currentSliceHeightMetres).toBeNull();
		expect(shownSliceHeights).toEqual([]);
		expect(publishedModes).toEqual([]);
	});

	it('cięcie w 2D trafia do mapy i do zdarzenia', () => {
		const { coordinator, shownSliceHeights, publishedModes } = setUp();
		coordinator.selectMode('view-2d');
		coordinator.setSliceHeight(120);
		expect(shownSliceHeights).toEqual([120]);
		expect(publishedModes.at(-1)).toEqual({ mode: 'view-2d', sliceHeightMetres: 120 });
	});

	it('wartość nieskończona lub NaN oznacza brak cięcia', () => {
		const { coordinator } = setUp();
		coordinator.selectMode('view-2d');
		coordinator.setSliceHeight(120);
		coordinator.setSliceHeight(Number.NaN);
		expect(coordinator.currentSliceHeightMetres).toBeNull();
		coordinator.setSliceHeight(Number.POSITIVE_INFINITY);
		expect(coordinator.currentSliceHeightMetres).toBeNull();
	});

	it('nowy zakres wysokości przycina bieżące cięcie i jest publikowany', () => {
		const { coordinator, shownSliceHeights, publishedModes, publishedRanges } = setUp();
		coordinator.selectMode('view-2d');
		coordinator.setSliceHeight(120);
		coordinator.useSliceRange({ minimumMetres: 0, maximumMetres: 100 });
		expect(coordinator.currentSliceHeightMetres).toBe(100);
		expect(shownSliceHeights.at(-1)).toBe(100);
		expect(publishedModes.at(-1)).toEqual({ mode: 'view-2d', sliceHeightMetres: 100 });
		expect(publishedRanges).toEqual([{ minimumMetres: 0, maximumMetres: 100 }]);
	});

	it('brak zakresu zostawia cięcie bez zmian', () => {
		const { coordinator } = setUp();
		coordinator.selectMode('view-2d');
		coordinator.setSliceHeight(120);
		coordinator.useSliceRange(null);
		expect(coordinator.currentSliceHeightMetres).toBe(120);
	});

	it('odtworzenie 2D ustawia ortho i cięcie bez lotu', () => {
		const { coordinator, projection, shownModes, shownSliceHeights } = setUp();
		coordinator.restore({ mode: 'view-2d', sliceHeightMetres: 40 }, null);
		expect(projection.currentSetting).toEqual({ kind: 'orthographic' });
		expect(coordinator.currentSliceHeightMetres).toBe(40);
		expect(shownModes.at(-1)).toEqual({ mode: 'view-2d', flightSeconds: 0 });
		expect(shownSliceHeights.at(-1)).toBe(40);
	});

	it('odtworzenie 3D ignoruje cięcie i ustawia podany rzut', () => {
		const { coordinator, projection } = setUp();
		coordinator.restore(
			{ mode: 'view-3d', sliceHeightMetres: 40 },
			{ kind: 'perspective', fovDegrees: 45 }
		);
		expect(coordinator.currentMode).toBe('view-3d');
		expect(coordinator.currentSliceHeightMetres).toBeNull();
		expect(projection.currentSetting).toEqual({ kind: 'perspective', fovDegrees: 45 });
	});

	it('odtworzenie 3D, gdy trwa 2D, opuszcza 2D i ustawia podany rzut', () => {
		const { coordinator, projection } = setUp();
		coordinator.selectMode('view-2d');
		coordinator.restore({ mode: 'view-3d', sliceHeightMetres: null }, { kind: 'orthographic' });
		expect(coordinator.currentMode).toBe('view-3d');
		expect(projection.currentSetting).toEqual({ kind: 'orthographic' });
	});

	it('pokazanie na mapie stosuje bieżący tryb bez lotu', () => {
		const { coordinator, shownModes, shownSliceHeights } = setUp();
		coordinator.selectMode('view-2d');
		coordinator.setSliceHeight(55);
		shownModes.length = 0;
		shownSliceHeights.length = 0;
		coordinator.showOnMap();
		expect(shownModes).toEqual([{ mode: 'view-2d', flightSeconds: 0 }]);
		expect(shownSliceHeights).toEqual([55]);
	});

	it('bez mapy publikuje zdarzenia i nie rzuca', () => {
		const { coordinator, publishedModes } = setUp(false);
		coordinator.selectMode('view-2d');
		expect(publishedModes).toHaveLength(1);
		expect(() => coordinator.showOnMap()).not.toThrow();
	});
});

describe('clampSliceHeight', () => {
	const range: SliceHeightRange = { minimumMetres: -20, maximumMetres: 300 };

	it('przycina do zakresu', () => {
		expect(clampSliceHeight(400, range)).toBe(300);
		expect(clampSliceHeight(-50, range)).toBe(-20);
		expect(clampSliceHeight(10, range)).toBe(10);
	});

	it('bez zakresu zwraca wartość bez zmian', () => {
		expect(clampSliceHeight(1234, null)).toBe(1234);
	});

	it('wartość nieskończona lub NaN daje null', () => {
		expect(clampSliceHeight(Number.NaN, range)).toBeNull();
		expect(clampSliceHeight(Number.NEGATIVE_INFINITY, null)).toBeNull();
	});
});
