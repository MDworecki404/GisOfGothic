import { Resource } from 'cesium';

/**
 * Zasób Cesium, który zamiast pobierać plik z sieci zwraca odszyfrowany model z pamięci.
 * Dzięki temu odszyfrowany GLB nigdy nie ma adresu (ani sieciowego, ani `blob:`), który dałoby
 * się otworzyć i zapisać. Adres jest tylko unikalnym kluczem pamięci podręcznej Cesium; kopia
 * zasobu (`clone`) dalej zwraca te same bajty.
 */
export class InMemoryModelResource extends Resource {
	constructor(
		private readonly modelBytes: Uint8Array<ArrayBuffer>,
		private readonly cacheKey: string
	) {
		super({ url: `gis-of-gothic-model-${cacheKey}.glb` });
	}

	override fetchArrayBuffer(): Promise<ArrayBuffer> {
		return Promise.resolve(this.modelBytes.slice().buffer);
	}

	override clone(): InMemoryModelResource {
		return new InMemoryModelResource(this.modelBytes, this.cacheKey);
	}
}
