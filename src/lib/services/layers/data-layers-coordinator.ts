import type { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import { ChapterFilter } from '#lib/services/chapters/chapter-filter.js';
import { LootPresenter } from '#lib/services/loot/loot-presenter.js';
import type { TreasureSetBook } from '#lib/services/loot/treasure-set-book.js';
import { MAP_ICON_NODES } from './map-icon-shapes.js';
import type { MapIconNode } from './map-icons.js';
import type { DataLayerPoint, FeaturePick } from '#lib/services/map/data-layers-renderer.js';
import {
	DATA_LAYERS,
	type DataLayerDefinition,
	type DataLayerId,
	type FeatureIdentification,
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
	/** Kolor ikony w legendzie, gdy różni się od koloru warstwy. */
	color: string | null;
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
	private readonly shownFeatures = new Map<DataLayerId, IdentifiableFeature[]>();
	private featureCounts: Record<string, number> = {};
	private chapterFilter = new ChapterFilter(null);
	private dataLoader: GeoportalDataLoader | null = null;
	private latestIdentification = 0;
	private readonly lootPresenter = new LootPresenter();

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => DataLayersDisplay | null,
		private readonly treasureSetBook: TreasureSetBook
	) {}

	useWorld(dataLoader: GeoportalDataLoader | null, featureCounts: Record<string, number>): void {
		for (const layer of DATA_LAYERS) this.getDisplay()?.hideDataLayer(layer.id);
		this.dataLoader = dataLoader;
		this.featureCounts = featureCounts;
		this.loadedFeatures.clear();
		this.shownFeatures.clear();
		this.pendingLoads.clear();
		this.statuses.clear();
		this.cancelPendingIdentification();
		this.publishLayers();
	}

	updateFeatureCounts(featureCounts: Record<string, number>): void {
		this.featureCounts = featureCounts;
		this.publishLayers();
	}

	/** Pokazuje na warstwach postaci tylko te, które pojawiają się w wybranym rozdziale. */
	useChapterFilter(chapterFilter: ChapterFilter): void {
		this.chapterFilter = chapterFilter;
		this.showVisibleLayersOnMap();
		this.publishLayers();
	}

	async toggleLayer(layerId: DataLayerId): Promise<void> {
		const layer = DATA_LAYERS.find((definition) => definition.id === layerId);
		if (!layer) return;
		const status = this.statuses.get(layerId) ?? 'hidden';
		if (status === 'loading') return;
		if (status === 'visible') {
			this.getDisplay()?.hideDataLayer(layerId);
			this.shownFeatures.delete(layerId);
			this.setStatus(layerId, 'hidden');
			return;
		}
		await this.showLayer(layer);
	}

	showVisibleLayersOnMap(): void {
		for (const layer of DATA_LAYERS) {
			const features = this.loadedFeatures.get(layer.id);
			if (features && this.statuses.get(layer.id) === 'visible') {
				this.showFeaturesOnMap(layer, features);
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
		const feature = layer ? this.shownFeatures.get(layer.id)?.at(pick.featureIndex) : undefined;
		const identification = feature ? feature.identification : null;
		const request = ++this.latestIdentification;
		this.eventBus.publish({ type: 'feature-identified', identification });
		if (identification && identification.treasureSetCodes.length > 0) {
			void this.addPossibleItems(identification, request);
		}
	}

	/** Unieważnia dopisywanie zawartości do karty, która została już zamknięta albo zastąpiona inną. */
	cancelPendingIdentification(): void {
		this.latestIdentification++;
	}

	private async addPossibleItems(
		identification: FeatureIdentification,
		request: number
	): Promise<void> {
		const catalog = await this.treasureSetBook.loadCatalog();
		if (!catalog || request !== this.latestIdentification) return;
		const possibleItems = this.lootPresenter.describePossibleContents(
			identification.treasureSetCodes,
			catalog
		);
		this.eventBus.publish({
			type: 'feature-identified',
			identification: { ...identification, possibleItems }
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
		this.showFeaturesOnMap(layer, features);
		this.setStatus(layer.id, 'visible');
	}

	private showFeaturesOnMap(layer: DataLayerDefinition, features: IdentifiableFeature[]): void {
		const featuresToShow = this.filterByChapter(layer, features);
		this.shownFeatures.set(layer.id, featuresToShow);
		this.getDisplay()?.showDataLayer(layer.id, featuresToShow, layer.color);
	}

	private filterByChapter(
		layer: DataLayerDefinition,
		features: IdentifiableFeature[]
	): IdentifiableFeature[] {
		if (!layer.isFilteredByChapter) return features;
		return features.filter((feature) => this.chapterFilter.isSpawnVisible(feature.spawnChapter));
	}

	private async fetchFeatures(layer: DataLayerDefinition): Promise<IdentifiableFeature[] | null> {
		const dataLoader = this.dataLoader;
		if (!dataLoader) return null;
		try {
			const [json, companionJson] = await Promise.all([
				dataLoader.loadLayerFile(layer.fileName),
				this.loadCompanionFile(dataLoader, layer)
			]);
			const features = layer.readFeatures(json, companionJson);
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

	/** Drugi plik warstwy tylko uzupełnia dane, więc jego brak nie blokuje warstwy (zostają dane z pliku głównego). */
	private async loadCompanionFile(
		dataLoader: GeoportalDataLoader,
		layer: DataLayerDefinition
	): Promise<unknown> {
		if (layer.companionFileName === null) return undefined;
		try {
			return await dataLoader.loadLayerFile(layer.companionFileName);
		} catch (error) {
			console.error(error);
			return undefined;
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
				legend: layer.legend.map(({ label, iconId, color }) => ({
					label,
					nodes: MAP_ICON_NODES[iconId],
					color: color ?? null
				})),
				featureCount: this.countFeatures(layer),
				status: this.statuses.get(layer.id) ?? 'hidden'
			}))
		});
	}

	private countFeatures(layer: DataLayerDefinition): number | null {
		const loaded = this.loadedFeatures.get(layer.id);
		if (loaded) return this.filterByChapter(layer, loaded).length;
		if (layer.metadataCountKey === null) return null;
		return this.featureCounts[layer.metadataCountKey] ?? null;
	}
}
