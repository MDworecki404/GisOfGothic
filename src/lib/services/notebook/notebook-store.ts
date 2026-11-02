import { isRecord } from '#lib/data/parsers.js';

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

export interface CollectedQuest {
	gameId: string;
	worldId: string;
	questId: string;
	questName: string;
}

/** Jedno odhaczone miejsce przedmiotu; `placeKey` pochodzi z `buildPlaceKey`. */
export interface CollectedPlace {
	gameId: string;
	worldId: string;
	entryId: string;
	entryName: string;
	placeKey: string;
}

export interface NotebookData {
	pins: SavedPin[];
	collectedQuests: CollectedQuest[];
	collectedPlaces: CollectedPlace[];
}

export type NotebookStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'gisofgothic:notebook:v1';

export function createEmptyNotebookData(): NotebookData {
	return { pins: [], collectedQuests: [], collectedPlaces: [] };
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

export function readCollectedQuest(value: unknown): CollectedQuest | null {
	if (!isRecord(value)) return null;
	const { gameId, worldId, questId, questName } = value;
	if (
		typeof gameId !== 'string' ||
		typeof worldId !== 'string' ||
		typeof questId !== 'string' ||
		typeof questName !== 'string'
	) {
		return null;
	}
	return { gameId, worldId, questId, questName };
}

export function readCollectedPlace(value: unknown): CollectedPlace | null {
	if (!isRecord(value)) return null;
	const { gameId, worldId, entryId, entryName, placeKey } = value;
	if (
		typeof gameId !== 'string' ||
		typeof worldId !== 'string' ||
		typeof entryId !== 'string' ||
		typeof entryName !== 'string' ||
		typeof placeKey !== 'string'
	) {
		return null;
	}
	return { gameId, worldId, entryId, entryName, placeKey };
}

function readList<T>(value: unknown, readItem: (item: unknown) => T | null): T[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item) => {
		const parsed = readItem(item);
		return parsed ? [parsed] : [];
	});
}

/** Wyciąga z dowolnego JSON-a tylko poprawne pinezki i odhaczenia; resztę po cichu pomija. */
export function readNotebookData(value: unknown): NotebookData {
	if (!isRecord(value)) return createEmptyNotebookData();
	return {
		pins: readList(value.pins, readSavedPin),
		collectedQuests: readList(value.collectedQuests, readCollectedQuest),
		collectedPlaces: readList(value.collectedPlaces, readCollectedPlace)
	};
}

/**
 * Pinezki oraz lista „co zebrałem” (wykonane questy i zebrane miejsca przedmiotów) w `localStorage`
 * przeglądarki (jeden klucz, obiekt JSON). Niedostępna pamięć albo śmieci dają pusty notatnik,
 * a nieudany zapis jest zgłaszany wynikiem.
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
			if (!text) return createEmptyNotebookData();
			return readNotebookData(JSON.parse(text));
		} catch {
			return createEmptyNotebookData();
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
