import { convertToGameCoordinates, type WorldPosition } from './world-frame.js';

export type CoordinateSystemId = 'khorinis-1992' | 'game-units' | 'wgs84';

export interface CoordinateSystem {
	id: CoordinateSystemId;
	name: string;
	description: string;
}

export interface CoordinateReading {
	axis: string;
	value: string;
}

export const COORDINATE_SYSTEMS: readonly CoordinateSystem[] = [
	{
		id: 'khorinis-1992',
		name: 'Układ Khorinis 1992',
		description: 'metry od środka wyspy: wschód, północ, wysokość nad poziomem morza'
	},
	{
		id: 'game-units',
		name: 'Jednostki gry',
		description: 'centymetry silnika, jak w komendzie Marvina goto pos'
	},
	{ id: 'wgs84', name: 'WGS 84', description: 'stopnie na globusie, do którego przypięto świat' }
];

const metres = new Intl.NumberFormat('pl-PL', {
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
const kilometres = new Intl.NumberFormat('pl-PL', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
const squareMetres = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const hectares = new Intl.NumberFormat('pl-PL', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 3
});
const centimetres = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
const degrees = new Intl.NumberFormat('pl-PL', {
	minimumFractionDigits: 6,
	maximumFractionDigits: 6
});

export class CoordinateFormatter {
	formatPosition(position: WorldPosition, systemId: CoordinateSystemId): CoordinateReading[] {
		if (systemId === 'game-units') {
			const game = convertToGameCoordinates(position);
			return [
				{ axis: 'X', value: centimetres.format(game.x) },
				{ axis: 'Y', value: centimetres.format(game.y) },
				{ axis: 'Z', value: centimetres.format(game.z) }
			];
		}
		if (systemId === 'wgs84') {
			return [
				{ axis: 'φ', value: `${degrees.format(position.lat)}°` },
				{ axis: 'λ', value: `${degrees.format(position.lon)}°` },
				{ axis: 'h', value: `${metres.format(position.height)} m` }
			];
		}
		return [
			{ axis: 'E', value: `${metres.format(position.east)} m` },
			{ axis: 'N', value: `${metres.format(position.north)} m` },
			{ axis: 'H', value: `${metres.format(position.height)} m n.p.m.` }
		];
	}

	formatLength(lengthMetres: number): string {
		if (Math.abs(lengthMetres) >= 1000) return `${kilometres.format(lengthMetres / 1000)} km`;
		return `${metres.format(lengthMetres)} m`;
	}

	formatArea(areaSquareMetres: number): string {
		return `${squareMetres.format(areaSquareMetres)} m²`;
	}

	formatHectares(areaSquareMetres: number): string {
		return `${hectares.format(areaSquareMetres / 10000)} ha`;
	}

	formatHeightChange(changeMetres: number): string {
		const sign = changeMetres > 0 ? '+' : changeMetres < 0 ? '−' : '';
		return `${sign}${metres.format(Math.abs(changeMetres))} m`;
	}

	formatMarvinTeleportCommand(position: WorldPosition): string {
		const game = convertToGameCoordinates(position);
		return `goto pos ${game.x} ${game.y} ${game.z}`;
	}

	findNextCoordinateSystem(currentId: CoordinateSystemId): CoordinateSystem {
		const index = COORDINATE_SYSTEMS.findIndex((system) => system.id === currentId);
		return COORDINATE_SYSTEMS[(index + 1) % COORDINATE_SYSTEMS.length];
	}

	findCoordinateSystem(id: CoordinateSystemId): CoordinateSystem {
		return COORDINATE_SYSTEMS.find((system) => system.id === id) ?? COORDINATE_SYSTEMS[0];
	}
}
