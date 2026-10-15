import { parseMetadata, parseSearchIndex } from './parsers.js';
import type { IndexCounts, Metadata, SearchIndex } from './types.js';

export type ResourceFetcher = (url: string) => Promise<Response>;

export class GeoportalDataLoader {
	constructor(
		private readonly baseUrl: string,
		private readonly fetchResource: ResourceFetcher = (url) => fetch(url)
	) {}

	async loadMetadata(): Promise<Metadata> {
		return parseMetadata(await this.fetchJson('metadata.json'));
	}

	async loadSearchIndex(): Promise<SearchIndex> {
		return parseSearchIndex(await this.fetchJson('search_index.json'));
	}

	async loadLayerFile(fileName: string): Promise<unknown> {
		return this.fetchJson(fileName);
	}

	countEntriesByType(index: SearchIndex): IndexCounts {
		let items = 0;
		let characters = 0;
		for (const entry of index.entries) {
			if (entry.type === 'item') items++;
			else characters++;
		}
		return { items, characters };
	}

	private async fetchJson(fileName: string): Promise<unknown> {
		const url = `${this.baseUrl}/${fileName}`;
		const response = await this.fetchResource(url);
		if (!response.ok) throw new Error(`Nie udało się pobrać ${url} (HTTP ${response.status})`);
		return response.json();
	}
}
