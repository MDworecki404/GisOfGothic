import type { Anchor, Place, SearchEntry } from '#lib/data/types.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import {
	DATA_LAYERS,
	type DataLayerId,
	type IdentifiableFeature
} from '#lib/services/layers/data-layer-catalog.js';
import {
	MeasurementCalculator,
	type LocalPoint
} from '#lib/services/measurement/measurement-calculator.js';
import {
	PLACE_KIND_PRESENTATION,
	SearchEntryPresenter,
	type SearchResult
} from '#lib/services/search/search-entry-presenter.js';
import type { SearchService } from '#lib/services/search/search-service.js';
import { BufferAnalyzer, type BufferCandidate, type BufferGroup } from './buffer-analyzer.js';
import {
	DensityGridBuilder,
	type DensityCell,
	type DensityGrid,
	type GridShape
} from './density-grid-builder.js';
import { LocalProjector } from './local-projector.js';
import { NearestPlacesFinder, type NearestMatch } from './nearest-places-finder.js';

export type AnalysisMode = 'nearest' | 'buffer' | 'density';

export interface AnalysisDisplay {
	showNearestPlaces(origin: LocalPoint, targets: readonly LocalPoint[]): void;
	showBuffer(origin: LocalPoint, ring: readonly LocalPoint[]): void;
	showDensityCells(cells: readonly DensityCell[]): void;
	sampleTerrainUnder(points: readonly LocalPoint[]): Promise<LocalPoint[]>;
	flyToLocalPoint(point: LocalPoint, rangeMetres: number): void;
	clearAnalysis(): void;
}

export interface AnalysisSubject {
	id: string;
	name: string;
	placeCount: number;
}

export interface NearestPlaceView {
	index: number;
	description: string;
	kindLabel: string | null;
	color: string;
	straightMetres: number;
	horizontalMetres: number;
}

export interface BufferGroupView {
	id: string;
	name: string;
	color: string;
	total: number;
	lines: { label: string; quantity: number }[];
	hiddenLineCount: number;
}

export interface DensityLegendStepView {
	label: string;
	color: string;
}

export interface DensityView {
	cellCount: number;
	totalCount: number;
	maximumCount: number;
	legend: DensityLegendStepView[];
}

export interface AnalysisView {
	mode: AnalysisMode;
	subjectQuery: string;
	subjectSuggestions: SearchResult[];
	subject: AnalysisSubject | null;
	origin: WorldPosition | null;
	nearestPlaces: NearestPlaceView[];
	radiusMetres: number;
	bufferGroups: BufferGroupView[];
	cellShape: GridShape;
	cellSizeMetres: number;
	density: DensityView | null;
	isLoading: boolean;
}

export type BufferFeatureLoader = (layerId: DataLayerId) => Promise<IdentifiableFeature[] | null>;

interface LocatedPlace extends LocalPoint {
	place: Place;
}

const DEFAULT_CELL_SIZE_METRES = 25;
const NEAREST_PLACE_COUNT = 5;
const SUGGESTION_COUNT = 6;
const PLACE_CLOSE_UP_RANGE_METRES = 45;
const DEFAULT_RADIUS_METRES = 100;
const BUFFER_LAYER_IDS: readonly DataLayerId[] = ['items', 'containers', 'npcs'];
const MAXIMUM_LINES_PER_GROUP = 25;
const RING_LIFT_METRES = 0.4;
const RING_OBSTACLE_FILTER_WINDOW = 5;

function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase('pl-PL') + text.slice(1);
}

/**
 * Narzędzie Analizy. Trzyma temat analizy (przedmiot albo postać), punkt wskazany na mapie i
 * parametry trybu; wynik liczy czystymi klasami z `services/analysis/`, a rysowanie zleca
 * wyświetlaczowi mapy. Wynik starszego żądania (np. po zmianie promienia w trakcie wczytywania
 * warstw) jest pomijany.
 */
