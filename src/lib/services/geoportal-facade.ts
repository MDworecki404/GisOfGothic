import type { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { WorldDefinition } from '#lib/data/world-catalog.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import type { BookmarkStore } from './bookmarks/bookmark-store.js';
import { BookmarksCoordinator } from './bookmarks/bookmarks-coordinator.js';
import type { CameraView } from './bookmarks/camera-view-codec.js';
import { ViewLinkCodec, type SharedViewState } from './bookmarks/view-link-codec.js';
import type { MapViewInsets } from './map/free-area-calculator.js';
import { ModelPreview } from './map/model-preview.js';
import type { ProtectedModelLoader } from './models/protected-model-loader.js';
import { PreviewOrientationChooser } from './models/preview-orientation.js';
import { AnalysisCoordinator, type AnalysisMode } from './analysis/analysis-coordinator.js';
import { ChapterFilter, type ChapterNumber } from './chapters/chapter-filter.js';
import type { GridShape } from './analysis/density-grid-builder.js';
import { CoordinateFormatter, type CoordinateSystemId } from './geodesy/coordinate-formatter.js';
import { StaticObjectsCoordinator } from './layers/static-objects-coordinator.js';
import { DataLayersCoordinator } from './layers/data-layers-coordinator.js';
import type { DataLayerId } from './layers/data-layer-catalog.js';
import { MapService } from './map/map-service.js';
import {
	MeasurementCoordinator,
	type MeasurementMode
} from './measurement/measurement-coordinator.js';
import type { MapClick, MapViewListeners } from './map/map-view-observer.js';
import { SearchCoordinator } from './search/search-coordinator.js';
import type { SearchTypeFilter } from './search/search-service.js';
import { ROUTINE_LAYER_ID, TimeCoordinator, type ShadowSettings } from './time/time-coordinator.js';
import type { ToolId } from './tools/tool-id.js';

export type DataLoaderFactory = (dataBaseUrl: string) => GeoportalDataLoader;

const OFFLINE_WORLD_MESSAGE =
	'brak połączenia z internetem — model świata pobiera się z sieci; wyszukiwarka i dane działają dalej';

function describeWorldLoadError(error: unknown): string {
	return navigator.onLine ? describeError(error) : OFFLINE_WORLD_MESSAGE;
}

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Jedyny punkt wejścia UI do logiki aplikacji. Komponenty wywołują jego metody,
 * a wyniki odbierają jako zdarzenia z magistrali. Mapa i otwarty świat są niezależne:
 * kolejność `attachMapTo` i `openWorld` nie ma znaczenia.
 */
export class GeoportalFacade {
	private mapService: MapService | null = null;
	private currentWorld: WorldDefinition | null = null;
	private currentDataLoader: GeoportalDataLoader | null = null;
	private worldLoadGeneration = 0;
	private activeToolId: ToolId | null = 'search';
	private selectedChapter: ChapterNumber | null = null;
	private coordinateSystemId: CoordinateSystemId = 'khorinis-1992';
	private readonly coordinateFormatter = new CoordinateFormatter();
	private readonly searchCoordinator: SearchCoordinator;
	private readonly previewOrientationChooser = new PreviewOrientationChooser();
	private readonly analysisCoordinator: AnalysisCoordinator;
	private readonly bookmarksCoordinator: BookmarksCoordinator;
	private readonly viewLinkCodec = new ViewLinkCodec();
	private pendingCameraView: CameraView | null = null;
	private isWorldShownOnMap = false;
	private mapViewInsets: MapViewInsets = { leftPixels: 0, bottomPixels: 0 };
	private readonly dataLayersCoordinator: DataLayersCoordinator;
	private readonly staticObjectsCoordinator: StaticObjectsCoordinator;
	private readonly measurementCoordinator: MeasurementCoordinator;
	private readonly timeCoordinator: TimeCoordinator;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly createDataLoader: DataLoaderFactory,
		bookmarkStore: BookmarkStore,
		private readonly protectedModelLoader: ProtectedModelLoader | null
	) {
		this.bookmarksCoordinator = new BookmarksCoordinator(eventBus, bookmarkStore);
		this.searchCoordinator = new SearchCoordinator(eventBus, () => this.mapService);
		this.analysisCoordinator = new AnalysisCoordinator(
			eventBus,
			() => this.searchCoordinator.currentSearchService,
			() => this.mapService,
			(layerId) => this.dataLayersCoordinator.loadLayerFeatures(layerId)
		);
		this.dataLayersCoordinator = new DataLayersCoordinator(eventBus, () => this.mapService);
		this.staticObjectsCoordinator = new StaticObjectsCoordinator(eventBus, () => this.mapService);
		this.measurementCoordinator = new MeasurementCoordinator(eventBus, () => this.mapService);
		this.timeCoordinator = new TimeCoordinator(eventBus, () => this.mapService);
	}

	openWorld(world: WorldDefinition): void {
		if (this.currentWorld?.id === world.id && this.currentWorld.gameId === world.gameId) return;
		this.currentWorld = world;
		this.isWorldShownOnMap = false;
		this.pendingCameraView = null;
		this.bookmarksCoordinator.useWorld(world.gameId, world.id);
		this.currentDataLoader = this.createDataLoader(world.dataBaseUrl);
		this.eventBus.publish({
			type: 'world-opened',
			worldName: world.name,
			localCoordinateSystemName: world.localCoordinateSystemName
		});
		this.searchCoordinator.useModelNamespace(world.modelNamespace);
		this.staticObjectsCoordinator.useWorld(world.staticObjectsTilesetUrl);
		this.searchCoordinator.useIndex(null);
		this.analysisCoordinator.resetForNewWorld();
		this.dataLayersCoordinator.useWorld(this.currentDataLoader, {});
		this.measurementCoordinator.clear();
		this.timeCoordinator.useWorld(this.currentDataLoader);
		this.selectChapter(null);
		void this.loadSearchIndexOfCurrentWorld();
		void this.showCurrentWorldOnMap();
	}

	attachMapTo(container: HTMLElement): void {
		this.isWorldShownOnMap = false;
		this.mapService = new MapService(container, this.createMapViewListeners());
		this.mapService.setViewInsets(this.mapViewInsets);
		void this.showCurrentWorldOnMap();
		this.searchCoordinator.showSelectedEntryOnMap(false);
		this.dataLayersCoordinator.showVisibleLayersOnMap();
		this.timeCoordinator.showOnMap();
		if (this.activeToolId === 'analysis') this.analysisCoordinator.activate();
	}

	/**
	 * Odtwarza widok z adresu strony (`?wpis=…&widok=…&narzedzie=…&rozdzial=…`). Kamera czeka na wczytanie
	 * modelu świata, a wpis na wczytanie indeksu; przy kamerze z linku kamera nie leci do miejsc wpisu.
	 */
	openSharedView(query: string): void {
		this.applyViewState(this.viewLinkCodec.parseQuery(query), false);
	}

	saveBookmark(name: string): void {
		const viewState = this.captureViewState();
		this.bookmarksCoordinator.addBookmark({
			name,
			entryId: viewState.entryId,
			entryName: this.searchCoordinator.selectedEntryReference?.name ?? null,
			toolId: viewState.toolId,
			camera: viewState.camera,
			chapter: viewState.chapter
		});
	}

	restoreBookmark(bookmarkId: string): void {
		const bookmark = this.bookmarksCoordinator.findBookmark(bookmarkId);
		if (!bookmark) return;
		this.applyViewState(
			{
				entryId: bookmark.entryId,
				camera: bookmark.camera,
				toolId: bookmark.toolId,
				chapter: bookmark.chapter
			},
			true
		);
	}

	deleteBookmark(bookmarkId: string): void {
		this.bookmarksCoordinator.removeBookmark(bookmarkId);
	}

	/**
	 * UI zgłasza, ile pikseli mapy od lewej i od dołu zasłaniają panele. Przeloty kamery
	 * (do znaczników, miejsc, całego świata) kadrują cel w pozostałym, wolnym obszarze.
	 */
	reserveMapSpace(insets: MapViewInsets): void {
		this.mapViewInsets = insets;
		this.mapService?.setViewInsets(insets);
	}

	setTimeOfDay(minuteOfDay: number): void {
		this.timeCoordinator.setMinuteOfDay(minuteOfDay);
	}

	/** Wybiera rozdział I–VI dla postaci na mapie; `null` pokazuje wszystkie rozdziały. */
	selectChapter(chapter: ChapterNumber | null): void {
		this.selectedChapter = chapter;
		const chapterFilter = new ChapterFilter(chapter);
		this.dataLayersCoordinator.useChapterFilter(chapterFilter);
		this.timeCoordinator.useChapterFilter(chapterFilter);
		this.eventBus.publish({ type: 'chapter-changed', chapter });
	}

	setShadows(settings: ShadowSettings): void {
		this.timeCoordinator.setShadows(settings);
	}

	toggleCharactersAtTimeOfDay(): void {
		void this.timeCoordinator.toggleRoutineLayer();
	}

	toggleStaticObjects(): void {
		void this.staticObjectsCoordinator.toggle();
	}

	toggleDataLayer(layerId: DataLayerId): void {
		void this.dataLayersCoordinator.toggleLayer(layerId);
	}

	closeFeatureIdentification(): void {
		this.eventBus.publish({ type: 'feature-identified', identification: null });
	}

	search(query: string): void {
		this.searchCoordinator.search(query);
	}

	filterSearchByType(typeFilter: SearchTypeFilter): void {
		this.searchCoordinator.filterByType(typeFilter);
	}

	selectSearchEntry(entryId: string): void {
		this.searchCoordinator.selectEntry(entryId);
	}

	clearSearchSelection(): void {
		this.searchCoordinator.clearSelection();
	}

	flyToPlaceOfSelectedEntry(placeIndex: number): void {
		this.searchCoordinator.flyToPlace(placeIndex);
	}

	selectTool(toolId: ToolId): void {
		this.activateTool(this.activeToolId === toolId ? null : toolId);
	}

	closeActiveTool(): void {
		this.activateTool(null);
	}

	switchMeasurementMode(mode: MeasurementMode): void {
		this.measurementCoordinator.switchMode(mode);
	}

	removeLastMeasurementPoint(): void {
		this.measurementCoordinator.removeLastPoint();
	}

	clearMeasurement(): void {
		this.measurementCoordinator.clear();
	}

	switchAnalysisMode(mode: AnalysisMode): void {
		this.analysisCoordinator.switchMode(mode);
	}

	setAnalysisRadius(radiusMetres: number): void {
		this.analysisCoordinator.setRadius(radiusMetres);
	}

	setAnalysisCellShape(cellShape: GridShape): void {
		this.analysisCoordinator.setCellShape(cellShape);
	}

	setAnalysisCellSize(cellSizeMetres: number): void {
		this.analysisCoordinator.setCellSize(cellSizeMetres);
	}

	setAnalysisSubjectQuery(query: string): void {
		this.analysisCoordinator.setSubjectQuery(query);
	}

	selectAnalysisSubject(entryId: string): void {
		this.analysisCoordinator.selectSubject(entryId);
	}

	clearAnalysisSubject(): void {
		this.analysisCoordinator.clearSubject();
	}

	flyToNearestPlace(index: number): void {
		this.analysisCoordinator.flyToNearestPlace(index);
	}

	switchToNextCoordinateSystem(): void {
		this.coordinateSystemId = this.coordinateFormatter.findNextCoordinateSystem(
			this.coordinateSystemId
		).id;
		this.eventBus.publish({ type: 'coordinate-system-changed', systemId: this.coordinateSystemId });
	}

	zoomIn(): void {
		this.mapService?.zoomIn();
	}

	zoomOut(): void {
		this.mapService?.zoomOut();
	}

	showWholeWorld(): void {
		this.mapService?.showWholeWorld();
	}

	turnMapToNorth(): void {
		this.mapService?.turnToNorth();
	}

	/**
	 * Pokazuje podgląd 3D jednego przedmiotu w podanym kontenerze; zwraca funkcję sprzątającą.
	 * Model przychodzi zaszyfrowany z bramki modeli i jest odszyfrowywany tylko w pamięci;
	 * płaskie przedmioty (broń, pancerze) są układane według wymiarów zapisanych w modelu.
	 */
	showModelPreview(container: HTMLElement, modelPath: string): () => void {
		const preview = new ModelPreview(container);
		const world = this.currentWorld;
		const loader = this.protectedModelLoader;
		if (world && loader) {
			loader
				.loadModel(world.protectedModelsUrl, modelPath)
				.then((model) =>
					preview.showModel(
						model.glb,
						model.fileId,
						this.previewOrientationChooser.chooseOrientation(model.bounds, modelPath)
					)
				)
				.catch((error: unknown) => console.error(error));
		}
		return () => preview.destroy();
	}

	detachMap(): void {
		this.worldLoadGeneration++;
		this.isWorldShownOnMap = false;
		this.mapService?.destroy();
		this.mapService = null;
	}

	private createMapViewListeners(): MapViewListeners {
		return {
			onCursorMoved: (position) => this.eventBus.publish({ type: 'cursor-moved', position }),
			onMapClicked: (click) => this.reactToMapClick(click),
			onHeadingChanged: (headingDegrees) =>
				this.eventBus.publish({ type: 'camera-heading-changed', headingDegrees }),
			onScaleChanged: (metresPerPixel) =>
				this.eventBus.publish({ type: 'map-scale-changed', metresPerPixel }),
			onCameraSettled: () => this.publishCameraView()
		};
	}

	private captureViewState(): SharedViewState {
		return {
			entryId: this.searchCoordinator.selectedEntryReference?.id ?? null,
			camera: this.mapService?.readCameraView() ?? null,
			toolId: this.activeToolId,
			chapter: this.selectedChapter
		};
	}

	private applyViewState(state: SharedViewState, isCameraAnimated: boolean): void {
		this.activateTool(state.toolId);
		this.selectChapter(state.chapter);
		if (state.entryId) this.searchCoordinator.selectEntry(state.entryId, state.camera === null);
		else this.searchCoordinator.clearSelection();
		const camera = state.camera;
		if (!camera) return;
		if (this.isWorldShownOnMap) {
			this.mapService?.moveCameraToView(camera, isCameraAnimated ? 1.5 : 0);
			this.publishCameraView();
		} else {
			this.pendingCameraView = camera;
		}
	}

	private publishCameraView(): void {
		this.eventBus.publish({
			type: 'camera-view-changed',
			view: this.mapService?.readCameraView() ?? null
		});
	}

	private activateTool(toolId: ToolId | null): void {
		if (this.activeToolId === 'measure' && toolId !== 'measure')
			this.measurementCoordinator.clear();
		if (this.activeToolId === 'analysis' && toolId !== 'analysis')
			this.analysisCoordinator.deactivate();
		if (toolId === 'analysis' && this.activeToolId !== 'analysis')
			this.analysisCoordinator.activate();
		this.activeToolId = toolId;
		this.eventBus.publish({ type: 'tool-selected', toolId });
	}

	private reactToMapClick(click: MapClick): void {
		if (this.activeToolId === 'measure') {
			if (click.position) this.measurementCoordinator.addPoint(click.position);
			return;
		}
		if (this.activeToolId === 'analysis' && this.analysisCoordinator.usesMapClicks) {
			if (click.position) this.analysisCoordinator.setOrigin(click.position);
			return;
		}
		const pick = click.featurePick;
		if (!pick) this.closeFeatureIdentification();
		else if (pick.layerId === ROUTINE_LAYER_ID)
			this.timeCoordinator.identifyCharacter(pick.featureIndex);
		else this.dataLayersCoordinator.identifyFeature(pick);
	}

	private async loadSearchIndexOfCurrentWorld(): Promise<void> {
		const dataLoader = this.currentDataLoader;
		if (!dataLoader) return;
		this.eventBus.publish({ type: 'search-index-load-started' });
		try {
			const index = await dataLoader.loadSearchIndex();
			if (dataLoader !== this.currentDataLoader) return;
			this.searchCoordinator.useIndex(index);
			this.eventBus.publish({
				type: 'search-index-loaded',
				counts: dataLoader.countEntriesByType(index)
			});
		} catch (error) {
			if (dataLoader !== this.currentDataLoader) return;
			console.error(error);
			this.eventBus.publish({ type: 'search-index-load-failed', message: describeError(error) });
		}
	}

	/**
	 * Każde wczytanie dostaje numer pokolenia; wynik starszego wczytania (po zmianie świata
	 * albo odpięciu mapy w trakcie) jest pomijany, żeby nie nadpisać nowszego stanu.
	 */
	private async showCurrentWorldOnMap(): Promise<void> {
		const mapService = this.mapService;
		const world = this.currentWorld;
		const dataLoader = this.currentDataLoader;
		if (!mapService || !world || !dataLoader) return;

		const generation = ++this.worldLoadGeneration;
		const isStillCurrent = (): boolean => generation === this.worldLoadGeneration;
		this.eventBus.publish({ type: 'world-load-started' });
		try {
			const metadata = await dataLoader.loadMetadata();
			if (!isStillCurrent()) return;
			this.dataLayersCoordinator.updateFeatureCounts(metadata.package.counts);
			this.analysisCoordinator.useAnchor(metadata.anchor);
			await mapService.showWorldTileset(world.worldTilesetUrl, metadata.anchor);
			if (!isStillCurrent()) return;
			this.isWorldShownOnMap = true;
			const cameraFromLink = this.pendingCameraView;
			this.pendingCameraView = null;
			if (cameraFromLink) mapService.moveCameraToView(cameraFromLink, 0);
			this.eventBus.publish({ type: 'world-loaded' });
			this.staticObjectsCoordinator.restoreOnMap();
			this.searchCoordinator.showSelectedEntryOnMap(cameraFromLink === null);
			if (cameraFromLink) this.publishCameraView();
		} catch (error) {
			if (!isStillCurrent()) return;
			console.error(error);
			this.eventBus.publish({ type: 'world-load-failed', message: describeWorldLoadError(error) });
		}
	}
}
