import { describe, expect, it } from 'vitest';
import { CoordinateFormatter } from './coordinate-formatter.js';
import { convertToGameCoordinates, type WorldPosition } from './world-frame.js';

const position: WorldPosition = {
	east: 4210.5,
	north: 1873.2,
	height: 79.5,
	lon: 0.0378,
	lat: 0.0169
};
const formatter = new CoordinateFormatter();

function withoutNonBreakingSpaces(text: string): string {
	return text.replace(/\s/g, ' ');
}

describe('współrzędne', () => {
	it('przelicza metry świata na centymetry gry z odwróconą osią północy', () => {
		expect(convertToGameCoordinates(position)).toEqual({ x: 421050, y: 7950, z: -187320 });
	});

	it('buduje komendę teleportu Marvina', () => {
		expect(formatter.formatMarvinTeleportCommand(position)).toBe('goto pos 421050 7950 -187320');
	});

	it('formatuje pozycję w Układzie Khorinis 1992', () => {
		const readings = formatter.formatPosition(position, 'khorinis-1992');
		expect(readings.map((reading) => reading.axis)).toEqual(['E', 'N', 'H']);
		expect(withoutNonBreakingSpaces(readings[0].value)).toBe('4210,5 m');
	});

	it('przechodzi cyklicznie przez układy współrzędnych', () => {
		expect(formatter.findNextCoordinateSystem('khorinis-1992').id).toBe('game-units');
		expect(formatter.findNextCoordinateSystem('wgs84').id).toBe('khorinis-1992');
	});
});
