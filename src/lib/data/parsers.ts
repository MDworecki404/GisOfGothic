import type {
	Anchor,
	LootSource,
	Metadata,
	MovementSpeeds,
	Place,
	PlaceKind,
	QuestPlaceRole,
	SearchEntry,
	SearchEntryType,
	SearchIndex,
	TreasureSetKind
} from './types.js';
import { stonePlateNameResolver } from './stone-plate-names.js';

const PLACE_KINDS: readonly PlaceKind[] = [
	'ground',
	'script',
	'container',
	'npc',
	'spawn',
	'routine'
];
export const TREASURE_SET_KINDS: readonly TreasureSetKind[] = [
	'chest',
	'npc',
	'monster',
	'trader',
	'mining'
];
const ENTRY_TYPES: readonly SearchEntryType[] = ['item', 'character', 'quest'];
const QUEST_PLACE_ROLES: readonly QuestPlaceRole[] = ['giver', 'target', 'stage'];

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPlaceKind(value: unknown): value is PlaceKind {
	return PLACE_KINDS.some((kind) => kind === value);
}

function readQuestPlaceRole(record: Record<string, unknown>): QuestPlaceRole | undefined {
	return QUEST_PLACE_ROLES.find((role) => role === record.role);
}

export function findTreasureSetKind(value: unknown): TreasureSetKind | undefined {
	return TREASURE_SET_KINDS.find((kind) => kind === value);
}

function isSearchEntryType(value: unknown): value is SearchEntryType {
	return ENTRY_TYPES.some((type) => type === value);
}

export function requireRecord(value: unknown, description: string): Record<string, unknown> {
	if (!isRecord(value)) throw new Error(`${description}: oczekiwano obiektu`);
	return value;
}

export function requireString(
	record: Record<string, unknown>,
	key: string,
	description: string
): string {
	const value = record[key];
	if (typeof value !== 'string') throw new Error(`${description}: pole "${key}" musi być tekstem`);
	return value;
}

export function requireNumber(
	record: Record<string, unknown>,
	key: string,
	description: string
): number {
	const value = record[key];
	if (typeof value !== 'number') throw new Error(`${description}: pole "${key}" musi być liczbą`);
	return value;
}

export function readOptionalString(
	record: Record<string, unknown>,
	key: string
): string | undefined {
	const value = record[key];
	return typeof value === 'string' ? value : undefined;
}

export function readOptionalNumber(
	record: Record<string, unknown>,
	key: string
): number | undefined {
	const value = record[key];
	return typeof value === 'number' ? value : undefined;
}

export function readOptionalBoolean(
	record: Record<string, unknown>,
	key: string
): boolean | undefined {
	const value = record[key];
	return typeof value === 'boolean' ? value : undefined;
}

export function readStringList(record: Record<string, unknown>, key: string): string[] | undefined {
	const value = record[key];
	if (!Array.isArray(value)) return undefined;
	return value.filter((item) => typeof item === 'string');
}

export function readOptionalChapter(record: Record<string, unknown>): number | null | undefined {
	const value = record.chapter;
	if (value === null) return null;
	return typeof value === 'number' ? value : undefined;
}

export function readCertainty(record: Record<string, unknown>): Place['certainty'] {
	const value = record.certainty;
	return value === 'always' || value === 'possible' ? value : undefined;
}

function parseAnchor(value: unknown): Anchor {
	const record = requireRecord(value, 'metadata.json → anchor');
	return {
		lon: requireNumber(record, 'lon', 'anchor'),
		lat: requireNumber(record, 'lat', 'anchor'),
		h: requireNumber(record, 'h', 'anchor')
	};
}

function parseGuildNames(value: unknown): Record<string, string> | undefined {
	if (!isRecord(value)) return undefined;
	const guildNames: Record<string, string> = {};
	for (const [code, name] of Object.entries(value)) {
		if (typeof name === 'string') guildNames[code] = name;
	}
	return guildNames;
}

function parseAxes(value: unknown): Metadata['axes'] {
	const axes: Metadata['axes'] = {};
	if (!isRecord(value)) return axes;
	for (const [name, axis] of Object.entries(value)) {
		if (typeof axis === 'string' || typeof axis === 'boolean') axes[name] = axis;
	}
	return axes;
}

function parseCounts(value: unknown): Record<string, number> {
	const counts: Record<string, number> = {};
	if (!isRecord(value)) return counts;
	for (const [name, count] of Object.entries(value)) {
		if (typeof count === 'number') counts[name] = count;
	}
	return counts;
}

