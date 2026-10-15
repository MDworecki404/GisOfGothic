import type { IndexCounts } from '#lib/data/types.js';
import type { AppEventBus } from '#lib/events/app-events.js';

export type LoadStatus = 'loading' | 'ready' | 'error';

export class AppState {
	worldStatus = $state<LoadStatus>('loading');
	worldErrorMessage = $state<string | null>(null);
	searchIndexStatus = $state<LoadStatus>('loading');
	searchIndexErrorMessage = $state<string | null>(null);
	indexCounts = $state<IndexCounts | null>(null);

	constructor(eventBus: AppEventBus) {
		eventBus.subscribe('world-load-started', () => {
			this.worldStatus = 'loading';
			this.worldErrorMessage = null;
		});
		eventBus.subscribe('world-loaded', () => {
			this.worldStatus = 'ready';
		});
		eventBus.subscribe('world-load-failed', ({ message }) => {
			this.worldStatus = 'error';
			this.worldErrorMessage = message;
		});
		eventBus.subscribe('search-index-load-started', () => {
			this.searchIndexStatus = 'loading';
			this.searchIndexErrorMessage = null;
		});
		eventBus.subscribe('search-index-loaded', ({ counts }) => {
			this.searchIndexStatus = 'ready';
			this.indexCounts = counts;
		});
		eventBus.subscribe('search-index-load-failed', ({ message }) => {
			this.searchIndexStatus = 'error';
			this.searchIndexErrorMessage = message;
		});
	}

	get statusText(): string {
		if (this.worldStatus === 'error') {
			return `Błąd wczytywania modelu świata: ${this.worldErrorMessage}`;
		}
		if (this.searchIndexStatus === 'error') {
			return `Błąd wczytywania indeksu: ${this.searchIndexErrorMessage}`;
		}
		if (this.worldStatus === 'loading') return 'Wczytywanie modelu świata…';
		if (this.indexCounts) {
			return `Przedmioty: ${this.indexCounts.items} · Postacie: ${this.indexCounts.characters}`;
		}
		return 'Wczytywanie indeksu…';
	}

	get hasError(): boolean {
		return this.worldStatus === 'error' || this.searchIndexStatus === 'error';
	}
}
