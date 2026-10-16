import type { AppEventBus } from '#lib/events/app-events.js';
import { CHAPTER_LABELS } from '#lib/services/chapters/chapter-filter.js';
import { TOOL_LABELS } from '#lib/services/tools/tool-id.js';
import type { BookmarkStore, SavedView } from './bookmark-store.js';
import { ViewLinkCodec } from './view-link-codec.js';

export interface BookmarkView {
	id: string;
	name: string;
	savedAtLabel: string;
	details: string;
	gameId: string;
	worldId: string;
	linkQuery: string;
}

export interface NewBookmark {
	name: string;
	entryId: string | null;
	entryName: string | null;
	toolId: SavedView['toolId'];
	camera: SavedView['camera'];
	chapter: SavedView['chapter'];
}

const savedAtFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short' });

function generateBookmarkId(): string {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Zakładki widoku w `localStorage`: lista dotyczy otwartego świata, zapis obejmuje wszystkie światy.
 * Link zakładki to te same parametry adresu, których używa udostępnianie widoku.
 */
export class BookmarksCoordinator {
	private readonly linkCodec = new ViewLinkCodec();
	private allViews: SavedView[] = [];
	private gameId: string | null = null;
	private worldId: string | null = null;
	private hasStorageError = false;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly store: BookmarkStore,
		private readonly now: () => Date = () => new Date(),
		private readonly generateId: () => string = generateBookmarkId
	) {}

	useWorld(gameId: string, worldId: string): void {
		this.gameId = gameId;
		this.worldId = worldId;
		this.allViews = this.store.loadAll();
		this.hasStorageError = false;
		this.publish();
	}

	findBookmark(bookmarkId: string): SavedView | undefined {
		return this.listCurrentWorldViews().find((view) => view.id === bookmarkId);
	}

	addBookmark(bookmark: NewBookmark): void {
		if (this.gameId === null || this.worldId === null) return;
		const trimmedName = bookmark.name.trim();
		this.allViews = [
			...this.allViews,
			{
				id: this.generateId(),
				name: trimmedName || `Zakładka ${this.listCurrentWorldViews().length + 1}`,
				savedAt: this.now().toISOString(),
				gameId: this.gameId,
				worldId: this.worldId,
				entryId: bookmark.entryId,
				entryName: bookmark.entryName,
				toolId: bookmark.toolId,
				camera: bookmark.camera,
				chapter: bookmark.chapter
			}
		];
		this.persistAndPublish();
	}

	removeBookmark(bookmarkId: string): void {
		this.allViews = this.allViews.filter((view) => view.id !== bookmarkId);
		this.persistAndPublish();
	}

	private persistAndPublish(): void {
		this.hasStorageError = !this.store.saveAll(this.allViews);
		this.publish();
	}

	private listCurrentWorldViews(): SavedView[] {
		return this.allViews.filter(
			(view) => view.gameId === this.gameId && view.worldId === this.worldId
		);
	}

	private publish(): void {
		this.eventBus.publish({
			type: 'bookmarks-changed',
			bookmarks: this.listCurrentWorldViews().map((view) => this.presentBookmark(view)),
			hasStorageError: this.hasStorageError
		});
	}

	private presentBookmark(view: SavedView): BookmarkView {
		const details = [
			view.toolId ? `Narzędzie: ${TOOL_LABELS[view.toolId]}` : 'Panel zamknięty',
			view.entryName ? `Wpis: ${view.entryName}` : null,
			view.chapter ? `Rozdział ${CHAPTER_LABELS[view.chapter]}` : null
		].filter((part) => part !== null);
		return {
			id: view.id,
			name: view.name,
			savedAtLabel: savedAtFormat.format(new Date(view.savedAt)),
			details: details.join(' · '),
			gameId: view.gameId,
			worldId: view.worldId,
			linkQuery: this.linkCodec.buildQuery({
				entryId: view.entryId,
				camera: view.camera,
				toolId: view.toolId,
				chapter: view.chapter
			})
		};
	}
}