function parseMovementSpeeds(value: unknown): MovementSpeeds | undefined {
	if (!isRecord(value)) return undefined;
	const walk = readOptionalNumber(value, 'walk');
	const run = readOptionalNumber(value, 'run');
	const sneak = readOptionalNumber(value, 'sneak');
	const walkArmed = readOptionalNumber(value, 'walk_armed');
	if (walk === undefined || run === undefined) return undefined;
	if (sneak === undefined || walkArmed === undefined) return undefined;
	return [walk, run, sneak, walkArmed].every((speed) => speed > 0)
		? { walk, run, sneak, walkArmed }
		: undefined;
}

export function parseMetadata(json: unknown): Metadata {
	const root = requireRecord(json, 'metadata.json');
	const pack = requireRecord(root.package, 'metadata.json → package');
	return {
		game: requireString(root, 'game', 'metadata.json'),
		world: requireString(root, 'world', 'metadata.json'),
		anchor: parseAnchor(root.anchor),
		axes: parseAxes(root.axes),
		gltf_axes: requireString(root, 'gltf_axes', 'metadata.json'),
		zenkit_version: readOptionalString(root, 'zenkit_version'),
		generated_at: readOptionalString(root, 'generated_at'),
		movement_speeds_m_s: parseMovementSpeeds(root.movement_speeds_m_s),
		guild_names: parseGuildNames(root.guild_names),
		package: {
			version: requireNumber(pack, 'version', 'metadata.json → package'),
			counts: parseCounts(pack.counts),
			files: readStringList(pack, 'files') ?? []
		}
	};
}

function parsePlace(value: unknown, description: string): Place {
	const record = requireRecord(value, description);
	const kind = record.kind;
	if (!isPlaceKind(kind)) throw new Error(`${description}: nieznany rodzaj miejsca`);
	return {
		kind,
		lon: requireNumber(record, 'lon', description),
		lat: requireNumber(record, 'lat', description),
		h: requireNumber(record, 'h', description),
		label: requireString(record, 'label', description),
		ref: readOptionalString(record, 'ref'),
		amount: readOptionalNumber(record, 'amount'),
		certainty: readCertainty(record),
		chapter: readOptionalChapter(record),
		routine: readOptionalString(record, 'routine'),
		is_default: readOptionalBoolean(record, 'is_default'),
		actions: readStringList(record, 'actions'),
		role: readQuestPlaceRole(record),
		set: readOptionalString(record, 'set')
	};
}

function parseLootSources(value: unknown, description: string): LootSource[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.flatMap((source, index) => {
		const record = requireRecord(source, `${description}, łup #${index}`);
		const kind = findTreasureSetKind(record.kind);
		if (!kind) return [];
		return [
			{
				set: requireString(record, 'set', `${description}, łup #${index}`),
				kind,
				holders: readOptionalNumber(record, 'holders') ?? 0
			}
		];
	});
}

function parseSearchEntry(value: unknown, position: number): SearchEntry {
	const description = `search_index.json: wpis #${position}`;
	const record = requireRecord(value, description);
	const type = record.type;
	if (!isSearchEntryType(type)) throw new Error(`${description}: nieznany typ wpisu`);
	if (!Array.isArray(record.places)) throw new Error(`${description}: brak listy miejsc`);
	const code = requireString(record, 'code', description);
	return {
		id: requireString(record, 'id', description),
		type,
		code,
		name: stonePlateNameResolver.resolveDisplayName(
			code,
			requireString(record, 'name', description)
		),
		category: readOptionalString(record, 'category') ?? null,
		model: readOptionalString(record, 'model') ?? null,
		total: readOptionalNumber(record, 'total'),
		level: readOptionalNumber(record, 'level'),
		codes: readStringList(record, 'codes'),
		loot: parseLootSources(record.loot, description),
		giver: record.giver === null ? null : readOptionalString(record, 'giver'),
		chapter: readOptionalChapter(record),
		places: record.places.map((place, index) =>
			parsePlace(place, `${description}, miejsce #${index}`)
		)
	};
}

export function parseSearchIndex(json: unknown): SearchIndex {
	const root = requireRecord(json, 'search_index.json');
	if (!Array.isArray(root.entries)) throw new Error('search_index.json: brak listy wpisów');
	return {
		version: requireNumber(root, 'version', 'search_index.json'),
		entries: root.entries.map(parseSearchEntry)
	};
}
