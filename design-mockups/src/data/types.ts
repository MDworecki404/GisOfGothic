export type Category = 'location' | 'character' | 'item' | 'monster' | 'quest';

export type LocationKind =
	| 'town'
	| 'district'
	| 'farm'
	| 'monastery'
	| 'tower'
	| 'tavern'
	| 'lighthouse'
	| 'circle'
	| 'mine'
	| 'passage';

export type SceneKind =
	'town' | 'farm' | 'monastery' | 'tower' | 'tavern' | 'lighthouse' | 'circle' | 'mine' | 'passage';

interface EntryBase {
	id: string;
	name: string;
	summary: string;
	x: number;
	y: number;
	/** Poziom 1 pokazuje podpis już na oddalonej mapie, poziom 2 dopiero po przybliżeniu. */
	labelTier: 1 | 2;
	regionId: string;
}

export interface LocationEntry extends EntryBase {
	category: 'location';
	kind: LocationKind;
	kindLabel: string;
	scene: SceneKind;
	description: string[];
	facts: { label: string; value: string }[];
	characterIds: string[];
	itemIds: string[];
	monsterIds: string[];
	questIds: string[];
}

export interface RoutineSlot {
	fromHour: number;
	toHour: number;
	activity: string;
	locationId: string;
}

export interface CharacterEntry extends EntryBase {
	category: 'character';
	role: string;
	guild: string;
	locationId: string;
	description: string;
	routine: RoutineSlot[];
	questIds: string[];
	itemIds: string[];
	facts: { label: string; value: string }[];
}

export interface ItemEntry extends EntryBase {
	category: 'item';
	kindLabel: string;
	locationId: string;
}

export interface MonsterEntry extends EntryBase {
	category: 'monster';
	danger: 'niskie' | 'średnie' | 'wysokie';
	locationId: string;
}

export interface QuestStep {
	text: string;
	locationId: string;
}

export interface QuestEntry extends EntryBase {
	category: 'quest';
	chapter: number;
	giverId: string;
	reward: string;
	steps: QuestStep[];
}

export type Entry = LocationEntry | CharacterEntry | ItemEntry | MonsterEntry | QuestEntry;

export interface Region {
	id: string;
	name: string;
	x: number;
	y: number;
	rotate: number;
}

export interface RoadSegment {
	id: string;
	path: string;
}

export interface WorldSummary {
	id: string;
	gameName: string;
	name: string;
	areaKm2: number;
	places: number;
	characters: number;
	items: number;
	hasChapters: boolean;
	outline: string;
}
