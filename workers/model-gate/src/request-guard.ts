export interface RequestRateLimiter {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

export function refuse(status: number): Response {
	return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
}

/**
 * Wpuszcza tylko żądania `fetch` z dozwolonych stron aplikacji: nagłówek `Origin` z listy,
 * bez nawigacji wprost w przeglądarce (`Sec-Fetch-Mode`), z limitem żądań na adres IP.
 * Zwraca dozwolony `Origin` albo odpowiedź odmowną.
 */
export class RequestGuard {
	private readonly allowedOrigins: Set<string>;

	constructor(allowedOrigins: string) {
		this.allowedOrigins = new Set(allowedOrigins.split(',').map((entry) => entry.trim()));
	}

	async admit(request: Request, limiter: RequestRateLimiter): Promise<string | Response> {
		if (request.method !== 'GET') return refuse(405);
		const origin = request.headers.get('Origin') ?? '';
		if (!this.allowedOrigins.has(origin)) return refuse(403);
		const fetchMode = request.headers.get('Sec-Fetch-Mode');
		if (fetchMode !== null && fetchMode !== 'cors') return refuse(403);
		const client = request.headers.get('CF-Connecting-IP') ?? 'nieznany';
		const { success } = await limiter.limit({ key: client });
		return success ? origin : refuse(429);
	}

	buildAssetHeaders(origin: string, contentType: string): Headers {
		return new Headers({
			'Content-Type': contentType,
			'Cache-Control': 'private, max-age=86400',
			'Access-Control-Allow-Origin': origin,
			Vary: 'Origin',
			'X-Content-Type-Options': 'nosniff',
			'X-Robots-Tag': 'noindex, nofollow'
		});
	}
}
