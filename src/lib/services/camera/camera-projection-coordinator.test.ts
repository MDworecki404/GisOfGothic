import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import type { CameraProjectionSetting } from './camera-projection.js';
import {
	CameraProjectionCoordinator,
	type CameraProjectionDisplay
} from './camera-projection-coordinator.js';

function setUp(hasDisplay = true) {
	const eventBus = new EventBus<AppEvent>();
	const shown: CameraProjectionSetting[] = [];
	const published: { projection: CameraProjectionSetting; fieldOfViewDegrees: number }[] = [];
	eventBus.subscribe('camera-projection-changed', ({ projection, fieldOfViewDegrees }) =>
		published.push({ projection, fieldOfViewDegrees })
	);
	const display: CameraProjectionDisplay = {
		showCameraProjection: (setting) => shown.push(setting)
	};
	const coordinator = new CameraProjectionCoordinator(eventBus, () =>
		hasDisplay ? display : null
	);
	return { coordinator, shown, published };
}

describe('CameraProjectionCoordinator', () => {
	it('wybór rzutu ortogonalnego trafia do mapy i do zdarzenia', () => {
		const { coordinator, shown, published } = setUp();
		coordinator.selectKind('orthographic');
		expect(shown).toEqual([{ kind: 'orthographic' }]);
		expect(published).toEqual([{ projection: { kind: 'orthographic' }, fieldOfViewDegrees: 60 }]);
		expect(coordinator.currentSetting).toEqual({ kind: 'orthographic' });
	});

	it('przełączenie zmienia rzut na przeciwny i wraca z poprzednim FOV', () => {
		const { coordinator } = setUp();
		coordinator.setFieldOfView(75);
		coordinator.toggleKind();
		expect(coordinator.currentSetting).toEqual({ kind: 'orthographic' });
		coordinator.toggleKind();
		expect(coordinator.currentSetting).toEqual({ kind: 'perspective', fovDegrees: 75 });
	});

	it('przycina FOV do zakresu 30–100', () => {
		const { coordinator } = setUp();
		coordinator.setFieldOfView(150);
		expect(coordinator.currentSetting).toEqual({ kind: 'perspective', fovDegrees: 100 });
		coordinator.setFieldOfView(1);
		expect(coordinator.currentSetting).toEqual({ kind: 'perspective', fovDegrees: 30 });
	});

	it('zmiana FOV w rzucie ortogonalnym zostaje zapamiętana, ale nie zmienia rzutu', () => {
		const { coordinator, published } = setUp();
		coordinator.selectKind('orthographic');
		coordinator.setFieldOfView(75);
		expect(coordinator.currentSetting).toEqual({ kind: 'orthographic' });
		expect(published.at(-1)).toEqual({
			projection: { kind: 'orthographic' },
			fieldOfViewDegrees: 75
		});
		coordinator.selectKind('perspective');
		expect(coordinator.currentSetting).toEqual({ kind: 'perspective', fovDegrees: 75 });
	});

	it('odtworzenie null daje domyślną perspektywę 60°', () => {
		const { coordinator } = setUp();
		coordinator.selectKind('orthographic');
		coordinator.restore(null);
		expect(coordinator.currentSetting).toEqual({ kind: 'perspective', fovDegrees: 60 });
	});

	it('odtworzenie perspektywy ustawia jej FOV', () => {
		const { coordinator, shown } = setUp();
		coordinator.restore({ kind: 'perspective', fovDegrees: 45 });
		expect(coordinator.currentSetting).toEqual({ kind: 'perspective', fovDegrees: 45 });
		expect(shown.at(-1)).toEqual({ kind: 'perspective', fovDegrees: 45 });
	});

	it('pokazanie na mapie stosuje bieżące ustawienie', () => {
		const { coordinator, shown } = setUp();
		coordinator.selectKind('orthographic');
		shown.length = 0;
		coordinator.showOnMap();
		expect(shown).toEqual([{ kind: 'orthographic' }]);
	});

	it('bez mapy publikuje zdarzenia i nie rzuca', () => {
		const { coordinator, published } = setUp(false);
		coordinator.toggleKind();
		expect(published).toHaveLength(1);
		expect(() => coordinator.showOnMap()).not.toThrow();
	});
});
