import type { AppEventBus } from '#lib/events/app-events.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import {
	MeasurementCalculator,
	type LocalPoint,
	type PathSummary,
	type PolygonSummary,
	type TerrainProfile
} from './measurement-calculator.js';
import type { MovementSpeeds } from '#lib/data/types.js';
import { TravelTimeCalculator, type TravelTimeEstimate } from './travel-time-calculator.js';
import type { RouteOutcome, RoutePlanner } from '#lib/services/routing/route-planner.js';

export type MeasurementMode = 'distance' | 'area' | 'point' | 'route';

export type RouteAvailability = 'unavailable' | 'loading' | 'ready';
export type RouteOutcomeKind = 'none' | 'found' | 'too-far-from-network' | 'no-path';

export interface RouteView {
	availability: RouteAvailability;
	hasStart: boolean;
	hasEnd: boolean;
	outcome: RouteOutcomeKind;
	startApproachMetres: number;
	endApproachMetres: number;
}

export type RoutePlannerSource = () => Promise<RoutePlanner | null>;

export interface MeasurementView {
	mode: MeasurementMode;
	pointCount: number;
	summary: PathSummary | null;
	profile: TerrainProfile | null;
	polygon: PolygonSummary | null;
	travelTimes: TravelTimeEstimate[];
	isProfileLoading: boolean;
	pickedPoint: WorldPosition | null;
	route: RouteView | null;
}

export interface MeasurementDisplay {
	showMeasurement(vertices: readonly LocalPoint[], linePath: readonly LocalPoint[]): void;
	clearMeasurement(): void;
	sampleTerrainUnder(points: readonly LocalPoint[]): Promise<LocalPoint[]>;
}

const PROFILE_SAMPLE_SPACING_METRES = 2;
const MAXIMUM_PROFILE_SAMPLES = 400;
const OBSTACLE_FILTER_WINDOW = 7;

/**
 * Narzędzie Pomiary. Kliknięcia mapy dodają wierzchołki łamanej (tryb odległości), wielokąta
 * (tryb pola) albo wskazują punkt (tryb współrzędnych). Profil terenu liczy się asynchronicznie; wynik starszego żądania
 * jest pomijany, gdy w międzyczasie dodano punkt.
 */
