import { describe, expect, it } from 'vitest';
import { ChapterFilter, SpawnChapterIndex, isChapterNumber } from './chapter-filter.js';

describe('ChapterFilter', () => {
	it('bez wybranego rozdziału pokazuje wszystko', () => {
		const filter = new ChapterFilter(null);
		expect(filter.isSpawnVisible(5)).toBe(true);
		expect(filter.isSpawnVisible(null)).toBe(true);
	});

	it('pokazuje postacie z rozdziałów do wybranego włącznie', () => {
		const filter = new ChapterFilter(3);
		expect(filter.isSpawnVisible(1)).toBe(true);
		expect(filter.isSpawnVisible(3)).toBe(true);
		expect(filter.isSpawnVisible(4)).toBe(false);
	});

	it('wstawienie bez rozdziału jest widoczne w każdym rozdziale', () => {
		expect(new ChapterFilter(1).isSpawnVisible(null)).toBe(true);
	});
});

describe('SpawnChapterIndex', () => {
	it('bierze najwcześniejszy rozdział spośród wstawień o tym samym kodzie', () => {
		const index = new SpawnChapterIndex([
			{ code: 'A', chapter: 4 },
			{ code: 'A', chapter: 2 },
			{ code: 'B', chapter: 3 },
			{ code: 'B', chapter: null }
		]);
		expect(index.findEarliestSpawnChapter('A')).toBe(2);
		expect(index.findEarliestSpawnChapter('B')).toBeNull();
	});

	it('nieznany kod nie jest ograniczony rozdziałem', () => {
		expect(new SpawnChapterIndex([]).findEarliestSpawnChapter('X')).toBeNull();
	});
});

describe('isChapterNumber', () => {
	it('przyjmuje tylko liczby 1–6', () => {
		expect(isChapterNumber(6)).toBe(true);
		expect(isChapterNumber(0)).toBe(false);
		expect(isChapterNumber(7)).toBe(false);
		expect(isChapterNumber('3')).toBe(false);
	});
});
