import { describe, expect, it } from 'vitest';
import { PreviewCameraMath } from './preview-camera-math.js';

const math = new PreviewCameraMath();

describe('PreviewCameraMath', () => {
	it('ogranicza przechył do dozwolonego zakresu', () => {
		expect(math.clampPitchDegrees(-120)).toBe(-85);
		expect(math.clampPitchDegrees(40)).toBe(10);
		expect(math.clampPitchDegrees(-30)).toBe(-30);
	});

	it('przeciągnięcie w dół zwiększa nachylenie ku górze modelu, a w prawo obraca model', () => {
		const dragged = math.dragAngles({ headingDegrees: 0, pitchDegrees: -30 }, 0, 20);
		expect(dragged.pitchDegrees).toBeLessThan(-30);
		const turned = math.dragAngles({ headingDegrees: 0, pitchDegrees: -30 }, 50, 0);
		expect(turned.headingDegrees).not.toBe(0);
		expect(turned.pitchDegrees).toBe(-30);
	});

	it('przeciągnięcie nie wychodzi poza limity przechyłu', () => {
		const dragged = math.dragAngles({ headingDegrees: 0, pitchDegrees: -80 }, 0, 10000);
		expect(dragged.pitchDegrees).toBe(-85);
	});

	it('zawija kurs do zakresu 0–360', () => {
		const turned = math.dragAngles({ headingDegrees: 350, pitchDegrees: -30 }, -100, 0);
		expect(turned.headingDegrees).toBeGreaterThanOrEqual(0);
		expect(turned.headingDegrees).toBeLessThan(360);
	});

	it('zoom ogranicza odległość do przedziału', () => {
		expect(math.zoomRange(10, 0.1, 5, 40)).toBe(5);
		expect(math.zoomRange(10, 100, 5, 40)).toBe(40);
		expect(math.zoomRange(10, 2, 5, 40)).toBe(20);
	});

	it('kółko w górę przybliża, w dół oddala; szczypanie przybliża przy rozsuwaniu palców', () => {
		expect(math.wheelZoomFactor(-100)).toBeLessThan(1);
		expect(math.wheelZoomFactor(100)).toBeGreaterThan(1);
		expect(math.pinchZoomFactor(100, 200)).toBeCloseTo(0.5);
		expect(math.pinchZoomFactor(100, 0)).toBe(1);
	});

	it('automatyczny obrót zależy od upływu czasu i zawija kurs', () => {
		expect(math.advanceAutoRotation(0, 1000)).toBeCloseTo(24);
		expect(math.advanceAutoRotation(350, 1000)).toBeCloseTo(14);
		expect(math.advanceAutoRotation(10, 0)).toBe(10);
	});
});
