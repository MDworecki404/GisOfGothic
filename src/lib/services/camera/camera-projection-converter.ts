export const MINIMUM_PERSPECTIVE_DISTANCE_METRES = 5;

/**
 * Przeliczenia między rzutem środkowym a ortogonalnym. W rzucie ortogonalnym Cesium ustawia szerokość
 * widoku równą odległości kamery od celu, więc przy przełączeniu kamerę trzeba odsunąć tak, by szerokość
 * była równa widocznej szerokości perspektywy na celu — wtedy cel zachowuje rozmiar na ekranie.
 */
export class CameraProjectionConverter {
	/** Kąt `fov` Cesium to większy z dwóch kątów widzenia: na ekranie poziomym poziomy, na pionowym pionowy. */
	calculateVerticalFieldOfView(fieldOfViewRadians: number, aspectRatio: number): number {
		if (aspectRatio < 1) return fieldOfViewRadians;
		return 2 * Math.atan(Math.tan(fieldOfViewRadians / 2) / aspectRatio);
	}

	calculatePerspectiveVisibleWidth(
		distanceMetres: number,
		verticalFieldOfViewRadians: number,
		aspectRatio: number
	): number {
		return 2 * distanceMetres * Math.tan(verticalFieldOfViewRadians / 2) * aspectRatio;
	}

	/**
	 * Odwrotność widocznej szerokości. Po powrocie z rzutu ortogonalnego kamera zbliża się do celu,
	 * więc dolna granica odległości chroni ją przed wejściem w teren.
	 */
	calculatePerspectiveDistanceForWidth(
		widthMetres: number,
		verticalFieldOfViewRadians: number,
		aspectRatio: number,
		minimumDistanceMetres: number
	): number {
		const distance = widthMetres / (2 * Math.tan(verticalFieldOfViewRadians / 2) * aspectRatio);
		return Math.max(distance, minimumDistanceMetres);
	}

	calculateMetresPerPixel(frustumWidthMetres: number, canvasWidthPixels: number): number | null {
		if (!(frustumWidthMetres > 0) || !(canvasWidthPixels > 0)) return null;
		const metresPerPixel = frustumWidthMetres / canvasWidthPixels;
		return Number.isFinite(metresPerPixel) ? metresPerPixel : null;
	}
}
