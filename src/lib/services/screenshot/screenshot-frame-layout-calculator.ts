export interface ScreenshotFrameLayout {
	marginPixels: number;
	captionHeightPixels: number;
	titleFontPixels: number;
	detailFontPixels: number;
	frameLinePixels: number;
	outerLineGapPixels: number;
	cornerDiamondPixels: number;
}

const MARGIN_TO_IMAGE_WIDTH_RATIO = 0.022;
const MINIMUM_MARGIN_PIXELS = 14;
const MAXIMUM_MARGIN_PIXELS = 44;
const CAPTION_HEIGHT_TO_IMAGE_WIDTH_RATIO = 0.09;
const MINIMUM_CAPTION_HEIGHT_PIXELS = 76;
const MAXIMUM_CAPTION_HEIGHT_PIXELS = 170;

function clamp(value: number, minimum: number, maximum: number): number {
	return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Dobiera wymiary oprawy zdjęcia (margines, wysokość podpisu, grubość linii, rozmiar pisma i ozdób)
 * do szerokości obrazu, żeby oprawa wyglądała tak samo na małym oknie i na dużym ekranie.
 */
export class ScreenshotFrameLayoutCalculator {
	calculate(imageWidthPixels: number): ScreenshotFrameLayout {
		const marginPixels = Math.round(
			clamp(
				imageWidthPixels * MARGIN_TO_IMAGE_WIDTH_RATIO,
				MINIMUM_MARGIN_PIXELS,
				MAXIMUM_MARGIN_PIXELS
			)
		);
		const captionHeightPixels = Math.round(
			clamp(
				imageWidthPixels * CAPTION_HEIGHT_TO_IMAGE_WIDTH_RATIO,
				MINIMUM_CAPTION_HEIGHT_PIXELS,
				MAXIMUM_CAPTION_HEIGHT_PIXELS
			)
		);
		return {
			marginPixels,
			captionHeightPixels,
			titleFontPixels: Math.round(captionHeightPixels * 0.3),
			detailFontPixels: Math.round(captionHeightPixels * 0.16),
			frameLinePixels: Math.max(1, Math.round(imageWidthPixels / 800)),
			outerLineGapPixels: Math.round(marginPixels * 0.4),
			cornerDiamondPixels: Math.max(3, Math.round(marginPixels * 0.2))
		};
	}
}
