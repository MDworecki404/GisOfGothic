export const CHAPTER_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

export type ChapterNumber = (typeof CHAPTER_NUMBERS)[number];

export const CHAPTER_LABELS: Readonly<Record<ChapterNumber, string>> = {
	1: 'I',
	2: 'II',
	3: 'III',
	4: 'IV',
	5: 'V',
	6: 'VI'
};

export function isChapterNumber(value: unknown): value is ChapterNumber {
	return CHAPTER_NUMBERS.some((chapter) => chapter === value);
}

/**
 * Filtr rozdziału: postać pojawia się w świecie w rozdziale, w którym skrypt ją wstawia, i zostaje
 * do końca gry (dane nie mówią o znikaniu). Wstawienie bez rozdziału (`null`: start świata albo
 * dialog) liczy się od początku. Brak wybranego rozdziału nie filtruje niczego.
 */
export class ChapterFilter {
	constructor(readonly selectedChapter: ChapterNumber | null) {}

	isSpawnVisible(spawnChapter: number | null): boolean {
		if (this.selectedChapter === null || spawnChapter === null) return true;
		return spawnChapter <= this.selectedChapter;
	}
}

export interface CodedSpawn {
	code: string;
	chapter: number | null;
}

/**
 * Najwcześniejszy rozdział, w którym postać o danym kodzie pojawia się w świecie. Rutyny dnia
 * nie mają własnego rozdziału, więc dziedziczą go po wstawieniach postaci.
 */
export class SpawnChapterIndex {
	private readonly earliestChapterByCode = new Map<string, number | null>();

	constructor(spawns: Iterable<CodedSpawn>) {
		for (const { code, chapter } of spawns) {
			const known = this.earliestChapterByCode.get(code);
			if (known === undefined) this.earliestChapterByCode.set(code, chapter);
			else if (known !== null && (chapter === null || chapter < known)) {
				this.earliestChapterByCode.set(code, chapter);
			}
		}
	}

	findEarliestSpawnChapter(code: string): number | null {
		return this.earliestChapterByCode.get(code) ?? null;
	}
}
