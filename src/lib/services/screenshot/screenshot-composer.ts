import {
	ScreenshotFrameLayoutCalculator,
	type ScreenshotFrameLayout
} from './screenshot-frame-layout-calculator.js';

export interface ScreenshotPalette {
	mapBackground: string;
	frameBackground: string;
	goldColor: string;
	primaryTextColor: string;
	mutedTextColor: string;
	titleFontFamily: string;
	detailFontFamily: string;
}

export interface ScreenshotCaption {
	title: string;
	subtitle: string;
	detailLines: readonly string[];
}

export interface ScreenshotImageComposer {
	compose(
		mapImage: ImageBitmap,
		caption: ScreenshotCaption,
		palette: ScreenshotPalette
	): Promise<Blob | null>;
}

const VIGNETTE_STRENGTH = 0.38;

/**
 * Składa zdjęcie widoku jak oprawiony obraz: ciemna rama z podwójną złotą linią i rombami w rogach,
 * delikatne przyciemnienie brzegów kadru oraz podpis pod obrazem (tytuł i świat z lewej, adres i wersja
 * z prawej). Płótno dostarcza fabryka, żeby klasa nie dotykała dokumentu.
 */
export class ScreenshotComposer implements ScreenshotImageComposer {
	private readonly layoutCalculator = new ScreenshotFrameLayoutCalculator();

	constructor(
		private readonly createCanvas: (width: number, height: number) => HTMLCanvasElement
	) {}

	async compose(
		mapImage: ImageBitmap,
		caption: ScreenshotCaption,
		palette: ScreenshotPalette
	): Promise<Blob | null> {
		const layout = this.layoutCalculator.calculate(mapImage.width);
		const canvas = this.createCanvas(
			mapImage.width + layout.marginPixels * 2,
			mapImage.height + layout.marginPixels + layout.captionHeightPixels
		);
		const context = canvas.getContext('2d');
		if (!context) return null;

		context.fillStyle = palette.frameBackground;
		context.fillRect(0, 0, canvas.width, canvas.height);
		this.paintMap(context, mapImage, layout, palette);
		this.paintFrameLines(context, mapImage, layout, palette);
		this.paintCaption(context, mapImage, caption, layout, palette);

		return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
	}

	private paintMap(
		context: CanvasRenderingContext2D,
		mapImage: ImageBitmap,
		layout: ScreenshotFrameLayout,
		palette: ScreenshotPalette
	): void {
		const { marginPixels } = layout;
		context.save();
		context.beginPath();
		context.rect(marginPixels, marginPixels, mapImage.width, mapImage.height);
		context.clip();
		context.fillStyle = palette.mapBackground;
		context.fillRect(marginPixels, marginPixels, mapImage.width, mapImage.height);
		context.drawImage(mapImage, marginPixels, marginPixels);
		const centreX = marginPixels + mapImage.width / 2;
		const centreY = marginPixels + mapImage.height / 2;
		const vignette = context.createRadialGradient(
			centreX,
			centreY,
			Math.min(mapImage.width, mapImage.height) * 0.35,
			centreX,
			centreY,
			Math.hypot(mapImage.width, mapImage.height) / 2
		);
		vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
		vignette.addColorStop(1, `rgba(0, 0, 0, ${VIGNETTE_STRENGTH})`);
		context.fillStyle = vignette;
		context.fillRect(marginPixels, marginPixels, mapImage.width, mapImage.height);
		context.restore();
	}

	private paintFrameLines(
		context: CanvasRenderingContext2D,
		mapImage: ImageBitmap,
		layout: ScreenshotFrameLayout,
		palette: ScreenshotPalette
	): void {
		const { marginPixels, frameLinePixels, outerLineGapPixels, cornerDiamondPixels } = layout;
		context.strokeStyle = palette.goldColor;
		context.lineWidth = frameLinePixels;
		context.globalAlpha = 0.85;
		context.strokeRect(
			marginPixels - frameLinePixels / 2,
			marginPixels - frameLinePixels / 2,
			mapImage.width + frameLinePixels,
			mapImage.height + frameLinePixels
		);

		const outerLeft = marginPixels - outerLineGapPixels;
		const outerTop = marginPixels - outerLineGapPixels;
		const outerRight = marginPixels + mapImage.width + outerLineGapPixels;
		const outerBottom = marginPixels + mapImage.height + outerLineGapPixels;
		context.globalAlpha = 0.4;
		context.strokeRect(outerLeft, outerTop, outerRight - outerLeft, outerBottom - outerTop);

		context.globalAlpha = 1;
		context.fillStyle = palette.goldColor;
		for (const [x, y] of [
			[outerLeft, outerTop],
			[outerRight, outerTop],
			[outerLeft, outerBottom],
			[outerRight, outerBottom]
		]) {
			this.fillDiamond(context, x, y, cornerDiamondPixels);
		}
	}

	private fillDiamond(
		context: CanvasRenderingContext2D,
		centreX: number,
		centreY: number,
		radius: number
	): void {
		context.beginPath();
		context.moveTo(centreX, centreY - radius);
		context.lineTo(centreX + radius, centreY);
		context.lineTo(centreX, centreY + radius);
		context.lineTo(centreX - radius, centreY);
		context.closePath();
		context.fill();
	}

	private paintCaption(
		context: CanvasRenderingContext2D,
		mapImage: ImageBitmap,
		caption: ScreenshotCaption,
		layout: ScreenshotFrameLayout,
		palette: ScreenshotPalette
	): void {
		const { marginPixels, captionHeightPixels, titleFontPixels, detailFontPixels } = layout;
		const captionTop = marginPixels * 2 + mapImage.height;
		const captionBottom = marginPixels + mapImage.height + captionHeightPixels;
		const leftX = marginPixels;
		const rightX = marginPixels + mapImage.width;
		const centreY = (captionTop + captionBottom) / 2;
		context.textBaseline = 'middle';

		const hasSubtitle = caption.subtitle !== '';
		const titleY = hasSubtitle ? centreY - titleFontPixels * 0.3 : centreY;
		context.textAlign = 'left';
		context.fillStyle = palette.goldColor;
		context.font = `${titleFontPixels}px ${palette.titleFontFamily}`;
		context.fillText(caption.title, leftX, titleY);
		if (hasSubtitle) {
			context.fillStyle = palette.primaryTextColor;
			context.font = `${Math.round(detailFontPixels * 1.15)}px ${palette.detailFontFamily}`;
			context.fillText(caption.subtitle, leftX, centreY + titleFontPixels * 0.5);
		}

		context.textAlign = 'right';
		context.fillStyle = palette.mutedTextColor;
		context.font = `${detailFontPixels}px ${palette.detailFontFamily}`;
		const lineHeight = detailFontPixels * 1.5;
		const firstLineY = centreY - ((caption.detailLines.length - 1) * lineHeight) / 2;
		caption.detailLines.forEach((line, index) => {
			context.fillText(line, rightX, firstLineY + index * lineHeight);
		});
	}
}
