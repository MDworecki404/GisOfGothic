import type { SearchEntry } from '#lib/data/types.js';

/** Filtry po cechach wpisu: przedział poziomu postaci i rozdział startu questa; `null` oznacza brak ograniczenia. */
export interface AttributeFilter {
	minimumLevel: number | null;
	maximumLevel: number | null;
	questChapter: number | null;
}

export const NO_ATTRIBUTE_FILTER: AttributeFilter = {
	minimumLevel: null,
	maximumLevel: null,
	questChapter: null
};

/**
 * Poziom dotyczy tylko postaci, a rozdział tylko questów; wpisy innych rodzajów przechodzą bez zmian,
 * bo UI pokazuje te filtry dopiero po wybraniu odpowiedniego rodzaju wyników.
 */
export class AttributeFilterMatcher {
	matches(entry: SearchEntry, filter: AttributeFilter): boolean {
		if (entry.type === 'character') return this.isLevelInRange(entry.level, filter);
		if (entry.type === 'quest') return this.isChapterAccepted(entry.chapter, filter);
		return true;
	}

	isActive(filter: AttributeFilter): boolean {
		return (
			filter.minimumLevel !== null || filter.maximumLevel !== null || filter.questChapter !== null
		);
	}

	private isLevelInRange(level: number | undefined, filter: AttributeFilter): boolean {
		if (filter.minimumLevel === null && filter.maximumLevel === null) return true;
		if (level === undefined) return false;
		return (
			(filter.minimumLevel === null || level >= filter.minimumLevel) &&
			(filter.maximumLevel === null || level <= filter.maximumLevel)
		);
	}

	private isChapterAccepted(chapter: number | null | undefined, filter: AttributeFilter): boolean {
		return filter.questChapter === null || chapter === filter.questChapter;
	}
}
