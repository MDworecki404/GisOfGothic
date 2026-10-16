import { version } from '$app/env';
import { assets, immutable } from '$app/manifest';
import { self } from '$app/service-worker';
import { CachingPolicy, type CachingStrategy } from '#lib/services/pwa/caching-policy.js';

const CACHE_PREFIX = 'gis-of-gothic';
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${version}`;
const CESIUM_CACHE = `${CACHE_PREFIX}-cesium-${version}`;
const DATA_CACHE = `${CACHE_PREFIX}-data`;
const APP_SHELL_PATH = '/';
const WORLD_DATA_DIRECTORY = 'data/';

/**
 * Service worker aplikacji: przy instalacji zapisuje powłokę (pliki z hashem, ikony, manifest,
 * stronę startową), a potem obsługuje żądania według `CachingPolicy`. Dopasowanie w pamięci
 * pomija nagłówek `Vary` — moduły JS wysyłają `Origin`, przez który zapisane pliki inaczej by się nie dopasowały. Pamięci z poprzednich
 * wersji są usuwane przy aktywacji; pamięć danych świata przechodzi między wersjami, bo i tak
 * jest odświeżana w tle.
 */
class AppServiceWorker {
	private readonly policy = new CachingPolicy(self.location.origin);

	listen(): void {
		self.addEventListener('install', (event) => {
			event.waitUntil(this.saveAppShell().then(() => self.skipWaiting()));
		});
		self.addEventListener('activate', (event) => {
			event.waitUntil(this.removeOutdatedCaches().then(() => self.clients.claim()));
		});
		self.addEventListener('fetch', (event) => {
			const strategy = this.policy.chooseStrategy(event.request);
			if (strategy === 'network-only') return;
			event.respondWith(this.respond(event.request, strategy));
		});
	}

	private async saveAppShell(): Promise<void> {
		const shellFiles = [
			APP_SHELL_PATH,
			...immutable.map((file) => file.path),
			...assets
				.map((file) => file.path)
				.filter((path) => !path.replace(/^\//, '').startsWith(WORLD_DATA_DIRECTORY))
		];
		const cache = await caches.open(SHELL_CACHE);
		await cache.addAll(shellFiles);
	}

	private async removeOutdatedCaches(): Promise<void> {
		const currentCaches = new Set([SHELL_CACHE, CESIUM_CACHE, DATA_CACHE]);
		const cacheNames = await caches.keys();
		await Promise.all(
			cacheNames
				.filter((name) => name.startsWith(CACHE_PREFIX) && !currentCaches.has(name))
				.map((name) => caches.delete(name))
		);
	}

	private respond(request: Request, strategy: CachingStrategy): Promise<Response> {
		if (strategy === 'network-first-page') return this.respondWithPageOrShell(request);
		if (strategy === 'cache-first') return this.respondFromCacheFirst(request);
		return this.respondStaleWhileRevalidate(request);
	}

	private async respondWithPageOrShell(request: Request): Promise<Response> {
		try {
			return await fetch(request);
		} catch (error) {
			const shell = await caches.match(APP_SHELL_PATH, {
				cacheName: SHELL_CACHE,
				ignoreVary: true
			});
			if (shell) return shell;
			throw error;
		}
	}

	private async respondFromCacheFirst(request: Request): Promise<Response> {
		const cached = await caches.match(request, { ignoreVary: true });
		if (cached) return cached;
		const response = await fetch(request);
		if (response.ok) {
			const cacheName = new URL(request.url).pathname.startsWith('/cesiumStatic/')
				? CESIUM_CACHE
				: SHELL_CACHE;
			await (await caches.open(cacheName)).put(request, response.clone());
		}
		return response;
	}

	private async respondStaleWhileRevalidate(request: Request): Promise<Response> {
		const cache = await caches.open(DATA_CACHE);
		const cached = await cache.match(request, { ignoreVary: true });
		const refreshed = fetch(request).then(async (response) => {
			if (response.ok) await cache.put(request, response.clone());
			return response;
		});
		if (cached) {
			refreshed.catch(() => undefined);
			return cached;
		}
		return refreshed;
	}
}

new AppServiceWorker().listen();
