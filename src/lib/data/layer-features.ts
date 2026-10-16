import {
	isRecord,
	readOptionalBoolean,
	readOptionalNumber,
	readOptionalString,
	requireRecord,
	requireString
} from './parsers.js';
import { stonePlateNameResolver } from './stone-plate-names.js';

export interface PointFeature<P> {
	lon: number;
	lat: number;
	h: number;
	properties: P;
}

export interface InventoryLine {
	name: string;
	category: string | null;
	amount: number;
}

export interface ItemProperties {
	id: string;
	code: string;
	name: string;
	category: string | null;
	amount: number;
	isInsertedByScript: boolean;
}

export interface ContainerProperties {
	id: string;
	isLocked: boolean;
	keyName: string | null;
	lockCombination: string | null;
	contents: InventoryLine[];
}

export interface CharacterProperties {
	id: string;
	code: string;
	name: string;
	guild: string | null;
	level: number | null;
	chapter: number | null;
	waypoint: string | null;
}

function parseInventoryLine(value: unknown): InventoryLine | null {
	if (!isRecord(value)) return null;
	const name = readOptionalString(value, 'name');
	if (!name) return null;
	const code = readOptionalString(value, 'code');
	return {
		name: code ? stonePlateNameResolver.resolveDisplayName(code, name) : name,
		category: readOptionalString(value, 'category') ?? null,
		amount: readOptionalNumber(value, 'amount') ?? 1
	};
}

function parseInventory(value: unknown): InventoryLine[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((line) => {
		const parsed = parseInventoryLine(line);
		return parsed ? [parsed] : [];
	});
}

/** Czyta `FeatureCollection` punktów; każdy obiekt przechodzi przez parser właściwości warstwy. */
export function parsePointFeatures<P>(
	json: unknown,
	description: string,
	parseProperties: (properties: Record<string, unknown>, description: string) => P
): PointFeature<P>[] {
	const root = requireRecord(json, description);
	if (!Array.isArray(root.features)) throw new Error(`${description}: brak listy obiektów`);
	return root.features.map((feature, index) => {
		const featureDescription = `${description}: obiekt #${index}`;
		const record = requireRecord(feature, featureDescription);
		const geometry = requireRecord(record.geometry, featureDescription);
		const coordinates = geometry.coordinates;
		if (
			!Array.isArray(coordinates) ||
			coordinates.length < 3 ||
			!coordinates.every((coordinate) => typeof coordinate === 'number')
		) {
			throw new Error(`${featureDescription}: punkt musi mieć [lon, lat, h]`);
		}
		const [lon, lat, h] = coordinates;
		return {
			lon,
			lat,
			h,
			properties: parseProperties(
				requireRecord(record.properties, featureDescription),
				featureDescription
			)
		};
	});
}

export function parseItemProperties(
	properties: Record<string, unknown>,
	description: string
): ItemProperties {
	const code = requireString(properties, 'code', description);
	return {
		id: requireString(properties, 'id', description),
		code,
		name: stonePlateNameResolver.resolveDisplayName(
			code,
			requireString(properties, 'name', description)
		),
		category: readOptionalString(properties, 'category') ?? null,
		amount: readOptionalNumber(properties, 'amount') ?? 1,
		isInsertedByScript: readOptionalString(properties, 'source') === 'script'
	};
}

export function parseContainerProperties(
	properties: Record<string, unknown>,
	description: string
): ContainerProperties {
	return {
		id: requireString(properties, 'id', description),
		isLocked: readOptionalBoolean(properties, 'locked') ?? false,
		keyName: readOptionalString(properties, 'key') ?? null,
		lockCombination: readOptionalString(properties, 'pick_string') ?? null,
		contents: parseInventory(properties.contents)
	};
}

export function parseCharacterProperties(
	properties: Record<string, unknown>,
	description: string
): CharacterProperties {
	return {
		id: requireString(properties, 'id', description),
		code: requireString(properties, 'code', description),
		name: requireString(properties, 'name', description),
		guild: readOptionalString(properties, 'guild_name') ?? null,
		level: readOptionalNumber(properties, 'level') ?? null,
		chapter: readOptionalNumber(properties, 'chapter') ?? null,
		waypoint: readOptionalString(properties, 'insert_waypoint') ?? null
	};
}
