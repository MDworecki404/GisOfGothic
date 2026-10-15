/** Typy paczki danych — zgodne z `static/data/khorinis/README.md`. */

export interface Anchor {
	lon: number;
	lat: number;
	h: number;
}

export interface Metadata {
	game: string;
	world: string;
	anchor: Anchor;
	axes: Record<string, string | boolean>;
	gltf_axes: string;
	zenkit_version?: string;
	generated_at?: string;
	package: {
		version: number;
		counts: Record<string, number>;
		files: string[];
	};
}

export type PlaceKind = 'ground' | 'script' | 'container' | 'npc' | 'spawn' | 'routine';

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
}

export type SearchEntryType = 'item' | 'character';

export interface SearchEntry {
	id: string;
	type: SearchEntryType;
	code: string;
	name: string;
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
	places: Place[];
}

export interface SearchIndex {
	version: number;
	entries: SearchEntry[];
}

export interface IndexCounts {
	items: number;
	characters: number;
}
