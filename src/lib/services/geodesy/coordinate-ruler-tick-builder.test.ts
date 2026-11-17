import { describe, expect, it } from 'vitest';
import { CoordinateRulerTickBuilder } from './coordinate-ruler-tick-builder.js';

const builder = new CoordinateRulerTickBuilder(100);

const extent = {
	centreEastMetres: 0,
	centreNorthMetres: 0,
	metresPerPixel: 1,
	widthPixels: 1000,
	heightPixels: 600
};

describe('CoordinateRulerTickBuilder', () => {
	it('rozstawia znaczniki co okrągłą wartość nie gęściej niż minimalny odstęp', () => {
		const rulers = builder.build(extent);
		const horizontal = rulers?.horizontal ?? [];
		expect(horizontal[0]).toEqual({ offsetPixels: 0, label: '-500 m' });
		expect(horizontal.at(-1)).toEqual({ offsetPixels: 1000, label: '500 m' });
		expect(horizontal).toHaveLength(11);
	});

	it('liczy Północ od góry ekranu w dół', () => {
		const vertical = builder.build(extent)?.vertical ?? [];
		expect(vertical).toContainEqual({ offsetPixels: 0, label: '300 m' });
		expect(vertical).toContainEqual({ offsetPixels: 600, label: '-300 m' });
		expect(vertical).toContainEqual({ offsetPixels: 300, label: '0 m' });
	});

	it('przechodzi na kilometry przy większej skali', () => {
		const rulers = builder.build({ ...extent, metresPerPixel: 10, centreEastMetres: 2000 });
		expect(rulers?.horizontal.map((tick) => tick.label)).toContain('2 km');
	});

	it('nie rysuje linijek bez poprawnej skali', () => {
		expect(builder.build({ ...extent, metresPerPixel: 0 })).toBeNull();
		expect(builder.build({ ...extent, metresPerPixel: Number.NaN })).toBeNull();
	});
});
