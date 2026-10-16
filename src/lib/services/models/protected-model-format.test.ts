import { describe, expect, it } from 'vitest';
import { ProtectedModelCodec } from './protected-model-format.js';

const KEY = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, index) => index * 7)));
const OTHER_KEY = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, index) => index)));
const glb = new TextEncoder().encode('glTF…udawany plik GLB');
const bounds = { x: 0.8665, y: 0.0906, z: 0.295 };

describe('ProtectedModelCodec', () => {
	it('szyfruje i odszyfrowuje model razem z wymiarami', async () => {
		const codec = new ProtectedModelCodec(KEY);
		const encrypted = await codec.encrypt({ bounds, glb });
		expect(new TextDecoder().decode(encrypted.subarray(0, 4))).toBe('GGM1');
		expect(new TextDecoder().decode(encrypted)).not.toContain('udawany');
		const decrypted = await codec.decrypt(encrypted);
		expect(decrypted.bounds).toEqual(bounds);
		expect(new TextDecoder().decode(decrypted.glb)).toBe('glTF…udawany plik GLB');
	});

	it('nie odszyfruje modelu innym kluczem', async () => {
		const encrypted = await new ProtectedModelCodec(KEY).encrypt({ bounds, glb });
		await expect(new ProtectedModelCodec(OTHER_KEY).decrypt(encrypted)).rejects.toThrow();
	});

	it('nazwa pliku zależy od klucza i ścieżki, a nie zdradza jej', async () => {
		const codec = new ProtectedModelCodec(KEY);
		const fileId = await codec.createFileId('g2nk/khorinis/previews/itpl_perm_herb.glb');
		expect(fileId).toMatch(/^[0-9a-f]{32}$/);
		expect(await codec.createFileId('g2nk/khorinis/previews/itpl_perm_herb.glb')).toBe(fileId);
		expect(
			await new ProtectedModelCodec(OTHER_KEY).createFileId(
				'g2nk/khorinis/previews/itpl_perm_herb.glb'
			)
		).not.toBe(fileId);
	});

	it('odrzuca plik, który nie jest chronionym modelem', async () => {
		await expect(new ProtectedModelCodec(KEY).decrypt(glb)).rejects.toThrow(/chroniony model/);
	});
});
