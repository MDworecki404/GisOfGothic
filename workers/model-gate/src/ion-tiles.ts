interface IonEndpoint {
	baseUrl: string;
	query: string;
	accessToken: string;
	expiresAtMilliseconds: number;
}

const ION_API = 'https://api.cesium.com/v1/assets';
const ENDPOINT_REFRESH_MARGIN_MILLISECONDS = 5 * 60 * 1000;
const FALLBACK_ENDPOINT_LIFETIME_MILLISECONDS = 30 * 60 * 1000;
const TILE_PATH = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*\.(json|b3dm|glb|i3dm|pnts|cmpt|subtree)$/;

function readTokenExpiry(accessToken: string): number {
	try {
		const payload: unknown = JSON.parse(
			atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
		);
		if (
			typeof payload === 'object' &&
			payload !== null &&
			'exp' in payload &&
			typeof payload.exp === 'number'
		) {
			return payload.exp * 1000;
		}
	} catch {
		return Date.now() + FALLBACK_ENDPOINT_LIFETIME_MILLISECONDS;
	}
	return Date.now() + FALLBACK_ENDPOINT_LIFETIME_MILLISECONDS;
}

export function isTilePath(path: string): boolean {
	return TILE_PATH.test(path) && !path.includes('..');
}

/**
 * Pośrednik do kafli 3D Tiles z Cesium ion. Token ion jest wyłącznie po stronie Workera:
 * Worker pobiera krótkotrwały token assetu z API ion (zapamiętuje go do wygaśnięcia), pobiera
 * kafel z serwerów ion i oddaje go pod własnym adresem. Przeglądarka nie zna ani tokenu, ani
 * adresów ion. Odpowiedzi trzyma pamięć podręczna Cloudflare, żeby oszczędzać limit ion.
 */
export class IonTileProxy {
	private readonly endpoints = new Map<string, IonEndpoint>();

	constructor(
		private readonly serverToken: string,
		private readonly referer: string
	) {}

	async fetchTile(assetId: string, tilePath: string): Promise<Response> {
		const response = await this.fetchFromIon(assetId, tilePath, false);
		if (response.status !== 401) return response;
		this.endpoints.delete(assetId);
		return this.fetchFromIon(assetId, tilePath, true);
	}

	private async fetchFromIon(
		assetId: string,
		tilePath: string,
		isRetry: boolean
	): Promise<Response> {
		const endpoint = await this.resolveEndpoint(assetId, isRetry);
		const url = `${endpoint.baseUrl}${tilePath}${endpoint.query}`;
		return fetch(url, { headers: { Authorization: `Bearer ${endpoint.accessToken}` } });
	}

	private async resolveEndpoint(assetId: string, forceRefresh: boolean): Promise<IonEndpoint> {
		const cached = this.endpoints.get(assetId);
		if (
			!forceRefresh &&
			cached &&
			cached.expiresAtMilliseconds - ENDPOINT_REFRESH_MARGIN_MILLISECONDS > Date.now()
		) {
			return cached;
		}
		const response = await fetch(
			`${ION_API}/${assetId}/endpoint?access_token=${this.serverToken}`,
			{
				headers: { Referer: this.referer }
			}
		);
		if (!response.ok)
			throw new Error(`Cesium ion odmówił dostępu do assetu (HTTP ${response.status})`);
		const body: unknown = await response.json();
		if (
			typeof body !== 'object' ||
			body === null ||
			!('url' in body) ||
			typeof body.url !== 'string' ||
			!('accessToken' in body) ||
			typeof body.accessToken !== 'string'
		) {
			throw new Error('Cesium ion zwrócił nieoczekiwaną odpowiedź');
		}
		const tilesetUrl = new URL(body.url);
		const endpoint: IonEndpoint = {
			baseUrl: `${tilesetUrl.origin}${tilesetUrl.pathname.replace(/[^/]*$/, '')}`,
			query: tilesetUrl.search,
			accessToken: body.accessToken,
			expiresAtMilliseconds: readTokenExpiry(body.accessToken)
		};
		this.endpoints.set(assetId, endpoint);
		return endpoint;
	}
}
