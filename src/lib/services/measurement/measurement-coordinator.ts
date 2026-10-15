import type { AppEventBus } from '#lib/events/app-events.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import {
	MeasurementCalculator,
	type LocalPoint,
	type PathSummary,
	type TerrainProfile
} from './measurement-calculator.js';

export type MeasurementMode = 'distance' | 'point';

export interface MeasurementView {
	mode: MeasurementMode;
	pointCount: number;
	summary: PathSummary | null;
	profile: TerrainProfile | null;
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
 * Narzędzie Pomiary. Kliknięcia mapy dodają wierzchołki łamanej (tryb odległości) albo wskazują
 * punkt (tryb współrzędnych). Profil terenu liczy się asynchronicznie; wynik starszego żądania
 * jest pomijany, gdy w międzyczasie dodano punkt.
 */
export class MeasurementCoordinator {
	private readonly calculator = new MeasurementCalculator();
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
		void this.refreshDistance();
	}

	removeLastPoint(): void {
		this.vertices = this.vertices.slice(0, -1);
		void this.refreshDistance();
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

	private publish(): void {
		this.eventBus.publish({
			type: 'measurement-changed',
			measurement: {
				mode: this.mode,
				pointCount: this.vertices.length,
				summary: this.vertices.length >= 2 ? this.calculator.summarizePath(this.vertices) : null,
				profile: this.profile,
				isProfileLoading: this.isProfileLoading,
				pickedPoint: this.pickedPoint
			}
		});
	}
}
