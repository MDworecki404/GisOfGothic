import { describe, expect, it } from 'vitest';
import {
	clampFieldOfViewDegrees,
	DEFAULT_CAMERA_PROJECTION,
	isCameraProjectionSetting,
	isDefaultCameraProjection
} from './camera-projection.js';
import { CameraProjectionCodec } from './camera-projection-codec.js';

const codec = new CameraProjectionCodec();

describe('CameraProjectionCodec', () => {
	it('ustawienie domyślne nie trafia do adresu', () => {
		expect(codec.serialize(DEFAULT_CAMERA_PROJECTION)).toBeNull();
	});

	it('zapisuje rzut ortogonalny jako o', () => {
		expect(codec.serialize({ kind: 'orthographic' })).toBe('o');
	});

	it('zapisuje perspektywę z niedomyślnym FOV jako p_<fov>', () => {
		expect(codec.serialize({ kind: 'perspective', fovDegrees: 75 })).toBe('p_75');
	});

	it('odczytuje o i p_75', () => {
		expect(codec.parse('o')).toEqual({ kind: 'orthographic' });
		expect(codec.parse('p_75')).toEqual({ kind: 'perspective', fovDegrees: 75 });
	});

	it('odrzuca FOV poza zakresem, nie-liczby i nieznane teksty', () => {
		for (const text of ['p_5', 'p_101', 'p_abc', 'p_', 'x', '']) {
			expect(codec.parse(text)).toBeNull();
		}
	});

	it('odczyt odtwarza to, co zapisano', () => {
		for (const setting of [
			{ kind: 'orthographic' },
			{ kind: 'perspective', fovDegrees: 45 }
		] as const) {
			const text = codec.serialize(setting);
			expect(text === null ? null : codec.parse(text)).toEqual(setting);
		}
	});
});

describe('clampFieldOfViewDegrees', () => {
	it('przycina do 30–100 i zaokrągla do całości', () => {
		expect(clampFieldOfViewDegrees(10)).toBe(30);
		expect(clampFieldOfViewDegrees(150)).toBe(100);
		expect(clampFieldOfViewDegrees(60.4)).toBe(60);
	});
});

describe('isDefaultCameraProjection', () => {
	it('rozpoznaje perspektywę 60° jako domyślną', () => {
		expect(isDefaultCameraProjection({ kind: 'perspective', fovDegrees: 60 })).toBe(true);
		expect(isDefaultCameraProjection({ kind: 'perspective', fovDegrees: 61 })).toBe(false);
		expect(isDefaultCameraProjection({ kind: 'orthographic' })).toBe(false);
	});
});

describe('isCameraProjectionSetting', () => {
	it('przyjmuje poprawne ustawienia', () => {
		expect(isCameraProjectionSetting({ kind: 'orthographic' })).toBe(true);
		expect(isCameraProjectionSetting({ kind: 'perspective', fovDegrees: 45 })).toBe(true);
	});

	it('odrzuca ustawienia bez FOV, z FOV poza zakresem i nie-obiekty', () => {
		expect(isCameraProjectionSetting({ kind: 'perspective' })).toBe(false);
		expect(isCameraProjectionSetting({ kind: 'perspective', fovDegrees: 5 })).toBe(false);
		expect(isCameraProjectionSetting(null)).toBe(false);
		expect(isCameraProjectionSetting('o')).toBe(false);
	});
});
