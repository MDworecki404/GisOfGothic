import { describe, expect, it } from 'vitest';
import { RouteEndpointsCodec } from './route-endpoints-codec.js';

const codec = new RouteEndpointsCodec();
const endpoints = {
	start: { east: 581.84, north: 200.9, height: 12.34 },
	end: { east: -120, north: 40.25, height: 0 }
};

describe('RouteEndpointsCodec', () => {
	it('zapisuje początek i cel z dokładnością do dziesiątej części metra', () => {
		expect(codec.serialize(endpoints)).toBe('581.8_200.9_12.3~-120_40.3_0');
	});

	it('odczytuje zapisaną trasę', () => {
		expect(codec.parse('581.8_200.9_12.3~-120_40.3_0')).toEqual({
			start: { east: 581.8, north: 200.9, height: 12.3 },
			end: { east: -120, north: 40.3, height: 0 }
		});
	});

	it.each([
		['pusty tekst', ''],
		['brak celu', '1_2_3'],
		['trzy punkty', '1_2_3~4_5_6~7_8_9'],
		['za mało liczb w punkcie', '1_2~4_5_6'],
		['tekst zamiast liczby', 'a_2_3~4_5_6'],
		['NaN', 'NaN_2_3~4_5_6'],
		['współrzędna spoza świata', '9999999_2_3~4_5_6']
	])('odrzuca zepsuty zapis: %s', (_description, text) => {
		expect(codec.parse(text)).toBeNull();
	});
});
