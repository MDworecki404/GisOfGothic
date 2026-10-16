import type { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import { MAP_ICON_NODES } from './map-icon-shapes.js';
import type { MapIconNode } from './map-icons.js';
import type { DataLayerPoint, FeaturePick } from '#lib/services/map/data-layers-renderer.js';
import {
	DATA_LAYERS,
	type DataLayerDefinition,
	type DataLayerId,
	type IdentifiableFeature
} from './data-layer-catalog.js';

export interface DataLayersDisplay {
	showDataLayer(layerId: string, points: readonly DataLayerPoint[], cssColor: string): void;
	hideDataLayer(layerId: string): void;
}

export type DataLayerStatus = 'hidden' | 'loading' | 'visible' | 'error';

export interface LayerLegendEntryView {
	label: string;
	nodes: readonly MapIconNode[];
}

export interface DataLayerView {
	id: DataLayerId;
	name: string;
	description: string;
	color: string;
	legend: LayerLegendEntryView[];
	featureCount: number | null;
	status: DataLayerStatus;
}

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Warstwy danych jednego świata. Plik warstwy jest pobierany dopiero przy pierwszym włączeniu
 * i zapamiętywany, więc kolejne przełączenia nie pobierają go ponownie.
 */
export class DataLayersCoordinator {
	private readonly loadedFeatures = new Map<DataLayerId, IdentifiableFeature[]>();
	private readonly statuses = new Map<DataLayerId, DataLayerStatus>();
	private readonly pendingLoads = new Map<DataLayerId, Promise<IdentifiableFeature[] | null>>();
	private featureCounts: Record<string, number> = {};
	private dataLoader: GeoportalDataLoader | null = null;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => DataLayersDisplay | null
	) {}

	useWorld(dataLoader: GeoportalDataLoader | null, featureCounts: Record<string, number>): void {
		for (const layer of DATA_LAYERS) this.getDisplay()?.hideDataLayer(layer.id);
		this.dataLoader = dataLoader;
		this.featureCounts = featureCounts;
		this.loadedFeatures.clear();
		this.pendingLoads.clear();
		this.statuses.clear();
		this.publishLayers();
	}

	updateFeatureCounts(featureCounts: Record<string, number>): void {
		this.featureCounts = featureCounts;
		this.publishLayers();
	}

	async toggleLayer(layerId: DataLayerId): Promise<void> {
		const layer = DATA_LAYERS.find((definition) => definition.id === layerId);
		if (!layer) return;
		const status = this.statuses.get(layerId) ?? 'hidden';
		if (status === 'loading') return;
		if (status === 'visible') {
			this.getDisplay()?.hideDataLayer(layerId);
			this.setStatus(layerId, 'hidden');
			return;
		}
		await this.showLayer(layer);
	}

	showVisibleLayersOnMap(): void {
		for (const layer of DATA_LAYERS) {
			const features = this.loadedFeatures.get(layer.id);
			if (features && this.statuses.get(layer.id) === 'visible') {
				this.getDisplay()?.showDataLayer(layer.id, features, layer.color);
			}
		}
	}

	/**
	 * Zwraca obiekty warstwy, pobierając plik, jeśli jeszcze go nie ma — bez pokazywania warstwy
	 * na mapie. Zwraca `null`, gdy pobranie się nie powiodło albo świat zmienił się w trakcie.
	 */
	loadLayerFeatures(layerId: DataLayerId): Promise<IdentifiableFeature[] | null> {
		const loaded = this.loadedFeatures.get(layerId);
		if (loaded) return Promise.resolve(loaded);
		const pending = this.pendingLoads.get(layerId);
		if (pending) return pending;
		const layer = DATA_LAYERS.find((definition) => definition.id === layerId);
		if (!layer) return Promise.resolve(null);
		const load = this.fetchFeatures(layer).finally(() => this.pendingLoads.delete(layerId));
		this.pendingLoads.set(layerId, load);
		return load;
	}

	identifyFeature(pick: FeaturePick): void {
		const layer = DATA_LAYERS.find((definition) => definition.id === pick.layerId);
		const feature = layer ? this.loadedFeatures.get(layer.id)?.at(pick.featureIndex) : undefined;
		this.eventBus.publish({
			type: 'feature-identified',
			identification: feature ? feature.identification : null
		});
	}

	private async showLayer(layer: DataLayerDefinition): Promise<void> {
		const alreadyLoaded = this.loadedFeatures.get(layer.id);
		if (!alreadyLoaded) this.setStatus(layer.id, 'loading');
		const features = alreadyLoaded ?? (await this.loadLayerFeatures(layer.id));
		if (!features) {
			if (!alreadyLoaded && this.dataLoader && this.statuses.get(layer.id) === 'loading') {
				this.setStatus(layer.id, 'error');
			}
			return;
		}
		this.getDisplay()?.showDataLayer(layer.id, features, layer.color);
		this.setStatus(layer.id, 'visible');
	}

	private async fetchFeatures(layer: DataLayerDefinition): Promise<IdentifiableFeature[] | null> {
		const dataLoader = this.dataLoader;
		if (!dataLoader) return null;
		try {
			const features = layer.readFeatures(await dataLoader.loadLayerFile(layer.fileName));
			if (dataLoader !== this.dataLoader) return null;
			this.loadedFeatures.set(layer.id, features);
			this.publishLayers();
			return features;
		} catch (error) {
			if (dataLoader !== this.dataLoader) return null;
			console.error(error);
			this.eventBus.publish({
				type: 'data-layer-load-failed',
				layerName: layer.name,
				message: describeError(error)
			});
			return null;
		}
	}

	private setStatus(layerId: DataLayerId, status: DataLayerStatus): void {
		this.statuses.set(layerId, status);
		this.publishLayers();
	}

	private publishLayers(): void {
		this.eventBus.publish({
			type: 'data-layers-changed',
			layers: DATA_LAYERS.map((layer) => ({
				id: layer.id,
				name: layer.name,
				description: layer.description,
				color: layer.color,
				legend: layer.legend.map(({ label, iconId }) => ({ label, nodes: MAP_ICON_NODES[iconId] })),
				featureCount:
					this.loadedFeatures.get(layer.id)?.length ??
					this.featureCounts[layer.metadataCountKey] ??
					null,
				status: this.statuses.get(layer.id) ?? 'hidden'
			}))
		});
	}
}
