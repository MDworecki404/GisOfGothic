import { describe, expect, it } from 'vitest';
import type { CameraProjectionSetting } from '#lib/services/camera/camera-projection.js';
import type { ViewMode } from '#lib/services/camera/view-mode.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { BookmarkStore } from './bookmarks/bookmark-store.js';
import { GeoportalFacade } from './geoportal-facade.js';
import { PerformancePreferenceStore } from './performance/performance-preference-store.js';

function createFacade() {
	const eventBus = new EventBus<AppEvent>();
	let projection: CameraProjectionSetting = { kind: 'perspective', fovDegrees: 60 };
	let mode: ViewMode = 'view-3d';
	let sliceHeightMetres: number | null = null;
	eventBus.subscribe('camera-projection-changed', (event) => (projection = event.projection));
	eventBus.subscribe('view-mode-changed', (event) => {
		mode = event.mode;
		sliceHeightMetres = event.sliceHeightMetres;
	});
	const facade = new GeoportalFacade(
		eventBus,
		() => {
			throw new Error('Bez otwartego świata ładowanie danych nie powinno być potrzebne');
		},
		new BookmarkStore(null),
		null,
		new PerformancePreferenceStore(null)
	);
	return {
		facade,
		readProjection: () => projection,
		readMode: () => mode,
		readSliceHeight: () => sliceHeightMetres
	};
}

describe('GeoportalFacade: widok 2D', () => {
	it('w 2D wybór perspektywy nie zmienia rzutu ani trybu', () => {
		const { facade, readProjection, readMode } = createFacade();
		facade.selectViewMode('view-2d');
		facade.selectCameraProjection('perspective');
		expect(readMode()).toBe('view-2d');
		expect(readProjection()).toEqual({ kind: 'orthographic' });
	});

	it('w 2D przełączenie rzutu (klawisz P) nie zmienia rzutu', () => {
		const { facade, readProjection } = createFacade();
		facade.selectViewMode('view-2d');
		facade.toggleCameraProjection();
		expect(readProjection()).toEqual({ kind: 'orthographic' });
	});

	it('po wyjściu z 2D rzut można znów zmieniać', () => {
		const { facade, readProjection } = createFacade();
		facade.selectViewMode('view-2d');
		facade.selectViewMode('view-3d');
		facade.toggleCameraProjection();
		expect(readProjection()).toEqual({ kind: 'orthographic' });
	});

	it('link z trybem 2D i cięciem odtwarza oba', () => {
		const { facade, readMode, readSliceHeight } = createFacade();
		facade.openSharedView('?tryb=2d&ciecie=40&narzedzie=zamkniete');
		expect(readMode()).toBe('view-2d');
		expect(readSliceHeight()).toBe(40);
	});

	it('link z samym cięciem zostaje w 3D bez cięcia', () => {
		const { facade, readMode, readSliceHeight } = createFacade();
		facade.openSharedView('?ciecie=40&narzedzie=zamkniete');
		expect(readMode()).toBe('view-3d');
		expect(readSliceHeight()).toBeNull();
	});

	it('cięcie ustawiane w 3D jest ignorowane', () => {
		const { facade, readSliceHeight } = createFacade();
		facade.setSliceHeight(10);
		expect(readSliceHeight()).toBeNull();
	});
});
