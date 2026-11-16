import type { ScreenshotPalette } from './screenshot-composer.js';

const FALLBACK_COLOR = '#171c17';

/** Czyta kolory i kroje pisma motywu (zmienne CSS), żeby oprawa zdjęcia pasowała do bieżącego trybu jasnego lub ciemnego. */
export class ScreenshotPaletteReader {
	constructor(private readonly readCssVariable: (name: string) => string) {}

	read(): ScreenshotPalette {
		return {
			mapBackground: this.readText('--woda', FALLBACK_COLOR),
			frameBackground: this.readText('--lupek', FALLBACK_COLOR),
			goldColor: this.readText('--zar', FALLBACK_COLOR),
			primaryTextColor: this.readText('--popiol', FALLBACK_COLOR),
			mutedTextColor: this.readText('--mgla', FALLBACK_COLOR),
			titleFontFamily: this.readText('--font-heading', 'serif'),
			detailFontFamily: this.readText('--font-sans', 'sans-serif')
		};
	}

	private readText(name: string, fallback: string): string {
		const value = this.readCssVariable(name).trim();
		return value === '' ? fallback : value;
	}
}
