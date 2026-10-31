/** Typy paczki danych — zgodne z `static/data/khorinis/README.md`. */

export interface Anchor {
	lon: number;
	lat: number;
	h: number;
}

/** Prędkości bohatera w m/s policzone przez exporter z animacji pętli modelu HUMANS. */
export interface MovementSpeeds {
	walk: number;
	run: number;
	sneak: number;
	walkArmed: number;
}

export interface Metadata {
	game: string;
	world: string;
	anchor: Anchor;
	axes: Record<string, string | boolean>;
	gltf_axes: string;
	zenkit_version?: string;
	generated_at?: string;
	/** Brak w starszych paczkach (przed wersją 4). */
	movement_speeds_m_s?: MovementSpeeds;
	/** Kod gildii → nazwa po polsku (tabela TXT_GUILDS z gry); tylko gildie występujące w świecie. */
	guild_names?: Record<string, string>;
	package: {
		version: number;
		counts: Record<string, number>;
		files: string[];
	};
}

export type PlaceKind = 'ground' | 'script' | 'container' | 'npc' | 'spawn' | 'routine';

/** Rola miejsca w queście: zleceniodawca, cel albo miejsce jednego z etapów. */
export type QuestPlaceRole = 'giver' | 'target' | 'stage';

/** Miejsce występowania wpisu; współrzędne WGS84 (`h` w metrach nad elipsoidą). */
export interface Place {
	kind: PlaceKind;
	lon: number;
	lat: number;
	h: number;
	label: string;
	/** `id` obiektu w warstwie GeoJSON zależnej od `kind`. */
	ref?: string;
	amount?: number;
	/** `kind: 'npc'` — czy przedmiot jest pewny. */
	certainty?: 'always' | 'possible';
	/** `kind: 'spawn'` — numer rozdziału lub `null` (start świata / dialog). */
	chapter?: number | null;
	/** `kind: 'routine'` */
	routine?: string;
	is_default?: boolean;
	actions?: string[];
	/** Questy: rola miejsca. */
	role?: QuestPlaceRole;
	/** Questy: kod instancji postaci albo potwora, od którego pochodzi miejsce. */
	npc_code?: string;
	/** Gothic 3: kod zestawu losowego łupu, z którego przedmiot może wypaść w tym miejscu (`certainty: 'possible'`). */
	set?: string;
}

/** Rodzaj zestawu losowego łupu (Gothic 3): skrzynia, postać, potwór, handlarz albo wydobycie. */
export type TreasureSetKind = 'chest' | 'npc' | 'monster' | 'trader' | 'mining';

/** Gothic 3: zestaw łupu, z którego przedmiot może wypaść; `holders` to liczba skrzyń i postaci z tym zestawem. */
export interface LootSource {
	set: string;
	kind: TreasureSetKind;
	holders: number;
}

export type SearchEntryType = 'item' | 'character' | 'quest';

export interface SearchEntry {
	id: string;
	type: SearchEntryType;
	code: string;
	name: string;
	/** Przedmioty: nazwa ogólna z gry (np. „Mikstura”), gdy `name` pochodzi z opisu (np. „Esencja lecznicza”). */
	genericName?: string;
	/** Dane zawierają wpisy bez kategorii (np. ITFO_MUTTON), stąd `null`. */
	category: string | null;
	/** Przedmioty: plik modelu podglądu względem adresu modeli świata albo `null`. */
	model?: string | null;
	/** Przedmioty: liczba pewnych sztuk. */
	total?: number;
	/** Postacie: poziom. */
	level?: number;
	/** Postać może mieć kilka kodów instancji. */
	codes?: string[];
	/** Przedmioty (Gothic 3): zestawy losowego łupu, z których przedmiot może wypaść. */
	loot?: LootSource[];
	/** Questy: imię zleceniodawcy albo `null`, gdy go nie ustalono. */
	giver?: string | null;
	/** Questy: rozdział startu albo `null`, gdy nieznany. */
	chapter?: number | null;
	places: Place[];
}

export interface SearchIndex {
	version: number;
	entries: SearchEntry[];
}

export interface IndexCounts {
	items: number;
	characters: number;
	quests: number;
}

export type QuestSection = 'mission' | 'note';
export type QuestStageStatus = 'RUNNING' | 'SUCCESS' | 'FAILED' | 'OBSOLETE';
export type QuestPersonRole =
	'giver' | 'giver_candidate' | 'target' | 'stage' | 'insert' | 'routine';
export type QuestItemRole = 'reward' | 'handover' | 'placed';

/** Etap questu: wpis dziennika (`entry`) albo zmiana statusu (`status`). Kolejność wg skryptów, nie chronologia. */
export interface QuestStage {
	seq: number;
	kind: 'entry' | 'status';
	text: string | null;
	status: QuestStageStatus | null;
	chapter: number | null;
	isConditional: boolean;
}

/** Postać albo przedmiot powiązane z questem; `entryId` jest ustawione tylko dla wpisów z indeksu wyszukiwania. */
export interface QuestPerson {
	code: string;
	name: string;
	role: QuestPersonRole;
	certainty: 'always' | 'possible';
	entryId: string | null;
}

export interface QuestItem {
	code: string;
	name: string;
	role: QuestItemRole;
	amount: number;
	certainty: 'always' | 'possible';
	entryId: string | null;
}

export interface QuestRecord {
	id: string;
	name: string;
	section: QuestSection;
	chapter: number | null;
	giver: { code: string; name: string } | null;
	giverCandidates: { code: string; name: string }[];
	stages: QuestStage[];
	people: QuestPerson[];
	items: QuestItem[];
	experiencePoints: number | null;
}

export interface QuestCatalog {
	version: number;
	quests: QuestRecord[];
}

export interface TreasureSetItem {
	code: string;
	name: string;
	category: string | null;
	amount: number;
}

/** Zestaw losowego łupu z `treasure_sets.json`; gra losuje od `minStacks` do `maxStacks` pozycji z `items`. */
export interface TreasureSet {
	kind: TreasureSetKind;
	minStacks: number;
	maxStacks: number;
	holders: number;
	items: TreasureSetItem[];
}

export type TreasureSetCatalog = ReadonlyMap<string, TreasureSet>;
