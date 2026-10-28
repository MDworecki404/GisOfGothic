import MiniSearch from 'minisearch';
import { describeCategory } from '#lib/data/category-names.js';
import { stonePlateNameResolver } from '#lib/data/stone-plate-names.js';
import type { SearchEntry, SearchEntryType, SearchIndex } from '#lib/data/types.js';

export type SearchTypeFilter = 'all' | SearchEntryType;

/** Kategoria widoczna dla użytkownika (np. „Rośliny”, nazwa gildii) i liczba wpisów w niej. */
export interface CategoryOption {
	label: string;
	count: number;
}

interface IndexedDocument {
	id: string;
	name: string;
	category: string;
	code: string;
	keywords: string;
	type: SearchEntryType;
	categoryLabel: string;
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
	private readonly entriesSortedByName: SearchEntry[];

	constructor(index: SearchIndex) {
		this.entriesById = new Map(index.entries.map((entry) => [entry.id, entry]));
		this.entriesSortedByName = [...index.entries].sort((first, second) =>
			first.name.localeCompare(second.name, 'pl')
		);
		this.miniSearch = new MiniSearch<IndexedDocument>({
			fields: ['name', 'category', 'code', 'keywords'],
			storeFields: ['type', 'categoryLabel'],
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
				categoryLabel: describeCategory(entry.category),
				code: entry.code,
				keywords:
					`${stonePlateNameResolver.describeSearchKeywords(entry.code)} ${entry.giver ?? ''}`.trim(),
				type: entry.type
			}))
		);
	}

	search(
		query: string,
		typeFilter: SearchTypeFilter,
		categoryLabel: string | null = null
	): SearchEntry[] {
		const trimmedQuery = query.trim();
		if (trimmedQuery.length === 0) return [];
		return this.miniSearch
			.search(trimmedQuery, {
				filter: (result) =>
					(typeFilter === 'all' || result.type === typeFilter) &&
					(categoryLabel === null || result.categoryLabel === categoryLabel)
			})
			.slice(0, MAXIMUM_RESULTS)
			.flatMap((result) => {
				const entry = this.entriesById.get(String(result.id));
				return entry ? [entry] : [];
			});
	}

	/** Wszystkie wpisy (z filtrem rodzaju) w kolejności alfabetycznej — do przeglądania bez wpisywania frazy. */
	listAll(typeFilter: SearchTypeFilter, categoryLabel: string | null = null): SearchEntry[] {
		return this.entriesSortedByName.filter(
			(entry) =>
				(typeFilter === 'all' || entry.type === typeFilter) &&
				(categoryLabel === null || describeCategory(entry.category) === categoryLabel)
		);
	}

	/** Kategorie wpisów danego rodzaju od najliczniejszej; do listy rozwijanej filtra kategorii. */
	listCategories(typeFilter: SearchTypeFilter): CategoryOption[] {
		const countByLabel = new Map<string, number>();
		for (const entry of this.entriesSortedByName) {
			if (typeFilter !== 'all' && entry.type !== typeFilter) continue;
			const label = describeCategory(entry.category);
			countByLabel.set(label, (countByLabel.get(label) ?? 0) + 1);
		}
		return [...countByLabel.entries()]
			.map(([label, count]) => ({ label, count }))
			.sort(
				(first, second) =>
					second.count - first.count || first.label.localeCompare(second.label, 'pl')
			);
	}

	findEntry(entryId: string): SearchEntry | undefined {
		return this.entriesById.get(entryId);
	}
}
