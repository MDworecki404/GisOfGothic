const POLISH_LETTERS_WITHOUT_DIACRITICS: Readonly<Record<string, string>> = {
	ł: 'l',
	Ł: 'l'
};

/** Układa nazwę pliku zdjęcia: `gis-of-gothic-<świat>-RRRR-MM-DD-GGMM.png`, tylko małe litery ASCII i myślniki. */
export class ScreenshotFileNameBuilder {
	build(worldName: string, takenAt: Date): string {
		const worldSlug = this.slugify(worldName);
		const parts = ['gis-of-gothic', worldSlug, this.formatTimestamp(takenAt)].filter(
			(part) => part !== ''
		);
		return `${parts.join('-')}.png`;
	}

	private slugify(text: string): string {
		return text
			.replace(/[łŁ]/g, (letter) => POLISH_LETTERS_WITHOUT_DIACRITICS[letter] ?? letter)
			.normalize('NFD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	private formatTimestamp(date: Date): string {
		const pad = (value: number): string => String(value).padStart(2, '0');
		const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
		return `${day}-${pad(date.getHours())}${pad(date.getMinutes())}`;
	}
}
