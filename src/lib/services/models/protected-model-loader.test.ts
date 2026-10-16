import { describe, expect, it } from 'vitest';
import { ProtectedModelCodec } from './protected-model-format.js';
import { ProtectedModelLoader } from './protected-model-loader.js';

const KEY = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, index) => index * 3)));
const MODEL_PATH = 'g2nk/khorinis/previews/itpl_perm_herb.glb';
const BASE_URL = 'https://bramka.test/g2nk/khorinis/items';

describe('ProtectedModelLoader', () => {
	it('pobiera plik o nazwie z HMAC ścieżki i odszyfrowuje go', async () => {
		const codec = new ProtectedModelCodec(KEY);
		const fileId = await codec.createFileId(MODEL_PATH);
		const encrypted = await codec.encrypt({
			bounds: { x: 0.3, y: 0.35, z: 0.28 },
			glb: new TextEncoder().encode('glTF')
		});
		const requestedUrls: string[] = [];
		const loader = new ProtectedModelLoader(KEY, async (url) => {
			requestedUrls.push(url);
			return new Response(encrypted);
		});

		const model = await loader.loadModel(BASE_URL, MODEL_PATH);
		expect(requestedUrls).toEqual([`${BASE_URL}/${fileId}.bin`]);
		expect(requestedUrls[0]).not.toContain('itpl_perm_herb');
		expect(model.bounds).toEqual({ x: 0.3, y: 0.35, z: 0.28 });
		expect(new TextDecoder().decode(model.glb)).toBe('glTF');
	});

	it('zgłasza odmowę bramki', async () => {
		const loader = new ProtectedModelLoader(KEY, async () => new Response(null, { status: 403 }));
		await expect(loader.loadModel(BASE_URL, MODEL_PATH)).rejects.toThrow(/403/);
	});
});
