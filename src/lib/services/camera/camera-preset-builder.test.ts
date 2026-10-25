import { describe, expect, it } from 'vitest';
import { CameraPresetBuilder } from './camera-preset-builder.js';

const builder = new CameraPresetBuilder();
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

describe('CameraPresetBuilder', () => {
	it('widok z góry ustawia północ u góry i prawie pionowe nachylenie', () => {
		const orientation = builder.build('top', 1.2);
		expect(orientation.headingRadians).toBe(0);
		expect(orientation.pitchRadians).toBeCloseTo(toRadians(-89.99), 6);
	});

	it('widok skośny zachowuje kierunek i pochyla o 50 stopni', () => {
		const orientation = builder.build('oblique', 1.2);
		expect(orientation.headingRadians).toBe(1.2);
		expect(orientation.pitchRadians).toBeCloseTo(toRadians(-50), 6);
	});
});
