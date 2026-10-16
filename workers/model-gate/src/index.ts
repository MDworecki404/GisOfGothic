interface StoredObject {
	body: ReadableStream;
	size: number;
}

interface ModelBucket {
	get(key: string): Promise<StoredObject | null>;
}

interface RequestRateLimiter {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

interface Environment {
	MODELS: ModelBucket;
	MODEL_REQUESTS: RequestRateLimiter;
	ALLOWED_ORIGINS: string;
}

const PROTECTED_MODEL_PATH = /^\/g2nk\/[a-z0-9_-]+\/items\/[0-9a-f]{32}\.bin$/;

function refuse(status: number): Response {
	return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Bramka do chronionych modeli przedmiotów w R2. Wydaje wyłącznie zaszyfrowane pliki o nazwach
 * z HMAC (`/g2nk/<świat>/items/<32 znaki hex>.bin`), tylko żądaniom `fetch` z dozwolonych stron
 * aplikacji (nagłówek `Origin`, brak nawigacji wprost w przeglądarce) i z limitem żądań na adres IP.
 * Bucket nie ma publicznego adresu, więc spisy, tekstury i modele świata nie są osiągalne.
 */
export default {
	async fetch(request: Request, environment: Environment): Promise<Response> {
		if (request.method !== 'GET') return refuse(405);
		const url = new URL(request.url);
		if (!PROTECTED_MODEL_PATH.test(url.pathname)) return refuse(404);

		const origin = request.headers.get('Origin') ?? '';
		const allowedOrigins = environment.ALLOWED_ORIGINS.split(',').map((entry) => entry.trim());
		if (!allowedOrigins.includes(origin)) return refuse(403);
		const fetchMode = request.headers.get('Sec-Fetch-Mode');
		if (fetchMode !== null && fetchMode !== 'cors') return refuse(403);

		const client = request.headers.get('CF-Connecting-IP') ?? 'nieznany';
		const { success } = await environment.MODEL_REQUESTS.limit({ key: client });
		if (!success) return refuse(429);

		const stored = await environment.MODELS.get(url.pathname.slice(1));
		if (!stored) return refuse(404);
		return new Response(stored.body, {
			headers: {
				'Content-Type': 'application/octet-stream',
				'Content-Length': String(stored.size),
				'Cache-Control': 'private, max-age=86400',
				'Access-Control-Allow-Origin': origin,
				Vary: 'Origin',
				'X-Content-Type-Options': 'nosniff',
				'X-Robots-Tag': 'noindex, nofollow'
			}
		});
	}
};
