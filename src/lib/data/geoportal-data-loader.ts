import { isCollectiblePlace } from './place-key.js';
import { parseMetadata, parseSearchIndex } from './parsers.js';
import { parseQuestCatalog } from './quest-parsers.js';
import { parseLocationCatalog } from './location-parsers.js';
import { buildSearchEntryFromLocation } from './location-search-entries.js';
import { parseTreasureSetCatalog } from './treasure-set-parsers.js';
import { parseWaypointNetwork } from './waypoint-network-parser.js';
import type {
	IndexCounts,
	Metadata,
	QuestCatalog,
	SearchIndex,
	TreasureSetCatalog,
	WaypointNetwork
} from './types.js';

const SEARCH_INDEX_FILE_NAME = 'search_index.json';

export type ResourceFetcher = (url: string) => Promise<Response>;

export class GeoportalDataLoader {
	constructor(
		private readonly baseUrl: string,
		private readonly fetchResource: ResourceFetcher = (url) => fetch(url)
	) {}

	private metadataLoading: Promise<Metadata> | null = null;
	private searchIndexJsonLoading: Promise<unknown> | null = null;

	/** Metadane są potrzebne kilku kolejnym krokom wczytywania świata, więc pobieramy je raz. */
	loadMetadata(): Promise<Metadata> {
		this.metadataLoading ??= this.fetchJson('metadata.json')
			.then(parseMetadata)
			.catch((error: unknown) => {
				this.metadataLoading = null;
				throw error;
			});
		return this.metadataLoading;
	}

	/** Do wpisów indeksu dokładamy lokacje; świat bez `locations.json` (HTTP 404) ma po prostu ich zero. */
	async loadSearchIndex(): Promise<SearchIndex> {
		const [indexJson, locationsJson] = await Promise.all([
			this.fetchSearchIndexJson(),
			this.fetchOptionalJson('locations.json')
		]);
		const index = parseSearchIndex(indexJson);
		if (locationsJson === null) return index;
		const locationEntries = parseLocationCatalog(locationsJson).map(buildSearchEntryFromLocation);
		return { ...index, entries: [...index.entries, ...locationEntries] };
	}

	async loadQuestCatalog(): Promise<QuestCatalog> {
		return parseQuestCatalog(await this.fetchJson('quests.json'));
	}

	async loadTreasureSetCatalog(): Promise<TreasureSetCatalog> {
		return parseTreasureSetCatalog(await this.fetchJson('treasure_sets.json'));
	}

	/** Świat bez sieci dróg (np. Gothic 3) nie ma pliku, więc HTTP 404 oznacza `null`, a nie błąd. */
	async loadWaypointNetwork(): Promise<WaypointNetwork | null> {
		const response = await this.fetchResource(`${this.baseUrl}/waypoints.json`);
		if (response.status === 404) return null;
		if (!response.ok) {
			throw new Error(
				`Nie udało się pobrać ${this.baseUrl}/waypoints.json (HTTP ${response.status})`
			);
		}
		return parseWaypointNetwork(await response.json());
	}

	async loadLayerFile(fileName: string): Promise<unknown> {
		if (fileName === SEARCH_INDEX_FILE_NAME) return this.fetchSearchIndexJson();
		return this.fetchJson(fileName);
	}

	/** Indeks bywa duży (kilka MB) i czyta go wyszukiwarka oraz warstwa questów, więc pobieramy go raz. */
	private fetchSearchIndexJson(): Promise<unknown> {
		this.searchIndexJsonLoading ??= this.fetchJson(SEARCH_INDEX_FILE_NAME).catch(
			(error: unknown) => {
				this.searchIndexJsonLoading = null;
				throw error;
			}
		);
		return this.searchIndexJsonLoading;
	}

	countEntriesByType(index: SearchIndex): IndexCounts {
		let items = 0;
		let characters = 0;
		let quests = 0;
		let locations = 0;
		for (const entry of index.entries) {
			if (entry.type === 'item') items++;
			else if (entry.type === 'character') characters++;
			else if (entry.type === 'quest') quests++;
			else locations++;
		}
		return { items, characters, quests, locations };
	}

	/** Liczba odhaczalnych miejsc wszystkich przedmiotów świata: mianownik postępu zbierania. */
	countCollectibleItemPlaces(index: SearchIndex): number {
		return index.entries
			.filter((entry) => entry.type === 'item')
			.reduce((sum, entry) => sum + entry.places.filter(isCollectiblePlace).length, 0);
	}

	private async fetchOptionalJson(fileName: string): Promise<unknown> {
		const response = await this.fetchResource(`${this.baseUrl}/${fileName}`);
		if (response.status === 404) return null;
		if (!response.ok) {
			throw new Error(`Nie udało się pobrać ${this.baseUrl}/${fileName} (HTTP ${response.status})`);
		}
		return response.json();
	}

	private async fetchJson(fileName: string): Promise<unknown> {
		const url = `${this.baseUrl}/${fileName}`;
		const response = await this.fetchResource(url);
		if (!response.ok) throw new Error(`Nie udało się pobrać ${url} (HTTP ${response.status})`);
		return response.json();
	}
}
