import type { AppEventBus } from '#lib/events/app-events.js';
import {
	clampFieldOfViewDegrees,
	DEFAULT_CAMERA_PROJECTION,
	DEFAULT_FIELD_OF_VIEW_DEGREES,
	type CameraProjectionSetting
} from './camera-projection.js';

export interface CameraProjectionDisplay {
	showCameraProjection(setting: CameraProjectionSetting): void;
}

type CameraProjectionKind = CameraProjectionSetting['kind'];

/**
 * Trzyma wybrany rzut kamery i kąt widzenia. Kąt widzenia pamięta także w rzucie ortogonalnym, żeby
 * powrót do perspektywy przywrócił ostatnią wartość. Każda zmiana trafia na mapę (jeśli jest) i do zdarzenia.
 */
export class CameraProjectionCoordinator {
	private kind: CameraProjectionKind = DEFAULT_CAMERA_PROJECTION.kind;
	private fieldOfViewDegrees = DEFAULT_FIELD_OF_VIEW_DEGREES;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => CameraProjectionDisplay | null
	) {}

	get currentSetting(): CameraProjectionSetting {
		return this.kind === 'orthographic'
			? { kind: 'orthographic' }
			: { kind: 'perspective', fovDegrees: this.fieldOfViewDegrees };
	}

	selectKind(kind: CameraProjectionKind): void {
		this.kind = kind;
		this.applyAndPublish();
	}

	toggleKind(): void {
		this.selectKind(this.kind === 'orthographic' ? 'perspective' : 'orthographic');
	}

	setFieldOfView(degrees: number): void {
		this.fieldOfViewDegrees = clampFieldOfViewDegrees(degrees);
		this.applyAndPublish();
	}

	restore(setting: CameraProjectionSetting | null): void {
		const restored = setting ?? DEFAULT_CAMERA_PROJECTION;
		this.kind = restored.kind;
		if (restored.kind === 'perspective') {
			this.fieldOfViewDegrees = clampFieldOfViewDegrees(restored.fovDegrees);
		}
		this.applyAndPublish();
	}

	showOnMap(): void {
		this.applyAndPublish();
	}

	private applyAndPublish(): void {
		const setting = this.currentSetting;
		this.getDisplay()?.showCameraProjection(setting);
		this.eventBus.publish({
			type: 'camera-projection-changed',
			projection: setting,
			fieldOfViewDegrees: this.fieldOfViewDegrees
		});
	}
}
