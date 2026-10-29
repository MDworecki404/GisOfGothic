import type { AppEventBus } from '#lib/events/app-events.js';
import type { CameraProjectionCoordinator } from './camera-projection-coordinator.js';
import type { CameraProjectionSetting } from './camera-projection.js';
import { clampSliceHeight, type SliceHeightRange, type ViewMode } from './view-mode.js';

export interface ViewModeDisplay {
	showViewMode(mode: ViewMode, flightSeconds: number): void;
	showSliceHeight(metres: number | null): void;
}

export interface RestorableViewMode {
	mode: ViewMode;
	sliceHeightMetres: number | null;
}

type ProjectionSwitch = Pick<
	CameraProjectionCoordinator,
	'currentSetting' | 'selectKind' | 'restore'
>;

/**
 * Trzyma tryb widoku (3D albo płaska mapa 2D) i wysokość cięcia modelu. Tryb 2D wymusza rzut ortogonalny,
 * a rzut sprzed wejścia wraca po wyjściu z 2D. Cięcie należy do trybu 2D i znika razem z nim.
 */
export class ViewModeCoordinator {
	private mode: ViewMode = 'view-3d';
	private sliceHeightMetres: number | null = null;
	private sliceRange: SliceHeightRange | null = null;
	private projectionBefore2d: CameraProjectionSetting | null = null;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => ViewModeDisplay | null,
		private readonly projection: ProjectionSwitch
	) {}

	get currentMode(): ViewMode {
		return this.mode;
	}

	get currentSliceHeightMetres(): number | null {
		return this.sliceHeightMetres;
	}

	selectMode(mode: ViewMode): void {
		if (mode === this.mode) return;
		if (mode === 'view-2d') this.enterFlatMap(this.projection.currentSetting, 1);
		else this.leaveFlatMap(this.projectionBefore2d, 1);
	}

	setSliceHeight(metres: number | null): void {
		if (this.mode !== 'view-2d') return;
		this.sliceHeightMetres = metres === null ? null : clampSliceHeight(metres, this.sliceRange);
		this.getDisplay()?.showSliceHeight(this.sliceHeightMetres);
		this.publishMode();
	}

	useSliceRange(range: SliceHeightRange | null): void {
		this.sliceRange = range;
		this.eventBus.publish({ type: 'slice-height-range-changed', range });
		if (this.mode !== 'view-2d' || this.sliceHeightMetres === null) return;
		const clamped = clampSliceHeight(this.sliceHeightMetres, range);
		if (clamped === this.sliceHeightMetres) return;
		this.sliceHeightMetres = clamped;
		this.getDisplay()?.showSliceHeight(clamped);
		this.publishMode();
	}

	/** Odtwarza tryb z linku albo zakładki bez lotu; rzut z `projectionIn3d` dotyczy tylko trybu 3D. */
	restore(state: RestorableViewMode, projectionIn3d: CameraProjectionSetting | null): void {
		if (state.mode === 'view-2d') {
			this.sliceHeightMetres =
				state.sliceHeightMetres === null
					? null
					: clampSliceHeight(state.sliceHeightMetres, this.sliceRange);
			this.enterFlatMap(null, 0);
			return;
		}
		if (this.mode === 'view-2d') {
			this.leaveFlatMap(projectionIn3d, 0);
			return;
		}
		this.projection.restore(projectionIn3d);
		this.publishMode();
	}

	showOnMap(): void {
		if (this.mode !== 'view-2d') return;
		const display = this.getDisplay();
		display?.showViewMode('view-2d', 0);
		display?.showSliceHeight(this.sliceHeightMetres);
	}

	private enterFlatMap(
		projectionToRememberFor3d: CameraProjectionSetting | null,
		flightSeconds: number
	): void {
		const wasFlatMap = this.mode === 'view-2d';
		if (!wasFlatMap) this.projectionBefore2d = projectionToRememberFor3d;
		this.mode = 'view-2d';
		this.projection.selectKind('orthographic');
		const display = this.getDisplay();
		display?.showViewMode('view-2d', flightSeconds);
		if (this.sliceHeightMetres !== null) display?.showSliceHeight(this.sliceHeightMetres);
		this.publishMode();
	}

	private leaveFlatMap(
		projectionToRestore: CameraProjectionSetting | null,
		flightSeconds: number
	): void {
		this.mode = 'view-3d';
		this.sliceHeightMetres = null;
		this.projectionBefore2d = null;
		const display = this.getDisplay();
		display?.showSliceHeight(null);
		this.projection.restore(projectionToRestore);
		display?.showViewMode('view-3d', flightSeconds);
		this.publishMode();
	}

	private publishMode(): void {
		this.eventBus.publish({
			type: 'view-mode-changed',
			mode: this.mode,
			sliceHeightMetres: this.sliceHeightMetres
		});
	}
}
