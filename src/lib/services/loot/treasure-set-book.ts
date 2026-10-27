import type { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { TreasureSetCatalog } from '#lib/data/types.js';

/**
 * Zestawy losowego łupu bieżącego świata (Gothic 3). Plik `treasure_sets.json` jest duży, więc
 * pobieramy go dopiero przy pierwszej karcie, która go potrzebuje, i zapamiętujemy do zmiany świata.
 */
export class TreasureSetBook {
	private dataLoader: GeoportalDataLoader | null = null;
	private loading: Promise<TreasureSetCatalog | null> | null = null;

	useWorld(dataLoader: GeoportalDataLoader | null): void {
		this.dataLoader = dataLoader;
		this.loading = null;
	}

	/** Zwraca `null`, gdy świat nie ma pliku zestawów albo pobranie się nie powiodło. */
	loadCatalog(): Promise<TreasureSetCatalog | null> {
		const dataLoader = this.dataLoader;
		if (!dataLoader) return Promise.resolve(null);
		this.loading ??= dataLoader.loadTreasureSetCatalog().catch((error: unknown) => {
			console.error(error);
			return null;
		});
		return this.loading;
	}
}
