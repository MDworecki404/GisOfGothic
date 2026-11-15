import type { CharacterModelParts } from '#lib/data/types.js';
import type { LoadedProtectedModel } from './protected-model-loader.js';

export interface ProtectedModelSource {
	loadModel(protectedModelsUrl: string, modelPath: string): Promise<LoadedProtectedModel>;
}

/**
 * Składa podgląd postaci z jej części. Pancerz zastępuje ciało, tak jak w grze: plik pancerza ma własną
 * skórę, więc ciało pod spodem tylko by się z nim zlewało. Wszystkie części leżą w jednym układzie, więc
 * aplikacja ustawia je w tym samym miejscu sceny, bez liczenia kości.
 */
export class CharacterModelAssembler {
	constructor(private readonly source: ProtectedModelSource) {}

	/** Logiczne ścieżki części do pobrania (z przestrzenią świata) w kolejności: korpus, głowa, broń. */
	listModelPaths(parts: CharacterModelParts, modelNamespace: string): string[] {
		return [parts.armor ?? parts.body, parts.head, parts.weapon]
			.filter((file) => file !== null)
			.map((file) => `${modelNamespace}/${file}`);
	}

	/**
	 * Pobiera części równolegle. Brak jednej (np. broni) nie blokuje reszty; błąd zgłaszamy dopiero,
	 * gdy nie udało się pobrać żadnej.
	 */
	async loadParts(
		protectedModelsUrl: string,
		parts: CharacterModelParts,
		modelNamespace: string
	): Promise<LoadedProtectedModel[]> {
		const results = await Promise.allSettled(
			this.listModelPaths(parts, modelNamespace).map((path) =>
				this.source.loadModel(protectedModelsUrl, path)
			)
		);
		const loaded = results.flatMap((result) =>
			result.status === 'fulfilled' ? [result.value] : []
		);
		if (loaded.length === 0) throw new Error('Nie udało się pobrać żadnej części modelu postaci');
		return loaded;
	}
}
