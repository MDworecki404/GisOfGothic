import {
	isRecord,
	readStringList,
	readOptionalBoolean,
	readOptionalNumber,
	readItemNames,
	readOptionalString,
	requireRecord,
	requireString
} from './parsers.js';

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
	/** Dla przedmiotów wstawianych skryptem: nazwa sektora lub miejsca wstawienia. */
	spot: string | null;
}

export interface ContainerProperties {
	id: string;
	isLocked: boolean;
	keyName: string | null;
	lockCombination: string | null;
	contents: InventoryLine[];
	/** Gothic 3: zestawy losowego łupu skrzyni. */
	treasureSetCodes: string[];
	/** Plik podglądu 3D względem adresu modeli świata albo `null`. */
	model: string | null;
}

export interface CharacterProperties {
	id: string;
	code: string;
	name: string;
	guild: string | null;
	level: number | null;
	chapter: number | null;
	waypoint: string | null;
	/** Gothic 3: zestawy losowego łupu i towaru postaci. */
	treasureSetCodes: string[];
}

function parseInventoryLine(value: unknown): InventoryLine | null {
	if (!isRecord(value)) return null;
	const code = readOptionalString(value, 'code');
	const name = readOptionalString(value, 'name') ?? code;
	if (!name) return null;
	return {
		name: code ? readItemNames(value, code, name).displayName : name,
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

function isItemPlaceholder(feature: unknown): boolean {
	if (!isRecord(feature) || !isRecord(feature.properties)) return false;
	return feature.properties.code === '' && feature.properties.name === null;
}

/**
 * Pliki ZEN Gothica 1 zawierają kilka obiektów przedmiotu bez przypisanej instancji (pusty kod, brak nazwy).
 * Nie da się ich opisać ani wyszukać, więc pomijamy je zamiast przerywać wczytanie całej warstwy.
 */
export function omitItemPlaceholders(json: unknown): unknown {
	if (!isRecord(json) || !Array.isArray(json.features)) return json;
	return { ...json, features: json.features.filter((feature) => !isItemPlaceholder(feature)) };
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
		name: readItemNames(properties, code, requireString(properties, 'name', description))
			.displayName,
		category: readOptionalString(properties, 'category') ?? null,
		amount: readOptionalNumber(properties, 'amount') ?? 1,
		isInsertedByScript: readOptionalString(properties, 'source') === 'script',
		spot: readOptionalString(properties, 'spot') ?? null
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
		contents: parseInventory(properties.contents),
		treasureSetCodes: readStringList(properties, 'treasure_sets') ?? [],
		model: readOptionalString(properties, 'model') ?? null
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
		waypoint: readOptionalString(properties, 'insert_waypoint') ?? null,
		treasureSetCodes: readStringList(properties, 'treasure_sets') ?? []
	};
}
