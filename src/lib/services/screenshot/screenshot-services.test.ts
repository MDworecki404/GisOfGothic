import { describe, expect, it } from 'vitest';
import { ScreenshotBandLayoutCalculator } from './screenshot-band-layout-calculator.js';
import { ScreenshotFileNameBuilder } from './screenshot-file-name-builder.js';
import {
	type ScreenshotCaption,
	type ScreenshotImageComposer,
	type ScreenshotPalette
} from './screenshot-composer.js';
import { ViewScreenshotTaker } from './view-screenshot-taker.js';

const palette: ScreenshotPalette = {
	mapBackground: '#000',
	bandBackground: '#111',
	bandBorder: '#222',
	titleColor: '#333',
	detailColor: '#444',
	titleFontFamily: 'serif',
	detailFontFamily: 'sans-serif'
};

describe('ScreenshotBandLayoutCalculator', () => {
	const calculator = new ScreenshotBandLayoutCalculator();

	it('skaluje pasek razem ze szerokością zdjęcia', () => {
		expect(calculator.calculate(1600).bandHeight).toBe(80);
	});

	it('nie schodzi poniżej minimum ani nie przekracza maksimum', () => {
		expect(calculator.calculate(200).bandHeight).toBe(44);
		expect(calculator.calculate(8000).bandHeight).toBe(120);
	});

	it('dobiera pismo i odstęp do wysokości paska', () => {
		const layout = calculator.calculate(1600);
		expect(layout.fontSizePixels).toBe(32);
		expect(layout.paddingPixels).toBe(40);
	});
});

describe('ScreenshotFileNameBuilder', () => {
	const builder = new ScreenshotFileNameBuilder();
	const takenAt = new Date(2026, 10, 16, 7, 5);

	it('składa nazwę z nazwy świata i czasu', () => {
		expect(builder.build('Khorinis', takenAt)).toBe('gis-of-gothic-khorinis-2026-11-16-0705.png');
	});

	it('usuwa polskie znaki i znaki specjalne', () => {
		expect(builder.build('Górnicza Dolina (Łowca)', takenAt)).toBe(
			'gis-of-gothic-gornicza-dolina-lowca-2026-11-16-0705.png'
		);
	});

	it('pomija człon świata, gdy go brak', () => {
		expect(builder.build('', takenAt)).toBe('gis-of-gothic-2026-11-16-0705.png');
	});
});

describe('ViewScreenshotTaker', () => {
	function createImage(): ImageBitmap {
		return { width: 800, height: 400, close: () => undefined };
	}

	function createTaker(options: {
		image: ImageBitmap | null;
		blob: Blob | null;
		captions?: ScreenshotCaption[];
	}): ViewScreenshotTaker {
		const composer: ScreenshotImageComposer = {
			compose: (_image, caption) => {
				options.captions?.push(caption);
				return Promise.resolve(options.blob);
			}
		};
		return new ViewScreenshotTaker(
			() => Promise.resolve(options.image),
			composer,
			new ScreenshotFileNameBuilder(),
			() => palette,
			() => new Date(2026, 10, 16, 12, 30)
		);
	}

	const context = {
		worldName: 'Khorinis',
		appVersion: '1.2.0',
		siteAddress: 'gisofgothic.example'
	};

	it('zwraca null, gdy mapa nie dała obrazu', async () => {
		const taker = createTaker({ image: null, blob: new Blob() });
		expect(await taker.take(context)).toBeNull();
	});

	it('zwraca null, gdy nie udało się zapisać obrazu', async () => {
		const taker = createTaker({ image: createImage(), blob: null });
		expect(await taker.take(context)).toBeNull();
	});

	it('zwraca obraz z nazwą pliku i podpisem ze światem, adresem i wersją', async () => {
		const captions: ScreenshotCaption[] = [];
		const blob = new Blob(['x'], { type: 'image/png' });
		const taker = createTaker({ image: createImage(), blob, captions });
		const screenshot = await taker.take(context);
		expect(screenshot?.blob).toBe(blob);
		expect(screenshot?.fileName).toBe('gis-of-gothic-khorinis-2026-11-16-1230.png');
		expect(captions[0]).toEqual({
			title: 'GIS of Gothic',
			detail: 'Khorinis · gisofgothic.example · wersja 1.2.0'
		});
	});
});
