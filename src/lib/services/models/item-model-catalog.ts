import { isRecord, requireNumber, requireRecord, requireString } from '#lib/data/parsers.js';

export interface ModelBounds {
	x: number;
	y: number;
	z: number;
}

export type ResourceFetcher = (url: string) => Promise<Response>;

const INDEX_FILE_NAME = 'index.json';

export function parsePreviewIndex(json: unknown): Map<string, ModelBounds> {
	const root = requireRecord(json, 'previews/index.json');
	const previews = Array.isArray(root.previews) ? root.previews : [];
	const boundsByFile = new Map<string, ModelBounds>();
	for (const [index, preview] of previews.entries()) {
		if (!isRecord(preview)) continue;
		const description = `previews/index.json: podgląd #${index}`;
		const bounds = requireRecord(preview.bounds_m, description);
		boundsByFile.set(requireString(preview, 'file', description), {
			x: requireNumber(bounds, 'x', description),
			y: requireNumber(bounds, 'y', description),
			z: requireNumber(bounds, 'z', description)
		});
	}
	return boundsByFile;
}

/**
 * Wymiary modeli podglądu z `index.json` leżącego obok plików `.glb`. Spis każdego katalogu
 * jest pobierany raz; błąd pobrania oznacza tylko brak wymiarów, a nie brak podglądu.
 */
export class ItemModelCatalog {
	private readonly indexRequests = new Map<string, Promise<Map<string, ModelBounds>>>();

	constructor(private readonly fetchResource: ResourceFetcher = (url) => fetch(url)) {}

	async findBounds(modelUrl: string): Promise<ModelBounds | null> {
		const separatorIndex = modelUrl.lastIndexOf('/');
		const directoryUrl = modelUrl.slice(0, separatorIndex + 1);
		const fileName = modelUrl.slice(separatorIndex + 1);
		try {
			const boundsByFile = await this.loadIndex(`${directoryUrl}${INDEX_FILE_NAME}`);
			return boundsByFile.get(fileName) ?? null;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	private loadIndex(indexUrl: string): Promise<Map<string, ModelBounds>> {
		const cached = this.indexRequests.get(indexUrl);
		if (cached) return cached;
		const request = this.fetchResource(indexUrl).then(async (response) => {
			if (!response.ok)
				throw new Error(`Nie udało się pobrać ${indexUrl} (HTTP ${response.status})`);
			return parsePreviewIndex(await response.json());
		});
		request.catch(() => this.indexRequests.delete(indexUrl));
		this.indexRequests.set(indexUrl, request);
		return request;
	}
}
