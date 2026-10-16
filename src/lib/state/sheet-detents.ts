export const SHEET_DETENTS = ['collapsed', 'half', 'full'] as const;

export type SheetDetent = (typeof SHEET_DETENTS)[number];

export const SHEET_DETENT_LABELS: Readonly<Record<SheetDetent, string>> = {
	collapsed: 'zwinięty',
	half: 'połowa ekranu',
	full: 'pełny ekran'
};

export interface SheetHeights {
	collapsedPixels: number;
	halfPixels: number;
	fullPixels: number;
}

/** Odległość w przód, na jaką rzut prędkości palca przesuwa miejsce puszczenia uchwytu. */
const FLING_PROJECTION_MILLISECONDS = 140;

export function findSheetDetentIndex(detent: SheetDetent): number {
	return SHEET_DETENTS.indexOf(detent);
}

export function findNextSheetDetent(detent: SheetDetent): SheetDetent {
	return SHEET_DETENTS[(findSheetDetentIndex(detent) + 1) % SHEET_DETENTS.length];
}

export function findHigherSheetDetent(detent: SheetDetent): SheetDetent {
	return SHEET_DETENTS[Math.min(findSheetDetentIndex(detent) + 1, SHEET_DETENTS.length - 1)];
}

export function findLowerSheetDetent(detent: SheetDetent): SheetDetent {
	return SHEET_DETENTS[Math.max(findSheetDetentIndex(detent) - 1, 0)];
}

/** Zamienia stany arkusza na wysokości w pikselach i odwrotnie: gdzie arkusz ma stanąć po przeciągnięciu. */
export class SheetHeightResolver {
	constructor(private readonly heights: SheetHeights) {}

	findHeightOfDetent(detent: SheetDetent): number {
		if (detent === 'collapsed') return this.heights.collapsedPixels;
		if (detent === 'half') return this.heights.halfPixels;
		return this.heights.fullPixels;
	}

	clampHeight(heightPixels: number): number {
		return Math.min(this.heights.fullPixels, Math.max(this.heights.collapsedPixels, heightPixels));
	}

	/**
	 * Wybiera stan, w którym arkusz ma się zatrzymać po puszczeniu uchwytu: najbliższy miejscu,
	 * do którego dotarłby przy dalszym ruchu palca (prędkość dodatnia = w górę).
	 */
	findDetentAfterRelease(heightPixels: number, upwardPixelsPerMillisecond: number): SheetDetent {
		const projectedHeight = this.clampHeight(
			heightPixels + upwardPixelsPerMillisecond * FLING_PROJECTION_MILLISECONDS
		);
		let nearest: SheetDetent = 'collapsed';
		for (const detent of SHEET_DETENTS) {
			const distance = Math.abs(this.findHeightOfDetent(detent) - projectedHeight);
			const nearestDistance = Math.abs(this.findHeightOfDetent(nearest) - projectedHeight);
			if (distance < nearestDistance) nearest = detent;
		}
		return nearest;
	}
}
