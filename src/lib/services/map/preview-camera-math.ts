const MINIMUM_PITCH_DEGREES = -85;
const MAXIMUM_PITCH_DEGREES = 10;
const DRAG_HEADING_DEGREES_PER_PIXEL = 0.4;
const DRAG_PITCH_DEGREES_PER_PIXEL = 0.3;
const WHEEL_ZOOM_PER_DELTA_UNIT = 0.0012;
const AUTO_ROTATION_DEGREES_PER_SECOND = 24;

export interface PreviewCameraAngles {
	headingDegrees: number;
	pitchDegrees: number;
}

/** Obliczenia kątów i odległości kamery podglądu 3D, bez zależności od Cesium i przeglądarki. */
export class PreviewCameraMath {
	clampPitchDegrees(pitchDegrees: number): number {
		return Math.min(MAXIMUM_PITCH_DEGREES, Math.max(MINIMUM_PITCH_DEGREES, pitchDegrees));
	}

	wrapHeadingDegrees(headingDegrees: number): number {
		return ((headingDegrees % 360) + 360) % 360;
	}

	/** Przeciągnięcie w prawo obraca model w prawo, w dół — pokazuje go bardziej z góry. */
	dragAngles(
		angles: PreviewCameraAngles,
		deltaXPixels: number,
		deltaYPixels: number
	): PreviewCameraAngles {
		return {
			headingDegrees: this.wrapHeadingDegrees(
				angles.headingDegrees - deltaXPixels * DRAG_HEADING_DEGREES_PER_PIXEL
			),
			pitchDegrees: this.clampPitchDegrees(
				angles.pitchDegrees - deltaYPixels * DRAG_PITCH_DEGREES_PER_PIXEL
			)
		};
	}

	zoomRange(range: number, factor: number, minimumRange: number, maximumRange: number): number {
		return Math.min(maximumRange, Math.max(minimumRange, range * factor));
	}

	wheelZoomFactor(wheelDelta: number): number {
		return Math.exp(wheelDelta * WHEEL_ZOOM_PER_DELTA_UNIT);
	}

	pinchZoomFactor(previousDistancePixels: number, currentDistancePixels: number): number {
		if (currentDistancePixels <= 0 || previousDistancePixels <= 0) return 1;
		return previousDistancePixels / currentDistancePixels;
	}

	advanceAutoRotation(headingDegrees: number, elapsedMilliseconds: number): number {
		return this.wrapHeadingDegrees(
			headingDegrees + (AUTO_ROTATION_DEGREES_PER_SECOND * elapsedMilliseconds) / 1000
		);
	}
}
