import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';

export interface RouteEndpoints {
	start: LocalPoint;
	end: LocalPoint;
}

const ENDPOINT_SEPARATOR = '~';
const COORDINATE_SEPARATOR = '_';
const COORDINATE_COUNT = 3;
const MAXIMUM_ABSOLUTE_COORDINATE_METRES = 1_000_000;

function roundToTenth(value: number): number {
	return Math.round(value * 10) / 10;
}

function serializePoint(point: LocalPoint): string {
	return [point.east, point.north, point.height].map(roundToTenth).join(COORDINATE_SEPARATOR);
}

function parsePoint(text: string): LocalPoint | null {
	const fields = text
		.split(COORDINATE_SEPARATOR)
		.map((field) => (field.trim() === '' ? NaN : Number(field)));
	if (fields.length !== COORDINATE_COUNT) return null;
	const [east, north, height] = fields;
	const isInsideWorld = fields.every(
		(coordinate) =>
			Number.isFinite(coordinate) && Math.abs(coordinate) <= MAXIMUM_ABSOLUTE_COORDINATE_METRES
	);
	return isInsideWorld ? { east, north, height } : null;
}

/** Zamienia początek i cel trasy na krótki tekst do adresu (`E_N_H~E_N_H`, metry od kotwicy) i z powrotem. */
export class RouteEndpointsCodec {
	serialize(endpoints: RouteEndpoints): string {
		return [endpoints.start, endpoints.end].map(serializePoint).join(ENDPOINT_SEPARATOR);
	}

	parse(text: string): RouteEndpoints | null {
		const parts = text.split(ENDPOINT_SEPARATOR);
		if (parts.length !== 2) return null;
		const start = parsePoint(parts[0]);
		const end = parsePoint(parts[1]);
		return start && end ? { start, end } : null;
	}
}
