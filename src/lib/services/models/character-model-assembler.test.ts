import { describe, expect, it } from 'vitest';
import { CharacterModelAssembler, type ProtectedModelSource } from './character-model-assembler.js';

const PARTS = {
	body: 'characters/body_a.glb',
	head: 'characters/head_b.glb',
	armor: null,
	weapon: 'previews/itmw_c.glb'
};

function createSource(failingPath: string | null = null): ProtectedModelSource {
	return {
		loadModel: async (_url, modelPath) => {
			if (modelPath === failingPath) throw new Error('HTTP 404');
			return {
				fileId: modelPath,
				bounds: { x: 1, y: 2, z: 1 },
				glb: new Uint8Array(new ArrayBuffer(1))
			};
		}
	};
}

describe('CharacterModelAssembler', () => {
	it('układa ścieżki: ciało, głowa, broń, z przestrzenią świata', () => {
		expect(
			new CharacterModelAssembler(createSource()).listModelPaths(PARTS, 'g2nk/khorinis')
		).toEqual([
			'g2nk/khorinis/characters/body_a.glb',
			'g2nk/khorinis/characters/head_b.glb',
			'g2nk/khorinis/previews/itmw_c.glb'
		]);
	});

	it('pancerz zastępuje ciało', () => {
		const assembler = new CharacterModelAssembler(createSource());
		const paths = assembler.listModelPaths(
			{ ...PARTS, armor: 'characters/armor_d.glb', weapon: null },
			'g2nk/khorinis'
		);
		expect(paths).toEqual([
			'g2nk/khorinis/characters/armor_d.glb',
			'g2nk/khorinis/characters/head_b.glb'
		]);
	});

	it('pomija część, której nie udało się pobrać', async () => {
		const assembler = new CharacterModelAssembler(
			createSource('g2nk/khorinis/previews/itmw_c.glb')
		);
		const loaded = await assembler.loadParts('https://gate/items', PARTS, 'g2nk/khorinis');
		expect(loaded.map((model) => model.fileId)).toEqual([
			'g2nk/khorinis/characters/body_a.glb',
			'g2nk/khorinis/characters/head_b.glb'
		]);
	});

	it('zgłasza błąd, gdy nie pobrano żadnej części', async () => {
		const assembler = new CharacterModelAssembler(
			createSource('g2nk/khorinis/characters/body_a.glb')
		);
		await expect(
			assembler.loadParts(
				'https://gate/items',
				{ ...PARTS, head: null, weapon: null },
				'g2nk/khorinis'
			)
		).rejects.toThrow('żadnej części');
	});
});
