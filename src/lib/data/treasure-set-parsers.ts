import {
	findTreasureSetKind,
	readItemNames,
	readOptionalNumber,
	readOptionalString,
	requireNumber,
	requireRecord,
	requireString
} from './parsers.js';
import type { TreasureSet, TreasureSetCatalog, TreasureSetItem } from './types.js';

function parseTreasureSetItem(value: unknown, description: string): TreasureSetItem {
	const record = requireRecord(value, description);
	const code = requireString(record, 'code', description);
	return {
		code,
		name: readItemNames(record, code, requireString(record, 'name', description)).displayName,
		category: readOptionalString(record, 'category') ?? null,
		amount: readOptionalNumber(record, 'amount') ?? 1
	};
}

function parseTreasureSet(value: unknown, code: string): TreasureSet | null {
	const description = `treasure_sets.json: zestaw ${code}`;
	const record = requireRecord(value, description);
	const kind = findTreasureSetKind(record.kind);
	if (!kind || !Array.isArray(record.items)) return null;
	return {
		kind,
		minStacks: requireNumber(record, 'min_stacks', description),
		maxStacks: requireNumber(record, 'max_stacks', description),
		holders: readOptionalNumber(record, 'holders') ?? 0,
		items: record.items.map((item, index) =>
			parseTreasureSetItem(item, `${description}, pozycja #${index}`)
		)
	};
}

/** Zestawy o nieznanym rodzaju pomijamy, żeby nowy rodzaj w danych nie psuł wczytania reszty. */
export function parseTreasureSetCatalog(json: unknown): TreasureSetCatalog {
	const root = requireRecord(json, 'treasure_sets.json');
	const sets = requireRecord(root.sets, 'treasure_sets.json → sets');
	const catalog = new Map<string, TreasureSet>();
	for (const [code, value] of Object.entries(sets)) {
		const set = parseTreasureSet(value, code);
		if (set) catalog.set(code, set);
	}
	return catalog;
}
