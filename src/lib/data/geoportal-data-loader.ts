import { parseMetadata, parseSearchIndex } from './parsers.js';
import { parseQuestCatalog } from './quest-parsers.js';
import { parseTreasureSetCatalog } from './treasure-set-parsers.js';
import type {
	IndexCounts,
	Metadata,
	QuestCatalog,
	SearchIndex,
	TreasureSetCatalog
} from './types.js';

export type ResourceFetcher = (url: string) => Promise<Response>;

export class GeoportalDataLoader {
	constructor(
		private readonly baseUrl: string,
		private readonly fetchResource: ResourceFetcher = (url) => fetch(url)
	) {}

	private metadataLoading: Promise<Metadata> | null = null;

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

	async loadSearchIndex(): Promise<SearchIndex> {
		return parseSearchIndex(await this.fetchJson('search_index.json'));
	}

	async loadQuestCatalog(): Promise<QuestCatalog> {
		return parseQuestCatalog(await this.fetchJson('quests.json'));
	}

	async loadTreasureSetCatalog(): Promise<TreasureSetCatalog> {
		return parseTreasureSetCatalog(await this.fetchJson('treasure_sets.json'));
	}

	async loadLayerFile(fileName: string): Promise<unknown> {
		return this.fetchJson(fileName);
	}

	countEntriesByType(index: SearchIndex): IndexCounts {
		let items = 0;
		let characters = 0;
		let quests = 0;
		for (const entry of index.entries) {
			if (entry.type === 'item') items++;
			else if (entry.type === 'character') characters++;
			else quests++;
		}
		return { items, characters, quests };
	}

	private async fetchJson(fileName: string): Promise<unknown> {
		const url = `${this.baseUrl}/${fileName}`;
		const response = await this.fetchResource(url);
		if (!response.ok) throw new Error(`Nie udało się pobrać ${url} (HTTP ${response.status})`);
		return response.json();
	}
}
