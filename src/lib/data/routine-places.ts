import {
	readOptionalBoolean,
	readOptionalString,
	readStringList,
	requireString
} from './parsers.js';

export interface RoutinePlaceProperties {
	id: string;
	characterCode: string;
	characterName: string;
	routineName: string;
	isDefaultRoutine: boolean;
	waypoint: string;
	timeRanges: string[];
	actions: string[];
}

export function parseRoutinePlaceProperties(
	properties: Record<string, unknown>,
	description: string
): RoutinePlaceProperties {
	return {
		id: requireString(properties, 'id', description),
		characterCode: requireString(properties, 'npc_code', description),
		characterName: requireString(properties, 'npc_name', description),
		routineName: readOptionalString(properties, 'routine') ?? 'START',
		isDefaultRoutine: readOptionalBoolean(properties, 'is_default') ?? true,
		waypoint: readOptionalString(properties, 'waypoint') ?? '',
		timeRanges: readStringList(properties, 'times') ?? [],
		actions: readStringList(properties, 'actions') ?? []
	};
}

const ACTION_DESCRIPTIONS: readonly [keyword: string, description: string][] = [
	['SLEEP', 'śpi'],
	['SMITH', 'pracuje w kuźni'],
	['PRAY', 'modli się'],
	['COOK', 'gotuje'],
	['SMOKE', 'pali'],
	['PRACTICE', 'ćwiczy'],
	['GUARD', 'pilnuje'],
	['SWEEP', 'zamiata'],
	['READ', 'czyta'],
	['SIT', 'siedzi'],
	['BENCH', 'siedzi'],
	['STAND', 'stoi'],
	['STOMP', 'pracuje'],
	['PICK', 'zbiera plony'],
	['RAKE', 'grabi'],
	['SAW', 'piłuje drewno'],
	['FISH', 'łowi ryby'],
	['ROAST', 'piecze mięso'],
	['POTION', 'warzy mikstury'],
	['ALCHEMY', 'warzy mikstury'],
	['PEE', 'załatwia potrzebę'],
	['DANCE', 'tańczy'],
	['WASH', 'myje się'],
	['FIRE', 'grzeje się przy ogniu'],
	['RUNE', 'tworzy runy'],
	['BOOK', 'czyta'],
	['WALK', 'spaceruje'],
	['ROAM', 'krąży']
];

/** Opisuje czynność z rutyny gry (np. `TA_SMITH_ANVIL` → „pracuje w kuźni”); nieznaną zostawia jako kod. */
export function describeRoutineAction(action: string): string {
	const normalized = action.toUpperCase();
	const match = ACTION_DESCRIPTIONS.find(([keyword]) => normalized.includes(keyword));
	return match ? match[1] : action;
}
