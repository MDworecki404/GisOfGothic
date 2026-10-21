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

export type MeasurementMode = 'distance' | 'area' | 'point';

export interface MeasurementView {
	mode: MeasurementMode;
	pointCount: number;
	summary: PathSummary | null;
	profile: TerrainProfile | null;
	polygon: PolygonSummary | null;
	travelTimes: TravelTimeEstimate[];
	isProfileLoading: boolean;
	pickedPoint: WorldPosition | null;
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

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => MeasurementDisplay | null
	) {}

	/** Prędkości bohatera ze świata; bez nich (starsza paczka danych) czasu przejścia nie pokazujemy. */
	useMovementSpeeds(movementSpeeds: MovementSpeeds | null): void {
		this.travelTimeCalculator = movementSpeeds ? new TravelTimeCalculator(movementSpeeds) : null;
		this.publish();
	}

	switchMode(mode: MeasurementMode): void {
		this.mode = mode;
		this.clear();
	}

	addPoint(position: WorldPosition): void {
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
		this.vertices = this.vertices.slice(0, -1);
		void this.refreshPath();
	}

	clear(): void {
		this.profileRequest++;
		this.vertices = [];
		this.pickedPoint = null;
		this.profile = null;
		this.isProfileLoading = false;
		this.getDisplay()?.clearMeasurement();
		this.publish();
	}

	private refreshPath(): Promise<void> {
		return this.mode === 'area' ? this.refreshArea() : this.refreshDistance();
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
		this.profile = null;
		this.isProfileLoading = this.vertices.length >= 2;
		display?.showMeasurement(this.vertices, this.vertices);
		this.publish();
		if (!display || this.vertices.length < 2) return;

		const probes = this.calculator.interpolateAlongPath(
			this.vertices,
			this.chooseSampleSpacing(this.vertices)
		);
		const surfacePoints = await display.sampleTerrainUnder(probes);
		if (request !== this.profileRequest) return;
		const terrainPoints = this.calculator.removeNarrowObstacles(
			surfacePoints,
			OBSTACLE_FILTER_WINDOW
		);
		this.profile = this.calculator.summarizeProfile(terrainPoints);
		this.isProfileLoading = false;
		display.showMeasurement(
			this.vertices,
			terrainPoints.length >= 2 ? terrainPoints : this.vertices
		);
		this.publish();
	}

	private chooseSampleSpacing(vertices: readonly LocalPoint[]): number {
		const length = this.calculator.summarizePath(vertices).horizontalMetres;
		return Math.max(PROFILE_SAMPLE_SPACING_METRES, length / MAXIMUM_PROFILE_SAMPLES);
	}

	private estimateTravelTimes(summary: PathSummary | null): TravelTimeEstimate[] {
		return this.mode === 'distance' && summary && this.travelTimeCalculator
			? this.travelTimeCalculator.estimateTravelTimes(summary.horizontalMetres)
			: [];
	}

	private publish(): void {
		const summary = this.vertices.length >= 2 ? this.calculator.summarizePath(this.vertices) : null;
		this.eventBus.publish({
			type: 'measurement-changed',
			measurement: {
				mode: this.mode,
				pointCount: this.vertices.length,
				summary,
				profile: this.profile,
				polygon: this.mode === 'area' ? this.calculator.summarizePolygon(this.vertices) : null,
				travelTimes: this.estimateTravelTimes(summary),
				isProfileLoading: this.isProfileLoading,
				pickedPoint: this.pickedPoint
			}
		});
	}
}
