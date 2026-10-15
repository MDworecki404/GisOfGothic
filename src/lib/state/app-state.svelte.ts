import type { IndexCounts } from '#lib/data/types.js';
import type { BookmarkView } from '#lib/services/bookmarks/bookmarks-coordinator.js';
import type { CameraView } from '#lib/services/bookmarks/camera-view-codec.js';
import { ViewLinkCodec } from '#lib/services/bookmarks/view-link-codec.js';
import type { AnalysisView } from '#lib/services/analysis/analysis-coordinator.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import {
	COORDINATE_SYSTEMS,
	CoordinateFormatter,
	type CoordinateReading,
	type CoordinateSystem,
	type CoordinateSystemId
} from '#lib/services/geodesy/coordinate-formatter.js';
import { ScaleBarCalculator, type ScaleBar } from '#lib/services/geodesy/scale-bar-calculator.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import type {
	SearchEntryDetails,
	SearchResult
} from '#lib/services/search/search-entry-presenter.js';
import type { SearchTypeFilter } from '#lib/services/search/search-service.js';
import type { FeatureIdentification } from '#lib/services/layers/data-layer-catalog.js';
import type { DataLayerView } from '#lib/services/layers/data-layers-coordinator.js';
import type { MeasurementView } from '#lib/services/measurement/measurement-coordinator.js';
import { formatMinuteOfDay } from '#lib/services/time/daily-schedule.js';
import type { RoutineLayerStatus, ShadowSettings } from '#lib/services/time/time-coordinator.js';
import type { ToolId } from '#lib/services/tools/tool-id.js';

const coordinateFormatter = new CoordinateFormatter();

export interface MeasurementReading {
	label: string;
	value: string;
}
const scaleBarCalculator = new ScaleBarCalculator();
const viewLinkCodec = new ViewLinkCodec();

export type LoadStatus = 'loading' | 'ready' | 'error';

export class AppState {
	worldStatus = $state<LoadStatus>('loading');
	worldErrorMessage = $state<string | null>(null);
	searchIndexStatus = $state<LoadStatus>('loading');
	searchIndexErrorMessage = $state<string | null>(null);
	indexCounts = $state<IndexCounts | null>(null);
	openedWorldName = $state<string | null>(null);
	activeToolId = $state<ToolId | null>('search');
	cursorPosition = $state<WorldPosition | null>(null);
	headingDegrees = $state(0);
	metresPerPixel = $state<number | null>(null);
	coordinateSystemId = $state<CoordinateSystemId>('khorinis-1992');
	searchQuery = $state('');
	searchTypeFilter = $state<SearchTypeFilter>('all');
	searchResults = $state.raw<SearchResult[]>([]);
	selectedEntry = $state.raw<SearchEntryDetails | null>(null);
	dataLayers = $state.raw<DataLayerView[]>([]);
	dataLayerErrorMessage = $state<string | null>(null);
	identifiedFeature = $state.raw<FeatureIdentification | null>(null);
	measurement = $state.raw<MeasurementView | null>(null);
	analysis = $state.raw<AnalysisView | null>(null);
	cameraView = $state.raw<CameraView | null>(null);
	bookmarks = $state.raw<BookmarkView[]>([]);
	bookmarkStorageFailed = $state(false);
	minuteOfDay = $state(12 * 60);
	routineLayerStatus = $state<RoutineLayerStatus>('hidden');
	charactersAtTimeOfDay = $state<number | null>(null);
	shadows = $state.raw<ShadowSettings>({ areEnabled: false, areSoft: true });

