import type { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import { MapService } from './map/map-service.js';

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Jedyny punkt wejścia UI do logiki aplikacji. Komponenty wywołują jego metody,
 * a wyniki odbierają jako zdarzenia z magistrali.
 */
export class GeoportalFacade {
	private mapService: MapService | null = null;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly dataLoader: GeoportalDataLoader,
		private readonly cesiumIonAccessToken?: string
	) {}

	async loadSearchIndex(): Promise<void> {
		this.eventBus.publish({ type: 'search-index-load-started' });
		try {
			const index = await this.dataLoader.loadSearchIndex();
			this.eventBus.publish({
				type: 'search-index-loaded',
				counts: this.dataLoader.countEntriesByType(index)
			});
		} catch (error) {
			console.error(error);
			this.eventBus.publish({ type: 'search-index-load-failed', message: describeError(error) });
		}
	}

	async showWorldIn(container: HTMLElement): Promise<void> {
		this.eventBus.publish({ type: 'world-load-started' });
		let mapService: MapService | null = null;
		try {
			const metadata = await this.dataLoader.loadMetadata();
			mapService = new MapService(container, this.cesiumIonAccessToken);
			this.mapService = mapService;
			await mapService.loadWorldModel({
				url: this.dataLoader.worldModelUrl,
				anchor: metadata.anchor
			});
			if (this.mapService === mapService) this.eventBus.publish({ type: 'world-loaded' });
		} catch (error) {
			if (mapService && this.mapService !== mapService) return;
			console.error(error);
			this.eventBus.publish({ type: 'world-load-failed', message: describeError(error) });
		}
	}

	hideWorld(): void {
		this.mapService?.destroy();
		this.mapService = null;
	}
}
