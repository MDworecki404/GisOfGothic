import type { ScreenshotFileNameBuilder } from './screenshot-file-name-builder.js';
import type {
	ScreenshotCaption,
	ScreenshotImageComposer,
	ScreenshotPalette
} from './screenshot-composer.js';

export interface ViewScreenshot {
	blob: Blob;
	fileName: string;
}

export interface ViewScreenshotContext {
	worldName: string | null;
	appVersion: string;
	siteAddress: string;
}

/**
 * Robi zdjęcie widoku: pobiera klatkę mapy, dokłada pasek podpisu i nadaje nazwę pliku.
 * Zwraca `null`, gdy mapa nie jest gotowa albo przeglądarka nie potrafi zapisać obrazu.
 */
export class ViewScreenshotTaker {
	constructor(
		private readonly captureMapImage: () => Promise<ImageBitmap | null>,
		private readonly composer: ScreenshotImageComposer,
		private readonly fileNameBuilder: ScreenshotFileNameBuilder,
		private readonly readPalette: () => ScreenshotPalette,
		private readonly readCurrentTime: () => Date
	) {}

	async take(context: ViewScreenshotContext): Promise<ViewScreenshot | null> {
		const mapImage = await this.captureMapImage();
		if (!mapImage) return null;
		const blob = await this.composer.compose(
			mapImage,
			this.buildCaption(context),
			this.readPalette()
		);
		mapImage.close();
		if (!blob) return null;
		const fileName = this.fileNameBuilder.build(context.worldName ?? '', this.readCurrentTime());
		return { blob, fileName };
	}

	private buildCaption(context: ViewScreenshotContext): ScreenshotCaption {
		return {
			title: 'GIS of Gothic',
			subtitle: context.worldName ?? '',
			detailLines: [context.siteAddress, `wersja ${context.appVersion}`]
		};
	}
}
