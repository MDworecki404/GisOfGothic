export interface ScreenshotBandLayout {
	bandHeight: number;
	fontSizePixels: number;
	paddingPixels: number;
}

const BAND_HEIGHT_TO_IMAGE_WIDTH_RATIO = 0.05;
const MINIMUM_BAND_HEIGHT_PIXELS = 44;
const MAXIMUM_BAND_HEIGHT_PIXELS = 120;
const FONT_SIZE_TO_BAND_HEIGHT_RATIO = 0.4;
const PADDING_TO_BAND_HEIGHT_RATIO = 0.5;

/** Dobiera wysokość paska podpisu i rozmiar pisma do szerokości zdjęcia, żeby podpis był czytelny przy każdym rozmiarze okna. */
export class ScreenshotBandLayoutCalculator {
	calculate(imageWidthPixels: number): ScreenshotBandLayout {
		const bandHeight = Math.min(
			MAXIMUM_BAND_HEIGHT_PIXELS,
			Math.max(
				MINIMUM_BAND_HEIGHT_PIXELS,
				Math.round(imageWidthPixels * BAND_HEIGHT_TO_IMAGE_WIDTH_RATIO)
			)
		);
		return {
			bandHeight,
			fontSizePixels: Math.round(bandHeight * FONT_SIZE_TO_BAND_HEIGHT_RATIO),
			paddingPixels: Math.round(bandHeight * PADDING_TO_BAND_HEIGHT_RATIO)
		};
	}
}