export class AnalysisCoordinator {
	private readonly presenter = new SearchEntryPresenter();
	private readonly nearestPlacesFinder = new NearestPlacesFinder();
	private readonly bufferAnalyzer = new BufferAnalyzer();
	private readonly densityGridBuilder = new DensityGridBuilder();
	private readonly measurementCalculator = new MeasurementCalculator();
	private projector: LocalProjector | null = null;
	private mode: AnalysisMode = 'nearest';
	private subjectQuery = '';
	private subject: SearchEntry | null = null;
	private origin: WorldPosition | null = null;
	private radiusMetres = DEFAULT_RADIUS_METRES;
	private nearestMatches: NearestMatch<LocatedPlace>[] = [];
	private bufferGroups: BufferGroup[] = [];
	private bufferCandidates: BufferCandidate[] | null = null;
	private cellShape: GridShape = 'hex';
	private cellSizeMetres = DEFAULT_CELL_SIZE_METRES;
	private densityGrid: DensityGrid | null = null;
	private isLoading = false;
	private isToolActive = false;
	private refreshRequest = 0;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getSearchService: () => SearchService | null,
		private readonly getDisplay: () => AnalysisDisplay | null,
		private readonly loadLayerFeatures: BufferFeatureLoader
	) {}

	resetForNewWorld(): void {
		this.refreshRequest++;
		this.projector = null;
		this.subjectQuery = '';
		this.subject = null;
		this.origin = null;
		this.nearestMatches = [];
		this.bufferGroups = [];
		this.bufferCandidates = null;
		this.densityGrid = null;
		this.isLoading = false;
		this.getDisplay()?.clearAnalysis();
		this.publish();
	}

	useAnchor(anchor: Anchor): void {
		this.projector = new LocalProjector(anchor);
		this.bufferCandidates = null;
		void this.refresh();
	}

	activate(): void {
		this.isToolActive = true;
		void this.refresh();
	}

	deactivate(): void {
		this.isToolActive = false;
		this.refreshRequest++;
		this.getDisplay()?.clearAnalysis();
	}

	switchMode(mode: AnalysisMode): void {
		this.mode = mode;
		void this.refresh();
	}

	setRadius(radiusMetres: number): void {
		this.radiusMetres = radiusMetres;
		void this.refresh();
	}

	get usesMapClicks(): boolean {
		return this.mode !== 'density';
	}

	setCellShape(cellShape: GridShape): void {
		this.cellShape = cellShape;
		void this.refresh();
	}

	setCellSize(cellSizeMetres: number): void {
		this.cellSizeMetres = cellSizeMetres;
		void this.refresh();
	}

	setSubjectQuery(query: string): void {
		this.subjectQuery = query;
		this.publish();
	}

	selectSubject(entryId: string): void {
		const entry = this.getSearchService()?.findEntry(entryId);
		if (!entry) return;
		this.subject = entry;
		this.subjectQuery = '';
		void this.refresh();
	}

	clearSubject(): void {
		this.subject = null;
		void this.refresh();
	}

	setOrigin(position: WorldPosition): void {
		this.origin = position;
		void this.refresh();
	}

	flyToNearestPlace(index: number): void {
		const match = this.nearestMatches.at(index);
		if (match) this.getDisplay()?.flyToLocalPoint(match.candidate, PLACE_CLOSE_UP_RANGE_METRES);
	}

	private async refresh(): Promise<void> {
		const request = ++this.refreshRequest;
		this.getDisplay()?.clearAnalysis();
		if (this.mode === 'nearest') this.refreshNearest();
		else if (this.mode === 'density') this.refreshDensity();
		else await this.refreshBuffer(request);
	}

	private refreshNearest(): void {
		this.isLoading = false;
		this.nearestMatches = this.findNearestMatches();
		const display = this.getDisplay();
		if (display && this.isToolActive && this.origin) {
			display.showNearestPlaces(
				this.origin,
				this.nearestMatches.map((match) => match.candidate)
			);
		}
		this.publish();
	}

	private refreshDensity(): void {
		this.isLoading = false;
		this.densityGrid = this.buildDensityGrid();
		if (this.isToolActive && this.densityGrid) {
			this.getDisplay()?.showDensityCells(this.densityGrid.cells);
		}
		this.publish();
	}

	private async refreshBuffer(request: number): Promise<void> {
		const origin = this.origin;
		if (!origin || !this.projector) {
			this.bufferGroups = [];
			this.isLoading = false;
			this.publish();
			return;
		}
		this.isLoading = this.bufferCandidates === null;
		this.publish();
		const candidates = await this.loadBufferCandidates();
		if (request !== this.refreshRequest) return;
		this.isLoading = false;
		this.bufferGroups = this.bufferAnalyzer.groupWithinRadius(
			origin,
			this.radiusMetres,
			candidates,
			BUFFER_LAYER_IDS
		);
		this.publish();
		await this.showBufferRing(origin, request);
	}

	private async showBufferRing(origin: LocalPoint, request: number): Promise<void> {
		const display = this.getDisplay();
		if (!display || !this.isToolActive) return;
		const flatRing = this.bufferAnalyzer.buildRing(origin, this.radiusMetres);
		display.showBuffer(origin, flatRing);
		const groundedRing = await display.sampleTerrainUnder(flatRing);
		if (request !== this.refreshRequest || groundedRing.length !== flatRing.length) return;
		display.clearAnalysis();
		display.showBuffer(
			origin,
			this.measurementCalculator
				.removeNarrowObstacles(groundedRing, RING_OBSTACLE_FILTER_WINDOW)
				.map((point) => ({ ...point, height: point.height + RING_LIFT_METRES }))
		);
	}

	private async loadBufferCandidates(): Promise<BufferCandidate[]> {
		const projector = this.projector;
		if (this.bufferCandidates) return this.bufferCandidates;
		if (!projector) return [];
		const layers = await Promise.all(
			BUFFER_LAYER_IDS.map(async (layerId) => ({
				layerId,
				features: (await this.loadLayerFeatures(layerId)) ?? []
			}))
		);
		if (projector !== this.projector) return [];
		this.bufferCandidates = layers.flatMap(({ layerId, features }) =>
			features.map((feature) => ({
				...projector.projectToLocalPoint(feature.lon, feature.lat, feature.h),
				groupId: layerId,
				label: feature.identification.title,
				quantity: feature.quantity
			}))
		);
		return this.bufferCandidates;
	}

	private buildDensityGrid(): DensityGrid | null {
		const projector = this.projector;
		if (!projector || !this.subject) return null;
		const points = this.subject.places.map((place) => ({
			...projector.projectToLocalPoint(place.lon, place.lat, place.h),
			weight: place.amount ?? 1
		}));
		return this.densityGridBuilder.build(points, this.cellShape, this.cellSizeMetres);
	}

	private findNearestMatches(): NearestMatch<LocatedPlace>[] {
		const projector = this.projector;
		if (!projector || !this.subject || !this.origin) return [];
		const located = this.subject.places.map((place) => ({
			...projector.projectToLocalPoint(place.lon, place.lat, place.h),
			place
		}));
		return this.nearestPlacesFinder.findNearest(this.origin, located, NEAREST_PLACE_COUNT);
	}

	private publish(): void {
		this.eventBus.publish({
			type: 'analysis-changed',
			analysis: {
				mode: this.mode,
				subjectQuery: this.subjectQuery,
				subjectSuggestions: this.suggestSubjects(),
				subject: this.subject
					? {
							id: this.subject.id,
							name: this.subject.name,
							placeCount: this.subject.places.length
						}
					: null,
				origin: this.origin,
				nearestPlaces: this.nearestMatches.map((match, index) => {
					const presentation = PLACE_KIND_PRESENTATION[match.candidate.place.kind];
					const description = capitalize(match.candidate.place.label);
					return {
						index,
						description,
						kindLabel: description === presentation.label ? null : presentation.label,
						color: presentation.color,
						straightMetres: match.straightMetres,
						horizontalMetres: match.horizontalMetres
					};
				}),
				radiusMetres: this.radiusMetres,
				bufferGroups: this.presentBufferGroups(),
				cellShape: this.cellShape,
				cellSizeMetres: this.cellSizeMetres,
				density: this.presentDensity(),
				isLoading: this.isLoading
			}
		});
	}

	private presentDensity(): DensityView | null {
		const grid = this.densityGrid;
		if (!grid) return null;
		return {
			cellCount: grid.cells.length,
			totalCount: grid.totalCount,
			maximumCount: grid.maximumCount,
			legend: grid.legend.map((step) => ({
				label: step.from === step.to ? `${step.from}` : `${step.from}–${step.to}`,
				color: step.color
			}))
		};
	}

	private presentBufferGroups(): BufferGroupView[] {
		return this.bufferGroups.flatMap((group) => {
			const layer = DATA_LAYERS.find((definition) => definition.id === group.groupId);
			if (!layer) return [];
			return [
				{
					id: group.groupId,
					name: layer.name,
					color: layer.color,
					total: group.total,
					lines: group.lines.slice(0, MAXIMUM_LINES_PER_GROUP),
					hiddenLineCount: Math.max(0, group.lines.length - MAXIMUM_LINES_PER_GROUP)
				}
			];
		});
	}

	private suggestSubjects(): SearchResult[] {
		return (this.getSearchService()?.search(this.subjectQuery, 'all') ?? [])
			.slice(0, SUGGESTION_COUNT)
			.map((entry) => this.presenter.presentResult(entry));
	}
}
