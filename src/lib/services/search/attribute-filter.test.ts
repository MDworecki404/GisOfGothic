import { describe, expect, it } from 'vitest';
import type { SearchEntry } from '#lib/data/types.js';
import { AttributeFilterMatcher, NO_ATTRIBUTE_FILTER } from './attribute-filter.js';

const matcher = new AttributeFilterMatcher();

function createEntry(overrides: Partial<SearchEntry>): SearchEntry {
	return { id: 'x', type: 'item', code: 'X', name: 'X', category: null, places: [], ...overrides };
}

describe('AttributeFilterMatcher', () => {
	it('bez ograniczeń przepuszcza wszystko i nie jest aktywny', () => {
		expect(matcher.isActive(NO_ATTRIBUTE_FILTER)).toBe(false);
		expect(matcher.matches(createEntry({ type: 'character', level: 5 }), NO_ATTRIBUTE_FILTER)).toBe(
			true
		);
	});

	it('poziom postaci mieści się w przedziale włącznie z krańcami', () => {
		const filter = { ...NO_ATTRIBUTE_FILTER, minimumLevel: 10, maximumLevel: 20 };
		const matches = (level: number | undefined): boolean =>
			matcher.matches(createEntry({ type: 'character', level }), filter);
		expect(matches(10)).toBe(true);
		expect(matches(20)).toBe(true);
		expect(matches(9)).toBe(false);
		expect(matches(21)).toBe(false);
		expect(matches(undefined)).toBe(false);
	});

	it('można podać tylko dolną albo tylko górną granicę poziomu', () => {
		const character = createEntry({ type: 'character', level: 15 });
		expect(matcher.matches(character, { ...NO_ATTRIBUTE_FILTER, minimumLevel: 15 })).toBe(true);
		expect(matcher.matches(character, { ...NO_ATTRIBUTE_FILTER, maximumLevel: 14 })).toBe(false);
	});

	it('rozdział dotyczy questów i odrzuca questy bez rozdziału', () => {
		const filter = { ...NO_ATTRIBUTE_FILTER, questChapter: 3 };
		expect(matcher.matches(createEntry({ type: 'quest', chapter: 3 }), filter)).toBe(true);
		expect(matcher.matches(createEntry({ type: 'quest', chapter: 2 }), filter)).toBe(false);
		expect(matcher.matches(createEntry({ type: 'quest', chapter: null }), filter)).toBe(false);
	});

	it('wpisy innych rodzajów nie podlegają filtrom cech', () => {
		const filter = { minimumLevel: 30, maximumLevel: null, questChapter: 6 };
		expect(matcher.matches(createEntry({ type: 'item' }), filter)).toBe(true);
	});
});
