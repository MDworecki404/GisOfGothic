import { describe, expect, it } from 'vitest';
import {
	CameraProjectionConverter,
	MINIMUM_PERSPECTIVE_DISTANCE_METRES
} from './camera-projection-converter.js';

const converter = new CameraProjectionConverter();
const SIXTY_DEGREES = Math.PI / 3;
const FOUR_THIRDS = 4 / 3;
const MEASURED_VERTICAL_FIELD_OF_VIEW = 0.8172757101951849;

describe('CameraProjectionConverter', () => {
	it('liczy pionowy kąt widzenia z kąta Cesium (większego z dwóch) i proporcji ekranu', () => {
		expect(converter.calculateVerticalFieldOfView(SIXTY_DEGREES, FOUR_THIRDS)).toBeCloseTo(
			MEASURED_VERTICAL_FIELD_OF_VIEW,
			3
		);
	});

	it('na ekranie pionowym kąt Cesium jest kątem pionowym', () => {
		expect(converter.calculateVerticalFieldOfView(SIXTY_DEGREES, 0.5)).toBe(SIXTY_DEGREES);
	});

	it('liczy widoczną szerokość perspektywy na celu (wartości ze spike a)', () => {
		const width = converter.calculatePerspectiveVisibleWidth(
			1489,
			MEASURED_VERTICAL_FIELD_OF_VIEW,
			FOUR_THIRDS
		);
		expect(Math.abs(width - 1720)).toBeLessThan(2);
	});

	it('odległość dla szerokości jest odwrotnością widocznej szerokości', () => {
		for (const distance of [10, 250, 1489, 20000]) {
			const width = converter.calculatePerspectiveVisibleWidth(
				distance,
				MEASURED_VERTICAL_FIELD_OF_VIEW,
				FOUR_THIRDS
			);
			expect(
				converter.calculatePerspectiveDistanceForWidth(
					width,
					MEASURED_VERTICAL_FIELD_OF_VIEW,
					FOUR_THIRDS,
					MINIMUM_PERSPECTIVE_DISTANCE_METRES
				)
			).toBeCloseTo(distance, 6);
		}
	});

	it('odległość po powrocie do perspektywy nie schodzi poniżej dolnej granicy', () => {
		expect(
			converter.calculatePerspectiveDistanceForWidth(
				2,
				MEASURED_VERTICAL_FIELD_OF_VIEW,
				FOUR_THIRDS,
				5
			)
		).toBe(5);
	});

	it('liczy metry na piksel ze szerokości frustum i płótna', () => {
		expect(converter.calculateMetresPerPixel(1489, 1024)).toBeCloseTo(1.454, 3);
	});

	it('nie zgaduje skali dla błędnych wejść', () => {
		expect(converter.calculateMetresPerPixel(0, 1024)).toBeNull();
		expect(converter.calculateMetresPerPixel(100, 0)).toBeNull();
		expect(converter.calculateMetresPerPixel(Number.NaN, 10)).toBeNull();
	});
});
