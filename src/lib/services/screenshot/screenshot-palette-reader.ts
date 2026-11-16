import type { ScreenshotPalette } from './screenshot-composer.js';

const FALLBACK_COLOR = '#171c17';

/** Czyta kolory i kroje pisma motywu (zmienne CSS), żeby pasek zdjęcia pasował do bieżącego trybu jasnego lub ciemnego. */
export class ScreenshotPaletteReader {
	constructor(private readonly readCssVariable: (name: string) => string) {}

	read(): ScreenshotPalette {
		return {
			mapBackground: this.readColor('--woda'),
			bandBackground: this.readColor('--lupek'),
			bandBorder: this.readColor('--zar'),
			titleColor: this.readColor('--zar'),
			detailColor: this.readColor('--popiol'),
			titleFontFamily: this.readText('--font-heading', 'serif'),
			detailFontFamily: this.readText('--font-sans', 'sans-serif')
		};
	}

	private readColor(name: string): string {
		return this.readText(name, FALLBACK_COLOR);
	}

	private readText(name: string, fallback: string): string {
		const value = this.readCssVariable(name).trim();
		return value === '' ? fallback : value;
	}
}
