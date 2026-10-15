import type { SearchEntry, SearchIndex } from '#lib/data/types.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import type { PlaceMarker } from '#lib/services/map/place-markers-layer.js';
import { PLACE_KIND_PRESENTATION, SearchEntryPresenter } from './search-entry-presenter.js';
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

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getMarkersDisplay: () => PlaceMarkersDisplay | null
	) {}

	useIndex(index: SearchIndex | null): void {
		this.searchService = index ? new SearchService(index) : null;
		this.clearSelection();
		this.publishResults();
		if (this.entryIdAwaitingIndex) this.selectEntry(this.entryIdAwaitingIndex);
	}

	search(query: string): void {
		this.query = query;
		this.publishResults();
	}

	filterByType(typeFilter: SearchTypeFilter): void {
		this.typeFilter = typeFilter;
		this.publishResults();
	}

	selectEntry(entryId: string): void {
		const entry = this.searchService?.findEntry(entryId);
		if (!this.searchService) {
			this.entryIdAwaitingIndex = entryId;
			return;
		}
		this.entryIdAwaitingIndex = null;
		if (!entry) return;
		this.selectedEntry = entry;
		this.eventBus.publish({
			type: 'search-entry-selected',
			details: this.presenter.presentDetails(entry)
		});
		this.showSelectedEntryOnMap(true);
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
			color: PLACE_KIND_PRESENTATION[place.kind].color
		}));
		this.getMarkersDisplay()?.showPlaceMarkers(markers, shouldFlyToMarkers);
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
