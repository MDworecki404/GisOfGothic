import { describe, expect, it } from 'vitest';
import { CameraViewCodec } from './camera-view-codec.js';

const codec = new CameraViewCodec();

describe('CameraViewCodec', () => {
	it('zamienia widok na tekst i z powrotem', () => {
		const view = {
			east: 581.84,
			north: -200.93,
			height: 350,
			headingDegrees: 45.04,
			pitchDegrees: -50
		};
		const text = codec.serialize(view);
		expect(text).toBe('581.8_-200.9_350_45_-50');
		expect(codec.parse(text)).toEqual({
			east: 581.8,
			north: -200.9,
			height: 350,
			headingDegrees: 45,
			pitchDegrees: -50
		});
	});

	it('sprowadza kierunek do zakresu 0–360°', () => {
		const text = codec.serialize({
			east: 0,
			north: 0,
			height: 0,
			headingDegrees: -90,
			pitchDegrees: 0
		});
		expect(text.split('_')[3]).toBe('270');
	});

	it.each([
		['pusty tekst', ''],
		['za mało pól', '1_2_3_4'],
		['za dużo pól', '1_2_3_4_5_6'],
		['tekst zamiast liczby', '1_2_abc_4_5'],
		['puste pole', '1__3_4_5'],
		['nachylenie poza zakresem', '1_2_3_4_120'],
		['kierunek poza zakresem', '1_2_3_400_5'],
		['współrzędna spoza świata', '99999999_2_3_4_5'],
		['nieskończoność', 'Infinity_2_3_4_5']
	])('odrzuca: %s', (_opis, text) => {
		expect(codec.parse(text)).toBeNull();
	});
});
