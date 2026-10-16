import { IonTileProxy, isTilePath } from './ion-tiles';
import { refuse, RequestGuard, type RequestRateLimiter } from './request-guard';

interface StoredObject {
	body: ReadableStream;
	size: number;
}

interface ModelBucket {
	get(key: string): Promise<StoredObject | null>;
}

interface EdgeCache {
	match(request: Request): Promise<Response | undefined>;
	put(request: Request, response: Response): Promise<void>;
}

interface ExecutionContext {
	waitUntil(promise: Promise<unknown>): void;
}

interface Environment {
	MODELS: ModelBucket;
	MODEL_REQUESTS: RequestRateLimiter;
	TILE_REQUESTS: RequestRateLimiter;
	ALLOWED_ORIGINS: string;
	ALLOWED_ION_ASSETS: string;
	ION_REFERER: string;
	CESIUM_ION_SERVER_TOKEN: string;
}

declare const caches: { default: EdgeCache };

const PROTECTED_MODEL_PATH = /^\/g2nk\/[a-z0-9_-]+\/items\/[0-9a-f]{32}\.bin$/;
const ION_TILE_PATH = /^\/ion\/(\d+)\/(.+)$/;

let ionTileProxy: IonTileProxy | null = null;

function getIonTileProxy(environment: Environment): IonTileProxy {
	ionTileProxy ??= new IonTileProxy(environment.CESIUM_ION_SERVER_TOKEN, environment.ION_REFERER);
	return ionTileProxy;
}

async function serveProtectedModel(
	path: string,
	origin: string,
	guard: RequestGuard,
	environment: Environment
): Promise<Response> {
	const stored = await environment.MODELS.get(path.slice(1));
	if (!stored) return refuse(404);
	const headers = guard.buildAssetHeaders(origin, 'application/octet-stream');
	headers.set('Content-Length', String(stored.size));
	return new Response(stored.body, { headers });
}

/**
 * Kafel świata: najpierw pamięć podręczna Cloudflare (klucz bez nagłówków przeglądarki), potem ion.
 * Do pamięci trafia odpowiedź bez nagłówków CORS — dopisujemy je dla konkretnej strony.
 */
async function serveIonTile(
	request: Request,
	assetId: string,
	tilePath: string,
	origin: string,
	guard: RequestGuard,
	environment: Environment,
	context: ExecutionContext
): Promise<Response> {
	const allowedAssets = environment.ALLOWED_ION_ASSETS.split(',').map((entry) => entry.trim());
	if (!allowedAssets.includes(assetId) || !isTilePath(tilePath)) return refuse(404);
	const cacheKey = new Request(new URL(request.url).toString(), { method: 'GET' });
	let upstream = await caches.default.match(cacheKey);
	if (!upstream) {
		const fetched = await getIonTileProxy(environment).fetchTile(assetId, tilePath);
		if (!fetched.ok) return refuse(fetched.status === 404 ? 404 : 502);
		const body = await fetched.arrayBuffer();
		const contentType = fetched.headers.get('Content-Type') ?? 'application/octet-stream';
		upstream = new Response(body, {
			headers: { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' }
		});
		context.waitUntil(caches.default.put(cacheKey, upstream.clone()));
	}
	const headers = guard.buildAssetHeaders(
		origin,
		upstream.headers.get('Content-Type') ?? 'application/octet-stream'
	);
	return new Response(upstream.body, { headers });
}

/**
 * Bramka zasobów gry. Wydaje tylko dwa rodzaje plików, wyłącznie aplikacji (ADR 0012, 0013):
 * zaszyfrowane podglądy przedmiotów z R2 (`/g2nk/<świat>/items/<hmac>.bin`) oraz kafle modelu
 * świata pobierane w imieniu aplikacji z Cesium ion (`/ion/<asset>/<plik>`), z tokenem ion
 * trzymanym jako sekret Workera.
 */
export default {
	async fetch(
		request: Request,
		environment: Environment,
		context: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url);
		const guard = new RequestGuard(environment.ALLOWED_ORIGINS);
		const tileMatch = ION_TILE_PATH.exec(url.pathname);
		const isModel = PROTECTED_MODEL_PATH.test(url.pathname);
		if (!tileMatch && !isModel) return refuse(404);

		const admission = await guard.admit(
			request,
			tileMatch ? environment.TILE_REQUESTS : environment.MODEL_REQUESTS
		);
		if (admission instanceof Response) return admission;

		try {
			if (tileMatch) {
				return await serveIonTile(
					request,
					tileMatch[1],
					tileMatch[2],
					admission,
					guard,
					environment,
					context
				);
			}
			return await serveProtectedModel(url.pathname, admission, guard, environment);
		} catch (error) {
			console.error(error);
			return refuse(502);
		}
	}
};
