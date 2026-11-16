import { ScreenshotBandLayoutCalculator } from './screenshot-band-layout-calculator.js';

export interface ScreenshotPalette {
	mapBackground: string;
	bandBackground: string;
	bandBorder: string;
	titleColor: string;
	detailColor: string;
	titleFontFamily: string;
	detailFontFamily: string;
}

export interface ScreenshotCaption {
	title: string;
	detail: string;
}

export interface ScreenshotImageComposer {
	compose(
		mapImage: ImageBitmap,
		caption: ScreenshotCaption,
		palette: ScreenshotPalette
	): Promise<Blob | null>;
}

/**
 * Składa zdjęcie widoku: tło mapy pod przezroczystymi miejscami płótna, obraz mapy i pasek podpisu
 * pod nim (tytuł z lewej, szczegóły z prawej). Płótno dostarcza fabryka, żeby klasa nie dotykała dokumentu.
 */
export class ScreenshotComposer implements ScreenshotImageComposer {
	private readonly layoutCalculator = new ScreenshotBandLayoutCalculator();

	constructor(
		private readonly createCanvas: (width: number, height: number) => HTMLCanvasElement
	) {}

	async compose(
		mapImage: ImageBitmap,
		caption: ScreenshotCaption,
		palette: ScreenshotPalette
	): Promise<Blob | null> {
		const layout = this.layoutCalculator.calculate(mapImage.width);
		const canvas = this.createCanvas(mapImage.width, mapImage.height + layout.bandHeight);
		const context = canvas.getContext('2d');
		if (!context) return null;

		this.paintMap(context, mapImage, palette);
		const bandTop = mapImage.height;
		context.fillStyle = palette.bandBackground;
		context.fillRect(0, bandTop, canvas.width, layout.bandHeight);
		context.fillStyle = palette.bandBorder;
		context.fillRect(0, bandTop, canvas.width, Math.max(1, Math.round(layout.bandHeight / 24)));

		context.textBaseline = 'middle';
		const textY = bandTop + layout.bandHeight / 2;
		context.fillStyle = palette.titleColor;
		context.font = `${layout.fontSizePixels}px ${palette.titleFontFamily}`;
		context.textAlign = 'left';
		context.fillText(caption.title, layout.paddingPixels, textY);
		context.fillStyle = palette.detailColor;
		context.font = `${Math.round(layout.fontSizePixels * 0.8)}px ${palette.detailFontFamily}`;
		context.textAlign = 'right';
		context.fillText(caption.detail, canvas.width - layout.paddingPixels, textY);

		return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
	}

	private paintMap(
		context: CanvasRenderingContext2D,
		mapImage: ImageBitmap,
		palette: ScreenshotPalette
	): void {
		context.fillStyle = palette.mapBackground;
		context.fillRect(0, 0, mapImage.width, mapImage.height);
		context.drawImage(mapImage, 0, 0);
	}
}
