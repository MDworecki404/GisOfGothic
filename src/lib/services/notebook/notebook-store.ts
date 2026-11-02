import { isRecord } from '#lib/data/parsers.js';

export type CollectibleType = 'item' | 'quest';

export interface SavedPin {
	id: string;
	gameId: string;
	worldId: string;
	name: string;
	note: string;
	east: number;
	north: number;
	height: number;
	createdAt: string;
}

export interface CollectedEntry {
	gameId: string;
	worldId: string;
	entryId: string;
	entryType: CollectibleType;
	entryName: string;
}

export interface NotebookData {
	pins: SavedPin[];
	collected: CollectedEntry[];
}

export type NotebookStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'gisofgothic:notebook:v1';

export function isCollectibleType(value: unknown): value is CollectibleType {
	return value === 'item' || value === 'quest';
}

function readFiniteNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function readSavedPin(value: unknown): SavedPin | null {
	if (!isRecord(value)) return null;
	const { id, gameId, worldId, name, note, createdAt } = value;
	const east = readFiniteNumber(value.east);
	const north = readFiniteNumber(value.north);
	const height = readFiniteNumber(value.height);
	if (
		typeof id !== 'string' ||
		typeof gameId !== 'string' ||
		typeof worldId !== 'string' ||
		typeof name !== 'string' ||
		east === null ||
		north === null ||
		height === null
	) {
		return null;
	}
	return {
		id,
		gameId,
		worldId,
		name,
		note: typeof note === 'string' ? note : '',
		east,
		north,
		height,
		createdAt: typeof createdAt === 'string' ? createdAt : ''
	};
}

export function readCollectedEntry(value: unknown): CollectedEntry | null {
	if (!isRecord(value)) return null;
	const { gameId, worldId, entryId, entryType, entryName } = value;
	if (
		typeof gameId !== 'string' ||
		typeof worldId !== 'string' ||
		typeof entryId !== 'string' ||
		typeof entryName !== 'string' ||
		!isCollectibleType(entryType)
	) {
		return null;
	}
	return { gameId, worldId, entryId, entryType, entryName };
}

function readList<T>(value: unknown, readItem: (item: unknown) => T | null): T[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item) => {
		const parsed = readItem(item);
		return parsed ? [parsed] : [];
	});
}

/** Wyciąga z dowolnego JSON-a tylko poprawne pinezki i wpisy listy; resztę po cichu pomija. */
export function readNotebookData(value: unknown): NotebookData {
	if (!isRecord(value)) return { pins: [], collected: [] };
	return {
		pins: readList(value.pins, readSavedPin),
		collected: readList(value.collected, readCollectedEntry)
	};
}

/**
 * Pinezki i lista „co zebrałem” w `localStorage` przeglądarki (jeden klucz, obiekt JSON).
 * Niedostępna pamięć albo śmieci dają pusty notatnik, a nieudany zapis jest zgłaszany wynikiem.
 */
export class NotebookStore {
	constructor(private readonly storage: NotebookStorage | null) {}

	static forBrowser(): NotebookStore {
		try {
			return new NotebookStore(typeof localStorage === 'undefined' ? null : localStorage);
		} catch {
			return new NotebookStore(null);
		}
	}

	load(): NotebookData {
		try {
			const text = this.storage?.getItem(STORAGE_KEY);
			if (!text) return { pins: [], collected: [] };
			return readNotebookData(JSON.parse(text));
		} catch {
			return { pins: [], collected: [] };
		}
	}

	save(data: NotebookData): boolean {
		try {
			this.storage?.setItem(STORAGE_KEY, JSON.stringify(data));
			return this.storage !== null;
		} catch {
			return false;
		}
	}
}
