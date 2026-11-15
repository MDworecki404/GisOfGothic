import {
	isRecord,
	readOptionalNumber,
	readOptionalString,
	requireRecord,
	requireString
} from './parsers.js';
import type {
	Anchor,
	LocationEntry,
	LocationKind,
	LocationNameSource,
	LocationPassage
} from './types.js';

const LOCATION_KINDS: readonly LocationKind[] = [
	'camp',
	'town',
	'district',
	'building',
	'cave',
	'region',
	'landmark',
	'passage'
];
const NAME_SOURCES: readonly LocationNameSource[] = ['game', 'derived', 'code'];

function findLocationKind(value: unknown): LocationKind | undefined {
	return LOCATION_KINDS.find((kind) => kind === value);
}

function findNameSource(value: unknown): LocationNameSource | undefined {
	return NAME_SOURCES.find((source) => source === value);
}

function readPosition(value: unknown, description: string): Anchor {
	if (!Array.isArray(value) || value.length < 3) {
		throw new Error(`${description}: współrzędne muszą mieć trzy liczby [lon, lat, h]`);
	}
	const [lon, lat, h] = value;
	if (typeof lon !== 'number' || typeof lat !== 'number' || typeof h !== 'number') {
		throw new Error(`${description}: współrzędne muszą być liczbami`);
	}
	return { lon, lat, h };
}

function readPolygon(value: unknown, description: string): [number, number][] | null {
	if (value === null || value === undefined) return null;
	if (!Array.isArray(value)) throw new Error(`${description}: obrys musi być tablicą punktów`);
	const ring = value.map((point): [number, number] => {
		const { lon, lat } = readPosition([...(Array.isArray(point) ? point : []), 0], description);
		return [lon, lat];
	});
	return ring.length >= 3 ? ring : null;
}

function parsePassage(value: unknown, description: string): LocationPassage {
	const record = requireRecord(value, `${description}.passage`);
	const arrival = record['arrival'];
	return {
		toWorld: readOptionalString(record, 'to_world') ?? null,
		toLevel: readOptionalString(record, 'to_level') ?? '',
		arrival: arrival === null || arrival === undefined ? null : readPosition(arrival, description)
	};
}

function parseLocation(value: unknown, index: number): LocationEntry {
	const description = `locations.json: lokacja ${index}`;
	const record = requireRecord(value, description);
	const kind = findLocationKind(record['kind']);
	if (!kind) throw new Error(`${description}: nieznany rodzaj "${String(record['kind'])}"`);
	const passage = record['passage'];
	return {
		id: requireString(record, 'id', description),
		kind,
		name: requireString(record, 'name', description),
		nameSource: findNameSource(record['name_source']) ?? 'derived',
		code: readOptionalString(record, 'code') ?? null,
		center: readPosition(record['center'], description),
		radiusMetres: readOptionalNumber(record, 'radius_m') ?? null,
		polygon: readPolygon(record['polygon'], description),
		waypoint: readOptionalString(record, 'waypoint') ?? null,
		passage: kind === 'passage' && isRecord(passage) ? parsePassage(passage, description) : null
	};
}

export function parseLocationCatalog(json: unknown): LocationEntry[] {
	const root = requireRecord(json, 'locations.json');
	const locations = root['locations'];
	if (!Array.isArray(locations))
		throw new Error('locations.json: pole "locations" musi być tablicą');
	return locations.map(parseLocation);
}