	constructor(eventBus: AppEventBus) {
		eventBus.subscribe('search-results-changed', ({ query, typeFilter, results }) => {
			this.searchQuery = query;
			this.searchTypeFilter = typeFilter;
			this.searchResults = results;
		});
		eventBus.subscribe('data-layers-changed', ({ layers }) => {
			this.dataLayers = layers;
			if (layers.every((layer) => layer.status !== 'error')) this.dataLayerErrorMessage = null;
		});
		eventBus.subscribe('data-layer-load-failed', ({ layerName, message }) => {
			this.dataLayerErrorMessage = `Nie udało się wczytać warstwy „${layerName}”: ${message}`;
		});
		eventBus.subscribe(
			'time-of-day-changed',
			({ minuteOfDay, routineLayerStatus, charactersOnMap, shadows }) => {
				this.shadows = shadows;
				this.minuteOfDay = minuteOfDay;
				this.routineLayerStatus = routineLayerStatus;
				this.charactersAtTimeOfDay = charactersOnMap;
			}
		);
		eventBus.subscribe('measurement-changed', ({ measurement }) => {
			this.measurement = measurement;
		});
		eventBus.subscribe('camera-view-changed', ({ view }) => {
			this.cameraView = view;
		});
		eventBus.subscribe('bookmarks-changed', ({ bookmarks, hasStorageError }) => {
			this.bookmarks = bookmarks;
			this.bookmarkStorageFailed = hasStorageError;
		});
		eventBus.subscribe('analysis-changed', ({ analysis }) => {
			this.analysis = analysis;
		});
		eventBus.subscribe('feature-identified', ({ identification }) => {
			this.identifiedFeature = identification;
		});
		eventBus.subscribe('search-entry-selected', ({ details }) => {
			this.selectedEntry = details;
		});
		eventBus.subscribe('tool-selected', ({ toolId }) => {
			this.activeToolId = toolId;
		});
		eventBus.subscribe('cursor-moved', ({ position }) => {
			this.cursorPosition = position;
		});
		eventBus.subscribe('camera-heading-changed', ({ headingDegrees }) => {
			this.headingDegrees = headingDegrees;
		});
		eventBus.subscribe('map-scale-changed', ({ metresPerPixel }) => {
			this.metresPerPixel = metresPerPixel;
		});
		eventBus.subscribe('coordinate-system-changed', ({ systemId }) => {
			this.coordinateSystemId = systemId;
		});
		eventBus.subscribe('world-opened', ({ worldName }) => {
			this.openedWorldName = worldName;
			this.indexCounts = null;
		});
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

	get coordinateSystem(): CoordinateSystem {
		return coordinateFormatter.findCoordinateSystem(this.coordinateSystemId);
	}

	get cursorReadings(): CoordinateReading[] | null {
		if (!this.cursorPosition) return null;
		return coordinateFormatter.formatPosition(this.cursorPosition, this.coordinateSystemId);
	}

	get distanceReadings(): MeasurementReading[] {
		const summary = this.measurement?.summary;
		if (!summary) return [];
		const profile = this.measurement?.profile;
		const readings: MeasurementReading[] = [
			{ label: 'W poziomie', value: coordinateFormatter.formatLength(summary.horizontalMetres) },
			{
				label: 'Różnica wysokości',
				value: coordinateFormatter.formatHeightChange(summary.heightDifferenceMetres)
			}
		];
		if (profile) {
			readings.push(
				{ label: 'Podejścia', value: coordinateFormatter.formatHeightChange(profile.ascentMetres) },
				{ label: 'Zejścia', value: coordinateFormatter.formatHeightChange(-profile.descentMetres) }
			);
		}
		return readings;
	}

	get distanceHeadline(): string | null {
		const summary = this.measurement?.summary;
		if (!summary) return null;
		const profile = this.measurement?.profile;
		return coordinateFormatter.formatLength(
			profile ? profile.terrainMetres : summary.straightMetres
		);
	}

	get areaHeadline(): string | null {
		const polygon = this.measurement?.polygon;
		return polygon ? coordinateFormatter.formatArea(polygon.areaSquareMetres) : null;
	}

	get areaReadings(): MeasurementReading[] {
		const polygon = this.measurement?.polygon;
		if (!polygon) return [];
		return [
			{ label: 'W hektarach', value: coordinateFormatter.formatHectares(polygon.areaSquareMetres) },
			{ label: 'Obwód', value: coordinateFormatter.formatLength(polygon.perimeterMetres) }
		];
	}

	get measuredPointReadings(): { systemName: string; readings: CoordinateReading[] }[] {
		const point = this.measurement?.pickedPoint;
		if (!point) return [];
		return COORDINATE_SYSTEMS.map((system) => ({
			systemName: system.name,
			readings: coordinateFormatter.formatPosition(point, system.id)
		}));
	}

	get measuredPointMarvinCommand(): string | null {
		const point = this.measurement?.pickedPoint;
		return point ? coordinateFormatter.formatMarvinTeleportCommand(point) : null;
	}

	/** Parametry adresu odtwarzające bieżący widok: wpis, kamera i narzędzie. */
	get sharedViewQuery(): string {
		return viewLinkCodec.buildQuery({
			entryId: this.selectedEntry?.id ?? null,
			camera: this.cameraView,
			toolId: this.activeToolId
		});
	}

	formatLength(lengthMetres: number): string {
		return coordinateFormatter.formatLength(lengthMetres);
	}

	get timeOfDayLabel(): string {
		return formatMinuteOfDay(this.minuteOfDay);
	}

	get scaleBar(): ScaleBar | null {
		return this.metresPerPixel === null ? null : scaleBarCalculator.calculate(this.metresPerPixel);
	}

	get hasError(): boolean {
		return this.worldStatus === 'error' || this.searchIndexStatus === 'error';
	}
}
