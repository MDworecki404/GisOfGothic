/** Brzegi mapy zasłonięte przez interfejs, w pikselach CSS: panel narzędzia z lewej albo od dołu. */
export interface MapViewInsets {
	leftPixels: number;
	bottomPixels: number;
}

export interface CanvasSize {
	widthPixels: number;
	heightPixels: number;
}

export interface PixelShift {
	rightPixels: number;
	upPixels: number;
}

const MINIMUM_FREE_FRACTION = 0.3;

/**
 * Liczy, gdzie na ekranie jest wolny od paneli obszar mapy. Punkt, który ma być widoczny, powinien
 * wypaść w środku tego obszaru, a nie w środku całego płótna.
 */
export class FreeAreaCalculator {
	/**
	 * O ile pikseli w prawo i w górę trzeba przesunąć obraz względem środka płótna, żeby cel
	 * trafił w środek wolnego obszaru (środek wolnego prostokąta leży o połowę zasłoniętego brzegu dalej).
	 */
	calculateShiftToFreeAreaCentre(insets: MapViewInsets, canvas: CanvasSize): PixelShift {
		const free = this.measureFreeArea(insets, canvas);
		return {
			rightPixels: (canvas.widthPixels - free.widthPixels) / 2,
			upPixels: (canvas.heightPixels - free.heightPixels) / 2
		};
	}

	/**
	 * Współczynnik, przez który trzeba pomnożyć odległość kamery, żeby to, co mieściło się
	 * w całym płótnie, zmieściło się w wolnym obszarze.
	 */
	calculateRangeScale(insets: MapViewInsets, canvas: CanvasSize): number {
		const free = this.measureFreeArea(insets, canvas);
		return Math.max(
			1,
			canvas.widthPixels / free.widthPixels,
			canvas.heightPixels / free.heightPixels
		);
	}

	private measureFreeArea(insets: MapViewInsets, canvas: CanvasSize): CanvasSize {
		return {
			widthPixels: Math.max(
				canvas.widthPixels * MINIMUM_FREE_FRACTION,
				canvas.widthPixels - Math.max(0, insets.leftPixels)
			),
			heightPixels: Math.max(
				canvas.heightPixels * MINIMUM_FREE_FRACTION,
				canvas.heightPixels - Math.max(0, insets.bottomPixels)
			)
		};
	}
}
