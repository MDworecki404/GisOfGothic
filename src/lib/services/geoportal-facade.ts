import type { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { WorldDefinition } from '#lib/data/world-catalog.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import { MapService } from './map/map-service.js';

export type DataLoaderFactory = (dataBaseUrl: string) => GeoportalDataLoader;

const MISSING_ION_TOKEN_MESSAGE = 'brak tokenu Cesium ion (PUBLIC_CESIUM_ION_TOKEN w pliku .env)';

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

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly createDataLoader: DataLoaderFactory,
		private readonly cesiumIonAccessToken?: string
	) {}

	openWorld(world: WorldDefinition): void {
		if (this.currentWorld?.id === world.id && this.currentWorld.gameId === world.gameId) return;
		this.currentWorld = world;
		this.currentDataLoader = this.createDataLoader(world.dataBaseUrl);
		this.eventBus.publish({ type: 'world-opened', worldName: world.name });
		void this.loadSearchIndexOfCurrentWorld();
		void this.showCurrentWorldOnMap();
	}

	attachMapTo(container: HTMLElement): void {
		if (!this.cesiumIonAccessToken) {
			this.eventBus.publish({ type: 'world-load-failed', message: MISSING_ION_TOKEN_MESSAGE });
			return;
		}
		this.mapService = new MapService(container, this.cesiumIonAccessToken);
		void this.showCurrentWorldOnMap();
	}

	detachMap(): void {
		this.worldLoadGeneration++;
		this.mapService?.destroy();
		this.mapService = null;
	}

	private async loadSearchIndexOfCurrentWorld(): Promise<void> {
		const dataLoader = this.currentDataLoader;
		if (!dataLoader) return;
		this.eventBus.publish({ type: 'search-index-load-started' });
		try {
			const index = await dataLoader.loadSearchIndex();
			if (dataLoader !== this.currentDataLoader) return;
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
			await mapService.showWorldTileset(world.worldTilesetIonAssetId, metadata.anchor);
			if (isStillCurrent()) this.eventBus.publish({ type: 'world-loaded' });
		} catch (error) {
			if (!isStillCurrent()) return;
			console.error(error);
			this.eventBus.publish({ type: 'world-load-failed', message: describeError(error) });
		}
	}
}
