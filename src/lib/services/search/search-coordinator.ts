import type { QuestCatalog, SearchEntry, SearchIndex } from '#lib/data/types.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import type { PlaceMarker } from '#lib/services/map/place-markers-layer.js';
import { QuestPresenter } from './quest-presenter.js';
import { pickPlaceColor, SearchEntryPresenter } from './search-entry-presenter.js';
import { SearchService, type SearchTypeFilter } from './search-service.js';

export interface PlaceMarkersDisplay {
	showPlaceMarkers(markers: readonly PlaceMarker[], shouldFlyToMarkers: boolean): void;
	flyToPlaceMarker(index: number): void;
	clearPlaceMarkers(): void;
}

/**
 * Stan wyszukiwania jednego świata: zapytanie, filtr, wybrany wpis i jego znaczniki na mapie.
 * Wpis wybrany przed wczytaniem indeksu (np. z linku) czeka i zostaje pokazany po wczytaniu.
 */
export class SearchCoordinator {
	private searchService: SearchService | null = null;
	private readonly presenter = new SearchEntryPresenter();
	private query = '';
	private typeFilter: SearchTypeFilter = 'all';
	private selectedEntry: SearchEntry | null = null;
	private entryIdAwaitingIndex: string | null = null;
	private shouldFlyToAwaitedEntry = true;
	private modelNamespace = '';
	private readonly questPresenter = new QuestPresenter();
	private loadQuestCatalog: (() => Promise<QuestCatalog>) | null = null;
	private questCatalogLoading: Promise<QuestCatalog> | null = null;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getMarkersDisplay: () => PlaceMarkersDisplay | null
	) {}

	get currentSearchService(): SearchService | null {
		return this.searchService;
	}

	get selectedEntryReference(): { id: string; name: string } | null {
		return this.selectedEntry ? { id: this.selectedEntry.id, name: this.selectedEntry.name } : null;
	}

	useModelNamespace(modelNamespace: string): void {
		this.modelNamespace = modelNamespace;
	}

	/** Źródło pliku `quests.json` bieżącego świata; plik jest ciężki, więc wczytujemy go dopiero przy karcie questa. */
	useQuestCatalogSource(loadQuestCatalog: (() => Promise<QuestCatalog>) | null): void {
		this.loadQuestCatalog = loadQuestCatalog;
		this.questCatalogLoading = null;
	}

	useIndex(index: SearchIndex | null): void {
		this.searchService = index ? new SearchService(index) : null;
		this.clearSelection();
		this.publishResults();
		if (this.entryIdAwaitingIndex) {
			this.selectEntry(this.entryIdAwaitingIndex, this.shouldFlyToAwaitedEntry);
		}
	}

	search(query: string): void {
		this.query = query;
		this.publishResults();
	}

	filterByType(typeFilter: SearchTypeFilter): void {
		this.typeFilter = typeFilter;
		this.publishResults();
	}

	selectEntry(entryId: string, shouldFlyToMarkers = true): void {
		const entry = this.searchService?.findEntry(entryId);
		if (!this.searchService) {
			this.entryIdAwaitingIndex = entryId;
			this.shouldFlyToAwaitedEntry = shouldFlyToMarkers;
			return;
		}
		this.entryIdAwaitingIndex = null;
		if (!entry) return;
		this.selectedEntry = entry;
		this.eventBus.publish({
			type: 'search-entry-selected',
			details: this.presenter.presentDetails(entry, this.modelNamespace)
		});
		this.showSelectedEntryOnMap(shouldFlyToMarkers);
		if (entry.type === 'quest') void this.showQuestDetails(entry);
	}

	clearSelection(): void {
		if (!this.selectedEntry) return;
		this.selectedEntry = null;
		this.getMarkersDisplay()?.clearPlaceMarkers();
		this.eventBus.publish({ type: 'search-entry-selected', details: null });
	}

	flyToPlace(placeIndex: number): void {
		this.getMarkersDisplay()?.flyToPlaceMarker(placeIndex);
	}

	showSelectedEntryOnMap(shouldFlyToMarkers: boolean): void {
		if (!this.selectedEntry) return;
		const markers = this.selectedEntry.places.map((place) => ({
			lon: place.lon,
			lat: place.lat,
			h: place.h,
			color: pickPlaceColor(place)
		}));
		this.getMarkersDisplay()?.showPlaceMarkers(markers, shouldFlyToMarkers);
	}

	private async showQuestDetails(entry: SearchEntry): Promise<void> {
		this.eventBus.publish({
			type: 'quest-details-changed',
			entryId: entry.id,
			status: 'loading',
			details: null
		});
		try {
			const catalog = await this.readQuestCatalog();
			if (this.selectedEntry?.id !== entry.id) return;
			const quest = catalog.quests.find((candidate) => candidate.id === entry.id);
			this.eventBus.publish({
				type: 'quest-details-changed',
				entryId: entry.id,
				status: quest ? 'ready' : 'error',
				details: quest ? this.questPresenter.presentQuest(quest) : null
			});
		} catch (error) {
			console.error(error);
			if (this.selectedEntry?.id !== entry.id) return;
			this.eventBus.publish({
				type: 'quest-details-changed',
				entryId: entry.id,
				status: 'error',
				details: null
			});
		}
	}

	private readQuestCatalog(): Promise<QuestCatalog> {
		if (!this.loadQuestCatalog) return Promise.reject(new Error('Brak źródła questów'));
		if (!this.questCatalogLoading) {
			this.questCatalogLoading = this.loadQuestCatalog().catch((error: unknown) => {
				this.questCatalogLoading = null;
				throw error;
			});
		}
		return this.questCatalogLoading;
	}

	private publishResults(): void {
		const entries = this.searchService?.search(this.query, this.typeFilter) ?? [];
		this.eventBus.publish({
			type: 'search-results-changed',
			query: this.query,
			typeFilter: this.typeFilter,
			results: entries.map((entry) => this.presenter.presentResult(entry))
		});
	}
}