export class MeasurementCoordinator {
	private readonly calculator = new MeasurementCalculator();
	private travelTimeCalculator: TravelTimeCalculator | null = null;
	private mode: MeasurementMode = 'distance';
	private vertices: WorldPosition[] = [];
	private pickedPoint: WorldPosition | null = null;
	private profile: TerrainProfile | null = null;
	private isProfileLoading = false;
	private profileRequest = 0;
	private routePlannerSource: RoutePlannerSource | null = null;
	private routePlanner: RoutePlanner | null = null;
	private routeAvailability: RouteAvailability = 'unavailable';
	private routePlannerRequest = 0;
	private routeStart: WorldPosition | null = null;
	private routeEnd: WorldPosition | null = null;
	private routeOutcome: RouteOutcome | null = null;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => MeasurementDisplay | null
	) {}

	/** Prędkości bohatera ze świata; bez nich (starsza paczka danych) czasu przejścia nie pokazujemy. */
	useMovementSpeeds(movementSpeeds: MovementSpeeds | null): void {
		this.travelTimeCalculator = movementSpeeds ? new TravelTimeCalculator(movementSpeeds) : null;
		this.publish();
	}

	/**
	 * Źródło planisty tras bieżącego świata (`null` = świat bez sieci dróg). Wynik ładowania ze
	 * starszego źródła jest pomijany, żeby sieć poprzedniego świata nie trafiła do nowego.
	 */
	useRoutePlannerSource(source: RoutePlannerSource | null): void {
		this.routePlannerRequest++;
		this.routePlannerSource = source;
		this.routePlanner = null;
		this.routeAvailability = 'unavailable';
		this.routeOutcome = null;
		if (this.mode === 'route') void this.loadRoutePlanner();
		else this.publish();
	}

	switchMode(mode: MeasurementMode): void {
		this.routePlannerRequest++;
		this.mode = mode;
		this.clear();
		if (mode === 'route') void this.loadRoutePlanner();
	}

	/** Włącza tryb trasy; jeśli już jest włączony, zostawia wybrany początek. */
	openRouteMode(): void {
		if (this.mode !== 'route') this.switchMode('route');
	}

	setRouteEnd(position: WorldPosition): void {
		this.routeEnd = position;
		void this.refreshRoute();
	}

	swapRouteEndpoints(): void {
		[this.routeStart, this.routeEnd] = [this.routeEnd, this.routeStart];
		void this.refreshRoute();
	}

	addPoint(position: WorldPosition): void {
		if (this.mode === 'route') {
			this.addRoutePoint(position);
			return;
		}
		if (this.mode === 'point') {
			this.pickedPoint = position;
			this.getDisplay()?.showMeasurement([position], []);
			this.publish();
			return;
		}
		this.vertices = [...this.vertices, position];
		void this.refreshPath();
	}

	removeLastPoint(): void {
		if (this.mode === 'route') {
			if (this.routeEnd) this.routeEnd = null;
			else this.routeStart = null;
			void this.refreshRoute();
			return;
		}
		this.vertices = this.vertices.slice(0, -1);
		void this.refreshPath();
	}

	clear(): void {
		this.profileRequest++;
		this.vertices = [];
		this.routeStart = null;
		this.routeEnd = null;
		this.routeOutcome = null;
		this.pickedPoint = null;
		this.profile = null;
		this.isProfileLoading = false;
		this.getDisplay()?.clearMeasurement();
		this.publish();
	}

	private refreshPath(): Promise<void> {
		return this.mode === 'area' ? this.refreshArea() : this.refreshDistance();
	}

	private addRoutePoint(position: WorldPosition): void {
		if (this.routeAvailability === 'unavailable') return;
		if (this.routeStart === null || this.routeEnd !== null) {
			this.routeStart = position;
			this.routeEnd = null;
		} else {
			this.routeEnd = position;
		}
		void this.refreshRoute();
	}

	private async loadRoutePlanner(): Promise<void> {
		if (this.routePlanner) {
			this.routeAvailability = 'ready';
			await this.refreshRoute();
			return;
		}
		if (!this.routePlannerSource) {
			this.routeAvailability = 'unavailable';
			this.publish();
			return;
		}
		const request = this.routePlannerRequest;
		this.routeAvailability = 'loading';
		this.publish();
		let planner: RoutePlanner | null = null;
		try {
			planner = await this.routePlannerSource();
		} catch (error) {
			console.error(error);
		}
		if (request !== this.routePlannerRequest) return;
		this.routePlanner = planner;
		this.routeAvailability = planner ? 'ready' : 'unavailable';
		await this.refreshRoute();
	}

	private refreshRoute(): Promise<void> {
		this.routeOutcome =
			this.routePlanner && this.routeStart && this.routeEnd
				? this.routePlanner.planRoute(this.routeStart, this.routeEnd)
				: null;
		return this.refreshDistance();
	}

	private readPathPoints(): readonly LocalPoint[] {
		if (this.mode !== 'route') return this.vertices;
		return this.routeOutcome?.status === 'found' ? this.routeOutcome.path : [];
	}

	private readMarkerPoints(): readonly LocalPoint[] {
		if (this.mode !== 'route') return this.vertices;
		return [this.routeStart, this.routeEnd].filter((point) => point !== null);
	}

	private buildRouteView(): RouteView | null {
		if (this.mode !== 'route') return null;
		const outcome = this.routeOutcome;
		return {
			availability: this.routeAvailability,
			hasStart: this.routeStart !== null,
			hasEnd: this.routeEnd !== null,
			outcome: outcome ? outcome.status : 'none',
			startApproachMetres: outcome?.status === 'found' ? outcome.startApproachMetres : 0,
			endApproachMetres: outcome?.status === 'found' ? outcome.endApproachMetres : 0
		};
	}

	/**
	 * Od trzech wierzchołków wielokąt się domyka; obrys idzie po terenie tak samo jak łamana
	 * odległości, a pole liczone jest w rzucie na płaszczyznę poziomą.
	 */
	private async refreshArea(): Promise<void> {
		const request = ++this.profileRequest;
		const display = this.getDisplay();
		const outline =
			this.vertices.length >= 3 ? [...this.vertices, this.vertices[0]] : this.vertices;
		this.profile = null;
		this.isProfileLoading = false;
		display?.showMeasurement(this.vertices, outline);
		this.publish();
		if (!display || outline.length < 2) return;

		const surfacePoints = await display.sampleTerrainUnder(
			this.calculator.interpolateAlongPath(outline, this.chooseSampleSpacing(outline))
		);
		if (request !== this.profileRequest) return;
		const terrainPoints = this.calculator.removeNarrowObstacles(
			surfacePoints,
			OBSTACLE_FILTER_WINDOW
		);
		display.showMeasurement(this.vertices, terrainPoints.length >= 2 ? terrainPoints : outline);
	}

	private async refreshDistance(): Promise<void> {
		const request = ++this.profileRequest;
		const display = this.getDisplay();
		const path = this.readPathPoints();
		const markers = this.readMarkerPoints();
		this.profile = null;
		this.isProfileLoading = path.length >= 2;
		display?.showMeasurement(markers, path);
		this.publish();
		if (!display || path.length < 2) return;

		const probes = this.calculator.interpolateAlongPath(path, this.chooseSampleSpacing(path));
		const surfacePoints = await display.sampleTerrainUnder(probes);
		if (request !== this.profileRequest) return;
		const terrainPoints = this.calculator.removeNarrowObstacles(
			surfacePoints,
			OBSTACLE_FILTER_WINDOW
		);
		this.profile = this.calculator.summarizeProfile(terrainPoints);
		this.isProfileLoading = false;
		display.showMeasurement(markers, terrainPoints.length >= 2 ? terrainPoints : path);
		this.publish();
	}

	private chooseSampleSpacing(vertices: readonly LocalPoint[]): number {
		const length = this.calculator.summarizePath(vertices).horizontalMetres;
		return Math.max(PROFILE_SAMPLE_SPACING_METRES, length / MAXIMUM_PROFILE_SAMPLES);
	}

	private estimateTravelTimes(summary: PathSummary | null): TravelTimeEstimate[] {
		return (this.mode === 'distance' || this.mode === 'route') &&
			summary &&
			this.travelTimeCalculator
			? this.travelTimeCalculator.estimateTravelTimes(summary.horizontalMetres)
			: [];
	}

	private publish(): void {
		const pathPoints = this.readPathPoints();
		const summary = pathPoints.length >= 2 ? this.calculator.summarizePath(pathPoints) : null;
		this.eventBus.publish({
			type: 'measurement-changed',
			measurement: {
				mode: this.mode,
				pointCount: this.readMarkerPoints().length,
				summary,
				profile: this.profile,
				polygon: this.mode === 'area' ? this.calculator.summarizePolygon(this.vertices) : null,
				travelTimes: this.estimateTravelTimes(summary),
				isProfileLoading: this.isProfileLoading,
				pickedPoint: this.pickedPoint,
				route: this.buildRouteView()
			}
		});
	}
}
