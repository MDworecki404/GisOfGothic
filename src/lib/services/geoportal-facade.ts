import { guildNameBook } from '#lib/data/category-names.js';
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
import { FlightInputMixer } from './flight/flight-input-mixer.js';
import type { FlightInput } from './flight/flight-input.js';
import { KeyboardFlightListener } from './flight/keyboard-flight-listener.js';
import { StickDeflectionCalculator } from './flight/stick-deflection-calculator.js';
import { StaticObjectsCoordinator } from './layers/static-objects-coordinator.js';
import { TreasureSetBook } from './loot/treasure-set-book.js';
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
import { CameraProjectionCoordinator } from './camera/camera-projection-coordinator.js';
import type { CameraPreset } from './camera/camera-preset-builder.js';
import { KeyboardProjectionListener } from './camera/keyboard-projection-listener.js';
import { PerformanceCoordinator } from './performance/performance-coordinator.js';
import type { PerformancePreferenceStore } from './performance/performance-preference-store.js';
import type { PerformancePreference } from './performance/performance-profiles.js';
import { ROUTINE_LAYER_ID, TimeCoordinator, type ShadowSettings } from './time/time-coordinator.js';
import type { ToolId } from './tools/tool-id.js';

export type FlightStick = 'move' | 'look';

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
	private readonly flightInputMixer = new FlightInputMixer();
	private readonly stickDeflectionCalculator = new StickDeflectionCalculator();
	private pendingCameraView: CameraView | null = null;
	private isWorldShownOnMap = false;
	private mapViewInsets: MapViewInsets = { leftPixels: 0, bottomPixels: 0 };
	private readonly treasureSetBook = new TreasureSetBook();
	private readonly dataLayersCoordinator: DataLayersCoordinator;
	private readonly staticObjectsCoordinator: StaticObjectsCoordinator;
	private readonly measurementCoordinator: MeasurementCoordinator;
	private readonly timeCoordinator: TimeCoordinator;
	private readonly performanceCoordinator: PerformanceCoordinator;
	private readonly cameraProjectionCoordinator: CameraProjectionCoordinator;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly createDataLoader: DataLoaderFactory,
		bookmarkStore: BookmarkStore,
		private readonly protectedModelLoader: ProtectedModelLoader | null,
		performancePreferenceStore: PerformancePreferenceStore
	) {
		this.bookmarksCoordinator = new BookmarksCoordinator(eventBus, bookmarkStore);
		this.searchCoordinator = new SearchCoordinator(eventBus, () => this.mapService);
		this.analysisCoordinator = new AnalysisCoordinator(
			eventBus,
			() => this.searchCoordinator.currentSearchService,
			() => this.mapService,
			(layerId) => this.dataLayersCoordinator.loadLayerFeatures(layerId)
		);
		this.dataLayersCoordinator = new DataLayersCoordinator(
			eventBus,
			() => this.mapService,
			this.treasureSetBook
		);
		this.staticObjectsCoordinator = new StaticObjectsCoordinator(eventBus, () => this.mapService);
		this.measurementCoordinator = new MeasurementCoordinator(eventBus, () => this.mapService);
		this.timeCoordinator = new TimeCoordinator(eventBus, () => this.mapService);
		this.cameraProjectionCoordinator = new CameraProjectionCoordinator(
			eventBus,
			() => this.mapService
		);
		this.performanceCoordinator = new PerformanceCoordinator(
			eventBus,
			() => this.mapService,
			performancePreferenceStore
		);
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
			localCoordinateSystemName: world.localCoordinateSystemName,
			hasChapters: world.hasChapters,
			hasApproximateRoutineTimes: world.hasApproximateRoutineTimes
		});
		this.searchCoordinator.useModelNamespace(world.modelNamespace);
		this.staticObjectsCoordinator.useWorld(world.staticObjectsTilesetUrl);
		this.searchCoordinator.useIndex(null);
		guildNameBook.useGuildNames(undefined);
		const questDataLoader = this.currentDataLoader;
		this.searchCoordinator.useQuestCatalogSource(() => questDataLoader.loadQuestCatalog());
		this.analysisCoordinator.resetForNewWorld();
		this.treasureSetBook.useWorld(this.currentDataLoader);
		this.dataLayersCoordinator.useWorld(this.currentDataLoader, {});
		this.measurementCoordinator.clear();
		this.timeCoordinator.useWorld(this.currentDataLoader);
		this.timeCoordinator.useApproximateRoutineTimes(world.hasApproximateRoutineTimes);
		this.selectChapter(null);
		void this.loadSearchIndexOfCurrentWorld();
		void this.showCurrentWorldOnMap();
	}

	/** Tworzy mapę w `container`; atrybucje źródeł danych (wymagane przez Cesium ion) trafiają do `creditContainer`. */
	attachMapTo(container: HTMLElement, creditContainer: HTMLElement): void {
		this.isWorldShownOnMap = false;
		this.mapService = new MapService(container, creditContainer, this.createMapViewListeners());
		this.mapService.setViewInsets(this.mapViewInsets);
		void this.showCurrentWorldOnMap();
		this.searchCoordinator.showSelectedEntryOnMap(false);
		this.dataLayersCoordinator.showVisibleLayersOnMap();
		this.timeCoordinator.showOnMap();
		this.performanceCoordinator.showOnMap();
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
			projection: viewState.projection,
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
				projection: bookmark.projection,
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

	/** Wybiera jakość renderowania: `auto` dostosowuje ją do FPS, pozostałe wartości ustawiają ją na stałe. */
	selectPerformance(preference: PerformancePreference): void {
		this.performanceCoordinator.selectPreference(preference);
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
		this.dataLayersCoordinator.cancelPendingIdentification();
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

	/**
	 * Włącza sterowanie lotem kamery z klawiatury (WASD – ruch, strzałki – obrót, Q/E – wysokość,
	 * Shift – przyspieszenie); zwraca funkcję wyłączającą.
	 */
	listenToFlightKeyboard(eventSource: Window): () => void {
		return new KeyboardFlightListener(eventSource, (input) => {
			this.flightInputMixer.replaceKeyboardInput(input);
			this.sendFlightInputToMap();
		}).start();
	}

	/** Wychylenie gałki joysticka: przesunięcie od środka i promień w pikselach ekranu. */
	deflectFlightStick(
		stick: FlightStick,
		offsetXPixels: number,
		offsetYPixels: number,
		radiusPixels: number
	): void {
		const deflection = this.stickDeflectionCalculator.calculate(
			offsetXPixels,
			offsetYPixels,
			radiusPixels
		);
		if (stick === 'move') this.flightInputMixer.replaceMoveStick(deflection);
		else this.flightInputMixer.replaceLookStick(deflection);
		this.sendFlightInputToMap();
	}

	releaseFlightStick(stick: FlightStick): void {
		this.deflectFlightStick(stick, 0, 0, 1);
	}

	/** Przyciski wysokości na ekranie: 1 – w górę, -1 – w dół, 0 – puszczony. */
	pressFlightRiseButton(direction: -1 | 0 | 1): void {
		this.flightInputMixer.replaceRiseButton(direction);
		this.sendFlightInputToMap();
	}

	selectCameraProjection(kind: 'perspective' | 'orthographic'): void {
		this.cameraProjectionCoordinator.selectKind(kind);
	}

	toggleCameraProjection(): void {
		this.cameraProjectionCoordinator.toggleKind();
	}

	/** Ustawia kąt widzenia kamery w stopniach (przycinany do 30–100°); w rzucie ortogonalnym tylko go zapamiętuje. */
	setCameraFieldOfView(degrees: number): void {
		this.cameraProjectionCoordinator.setFieldOfView(degrees);
	}

	/** Włącza przełączanie rzutu klawiszem P; zwraca funkcję wyłączającą. */
	listenToProjectionKeyboard(eventSource: Window): () => void {
		return new KeyboardProjectionListener(eventSource, () =>
			this.cameraProjectionCoordinator.toggleKind()
		).start();
	}

	showCameraPreset(preset: CameraPreset): void {
		this.mapService?.showCameraPreset(preset);
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

	/** Podgląd 3D modelu z paczki świata (np. skrzyni); `modelFile` jest względem adresu modeli świata. */
	showWorldModelPreview(container: HTMLElement, modelFile: string): () => void {
		const world = this.currentWorld;
		if (!world) return () => {};
		return this.showModelPreview(container, `${world.modelNamespace}/${modelFile}`);
	}

	detachMap(): void {
		this.worldLoadGeneration++;
		this.isWorldShownOnMap = false;
		this.mapService?.destroy();
		this.mapService = null;
	}

	private sendFlightInputToMap(): void {
		const input: FlightInput = this.flightInputMixer.mix();
		this.mapService?.setFlightInput(input);
	}

	private createMapViewListeners(): MapViewListeners {
		return {
			onCursorMoved: (position) => this.eventBus.publish({ type: 'cursor-moved', position }),
			onMapClicked: (click) => this.reactToMapClick(click),
			onHeadingChanged: (headingDegrees) =>
				this.eventBus.publish({ type: 'camera-heading-changed', headingDegrees }),
			onScaleChanged: (metresPerPixel) =>
				this.eventBus.publish({ type: 'map-scale-changed', metresPerPixel }),
			onCameraSettled: () => this.publishCameraView(),
			onTilesLoadProgress: (layer, pendingTiles) =>
				this.eventBus.publish({ type: 'tiles-load-progress', layer, pendingTiles }),
			onFrameRendered: (timestampMilliseconds) =>
				this.performanceCoordinator.recordFrame(timestampMilliseconds)
		};
	}

	private captureViewState(): SharedViewState {
		return {
			entryId: this.searchCoordinator.selectedEntryReference?.id ?? null,
			camera: this.mapService?.readCameraView() ?? null,
			projection: this.cameraProjectionCoordinator.currentSetting,
			toolId: this.activeToolId,
			chapter: this.selectedChapter
		};
	}

	private applyViewState(state: SharedViewState, isCameraAnimated: boolean): void {
		this.activateTool(state.toolId);
		this.selectChapter(state.chapter);
		this.cameraProjectionCoordinator.restore(state.projection);
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
		if (this.activeToolId === 'search' && toolId === null) this.searchCoordinator.clearSelection();
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
		else if (pick.layerId === ROUTINE_LAYER_ID) {
			this.dataLayersCoordinator.cancelPendingIdentification();
			this.timeCoordinator.identifyCharacter(pick.featureIndex);
		} else this.dataLayersCoordinator.identifyFeature(pick);
	}

	private async loadSearchIndexOfCurrentWorld(): Promise<void> {
		const dataLoader = this.currentDataLoader;
		if (!dataLoader) return;
		this.eventBus.publish({ type: 'search-index-load-started' });
		try {
			const [metadata, index] = await Promise.all([
				dataLoader.loadMetadata(),
				dataLoader.loadSearchIndex()
			]);
			if (dataLoader !== this.currentDataLoader) return;
			guildNameBook.useGuildNames(metadata.guild_names);
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
			this.measurementCoordinator.useMovementSpeeds(metadata.movement_speeds_m_s ?? null);
			await mapService.showWorldTileset(world.worldTilesetUrl, metadata.anchor);
			if (!isStillCurrent()) return;
			this.isWorldShownOnMap = true;
			this.cameraProjectionCoordinator.showOnMap();
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
