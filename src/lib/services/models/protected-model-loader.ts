import { ProtectedModelCodec, type ProtectedModelContent } from './protected-model-format.js';

export type ResourceFetcher = (url: string) => Promise<Response>;

export interface LoadedProtectedModel extends ProtectedModelContent {
	fileId: string;
}

/**
 * Pobiera zaszyfrowany podgląd przedmiotu z bramki modeli i odszyfrowuje go w pamięci.
 * `modelPath` to logiczna ścieżka modelu (np. `g2nk/khorinis/previews/itpl_perm_herb.glb`);
 * adres pliku powstaje z jej HMAC, więc w sieci widać tylko losowo wyglądające nazwy.
 */
export class ProtectedModelLoader {
	private readonly codec: ProtectedModelCodec;

	constructor(
		base64Key: string,
		private readonly fetchResource: ResourceFetcher = (url) => fetch(url)
	) {
		this.codec = new ProtectedModelCodec(base64Key);
	}

	async loadModel(protectedModelsUrl: string, modelPath: string): Promise<LoadedProtectedModel> {
		const fileId = await this.codec.createFileId(modelPath);
		const response = await this.fetchResource(`${protectedModelsUrl}/${fileId}.bin`);
		if (!response.ok) throw new Error(`Nie udało się pobrać modelu (HTTP ${response.status})`);
		const content = await this.codec.decrypt(new Uint8Array(await response.arrayBuffer()));
		return { ...content, fileId };
	}
}
