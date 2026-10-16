export type CachingStrategy =
	'network-only' | 'cache-first' | 'stale-while-revalidate' | 'network-first-page';

export interface RequestDescription {
	url: string;
	method: string;
	mode: string;
}

const IMMUTABLE_APP_PREFIX = '/_app/immutable/';
const CESIUM_ASSETS_PREFIX = '/cesiumStatic/';
const VERSION_CHECK_PATH = '/_app/version.json';

/**
 * Decyduje, jak service worker obsługuje żądanie. Obce adresy (kafle Cesium ion, modele z R2)
 * idą prosto do sieci — ion ma własne tokeny i limity, a przeglądarka i tak je buforuje.
 * Strony: najpierw sieć, bez niej zapisana powłoka. Pliki z hashem w nazwie i zasoby Cesium
 * się nie zmieniają, więc najpierw pamięć. Dane świata i pozostałe pliki: od razu z pamięci,
 * a w tle odświeżenie.
 */
export class CachingPolicy {
	constructor(private readonly appOrigin: string) {}

	chooseStrategy(request: RequestDescription): CachingStrategy {
		if (request.method !== 'GET') return 'network-only';
		const url = new URL(request.url);
		if (url.origin !== this.appOrigin) return 'network-only';
		if (request.mode === 'navigate') return 'network-first-page';
		if (url.pathname === VERSION_CHECK_PATH) return 'network-only';
		if (url.pathname.startsWith(IMMUTABLE_APP_PREFIX)) return 'cache-first';
		if (url.pathname.startsWith(CESIUM_ASSETS_PREFIX)) return 'cache-first';
		return 'stale-while-revalidate';
	}
}
