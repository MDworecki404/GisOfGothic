import MiniSearch from 'minisearch';
import { describeCategory } from '#lib/data/category-names.js';
import { stonePlateNameResolver } from '#lib/data/stone-plate-names.js';
import type { SearchEntry, SearchEntryType, SearchIndex } from '#lib/data/types.js';

export type SearchTypeFilter = 'all' | SearchEntryType;

interface IndexedDocument {
	id: string;
	name: string;
	category: string;
	code: string;
	keywords: string;
	type: SearchEntryType;
}

const MAXIMUM_RESULTS = 60;

/** Małe litery bez polskich znaków diakrytycznych: „Łowca” i „lowca” znajdują to samo. */
export function normalizeSearchTerm(term: string): string {
	return term
		.toLocaleLowerCase('pl-PL')
		.replace(/ł/g, 'l')
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
}

export class SearchService {
	private readonly miniSearch: MiniSearch<IndexedDocument>;
	private readonly entriesById: Map<string, SearchEntry>;

	constructor(index: SearchIndex) {
		this.entriesById = new Map(index.entries.map((entry) => [entry.id, entry]));
		this.miniSearch = new MiniSearch<IndexedDocument>({
			fields: ['name', 'category', 'code', 'keywords'],
			storeFields: ['type'],
			processTerm: normalizeSearchTerm,
			searchOptions: {
				boost: { name: 3, category: 1, code: 0.5, keywords: 1 },
				prefix: true,
				fuzzy: (term) => (term.length > 4 ? 0.2 : false),
				combineWith: 'AND'
			}
		});
		this.miniSearch.addAll(
			index.entries.map((entry) => ({
				id: entry.id,
				name: entry.name,
				category: describeCategory(entry.category),
				code: entry.code,
				keywords:
					`${stonePlateNameResolver.describeSearchKeywords(entry.code)} ${entry.giver ?? ''}`.trim(),
				type: entry.type
			}))
		);
	}

	search(query: string, typeFilter: SearchTypeFilter): SearchEntry[] {
		const trimmedQuery = query.trim();
		if (trimmedQuery.length === 0) return [];
		return this.miniSearch
			.search(trimmedQuery, {
				filter: (result) => typeFilter === 'all' || result.type === typeFilter
			})
			.slice(0, MAXIMUM_RESULTS)
			.flatMap((result) => {
				const entry = this.entriesById.get(String(result.id));
				return entry ? [entry] : [];
			});
	}

	findEntry(entryId: string): SearchEntry | undefined {
		return this.entriesById.get(entryId);
	}
}
