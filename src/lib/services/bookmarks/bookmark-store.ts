import { isRecord } from '#lib/data/parsers.js';
import { isToolId, type ToolId } from '#lib/services/tools/tool-id.js';
import type { CameraView } from './camera-view-codec.js';

export interface SavedView {
	id: string;
	name: string;
	savedAt: string;
	gameId: string;
	worldId: string;
	entryId: string | null;
	entryName: string | null;
	toolId: ToolId | null;
	camera: CameraView | null;
}

export type BookmarkStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'gisofgothic:bookmarks:v1';

function readNullableString(record: Record<string, unknown>, key: string): string | null {
	const value = record[key];
	return typeof value === 'string' ? value : null;
}

function readCameraView(value: unknown): CameraView | null {
	if (!isRecord(value)) return null;
	const { east, north, height, headingDegrees, pitchDegrees } = value;
	if (
		typeof east !== 'number' ||
		typeof north !== 'number' ||
		typeof height !== 'number' ||
		typeof headingDegrees !== 'number' ||
		typeof pitchDegrees !== 'number'
	) {
		return null;
	}
	return { east, north, height, headingDegrees, pitchDegrees };
}

function readSavedView(value: unknown): SavedView | null {
	if (!isRecord(value)) return null;
	const { id, name, savedAt, gameId, worldId, toolId } = value;
	if (
		typeof id !== 'string' ||
		typeof name !== 'string' ||
		typeof savedAt !== 'string' ||
		typeof gameId !== 'string' ||
		typeof worldId !== 'string'
	) {
		return null;
	}
	return {
		id,
		name,
		savedAt,
		gameId,
		worldId,
		entryId: readNullableString(value, 'entryId'),
		entryName: readNullableString(value, 'entryName'),
		toolId: isToolId(toolId) ? toolId : null,
		camera: readCameraView(value.camera)
	};
}

/**
 * Zakładki w `localStorage` przeglądarki (jeden klucz, lista JSON). Pamięć bywa niedostępna
 * (tryb prywatny, zablokowane dane witryny) albo zawiera śmieci — wtedy lista jest pusta,
 * a zapis się nie udaje po cichu; aplikacja działa dalej, tylko bez trwałości.
 */
export class BookmarkStore {
	constructor(private readonly storage: BookmarkStorage | null) {}

	static forBrowser(): BookmarkStore {
		try {
			return new BookmarkStore(typeof localStorage === 'undefined' ? null : localStorage);
		} catch {
			return new BookmarkStore(null);
		}
	}

	loadAll(): SavedView[] {
		try {
			const text = this.storage?.getItem(STORAGE_KEY);
			if (!text) return [];
			const parsed: unknown = JSON.parse(text);
			if (!Array.isArray(parsed)) return [];
			return parsed.flatMap((item) => {
				const view = readSavedView(item);
				return view ? [view] : [];
			});
		} catch {
			return [];
		}
	}

	saveAll(views: readonly SavedView[]): boolean {
		try {
			this.storage?.setItem(STORAGE_KEY, JSON.stringify(views));
			return this.storage !== null;
		} catch {
			return false;
		}
	}
}
