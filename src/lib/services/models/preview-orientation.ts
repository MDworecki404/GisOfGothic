import type { ModelBounds } from './item-model-catalog.js';

/**
 * `as-saved` — model ma naturalne proporcje i zostaje tak, jak jest w grze; `view-from-above` —
 * model płaski, ale nie wydłużony, zostaje leżący, a kamera patrzy z góry;
 * `stand-on-east-axis` / `stand-on-north-axis` — długi, płaski model obrócony o 90°, żeby jego
 * oś długości (glTF x = wschód albo glTF z = północ) stała pionowo.
 */
export type PreviewOrientation =
	'as-saved' | 'view-from-above' | 'stand-on-east-axis' | 'stand-on-north-axis';

const FLAT_LENGTH_TO_HEIGHT_RATIO = 2.5;
const ELONGATED_LENGTH_TO_WIDTH_RATIO = 1.8;

/**
 * Przedmioty w grze leżą na ziemi, więc w pliku są płaskie. Długie przedmioty (broń, łuki,
 * pochodnie) stawiamy pionowo jak na stojaku; płaskie, ale szerokie (pancerze złożone w kupkę,
 * amulety, zwoje) pokazujemy leżące z góry. Przedmioty o naturalnych proporcjach (rośliny,
 * mikstury) zostają bez zmian.
 */
export class PreviewOrientationChooser {
	constructor(
		private readonly flatRatio = FLAT_LENGTH_TO_HEIGHT_RATIO,
		private readonly elongatedRatio = ELONGATED_LENGTH_TO_WIDTH_RATIO
	) {}

	chooseOrientation(bounds: ModelBounds | null): PreviewOrientation {
		if (!bounds) return 'as-saved';
		const length = Math.max(bounds.x, bounds.z);
		const width = Math.min(bounds.x, bounds.z);
		if (length <= bounds.y * this.flatRatio) return 'as-saved';
		if (length <= width * this.elongatedRatio) return 'view-from-above';
		return bounds.x >= bounds.z ? 'stand-on-east-axis' : 'stand-on-north-axis';
	}
}
