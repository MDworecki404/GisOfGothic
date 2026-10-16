import { describe, expect, it } from 'vitest';
import { ItemModelCatalog, parsePreviewIndex } from './item-model-catalog.js';
import { PreviewOrientationChooser } from './preview-orientation.js';

const previewIndex = {
	frame: 'glTF (east, up, -north) in metres',
	previews: [
		{ file: 'itmw_030_2h_kdf_hammer_01.glb', bounds_m: { x: 0.8665, y: 0.0906, z: 0.295 } },
		{ file: 'itar_kdf_h.glb', bounds_m: { x: 0.9862, y: 0.1941, z: 1.1606 } },
		{ file: 'itpl_perm_herb.glb', bounds_m: { x: 0.3, y: 0.35, z: 0.28 } }
	]
};

describe('ItemModelCatalog', () => {
	it('czyta wymiary modeli ze spisu podglądów', () => {
		expect(parsePreviewIndex(previewIndex).get('itar_kdf_h.glb')).toEqual({
			x: 0.9862,
			y: 0.1941,
			z: 1.1606
		});
	});

	it('pobiera spis z katalogu modelu tylko raz', async () => {
		const requestedUrls: string[] = [];
		const catalog = new ItemModelCatalog(async (url) => {
			requestedUrls.push(url);
			return new Response(JSON.stringify(previewIndex));
		});
		const base = 'https://modele.test/g2nk/khorinis/models/previews';
		expect(await catalog.findBounds(`${base}/itpl_perm_herb.glb`)).toMatchObject({ y: 0.35 });
		expect(await catalog.findBounds(`${base}/brak.glb`)).toBeNull();
		expect(requestedUrls).toEqual([`${base}/index.json`]);
	});

	it('bez spisu zwraca brak wymiarów zamiast błędu', async () => {
		const catalog = new ItemModelCatalog(async () => new Response('', { status: 404 }));
		expect(await catalog.findBounds('https://modele.test/previews/a.glb')).toBeNull();
	});
});

describe('PreviewOrientationChooser', () => {
	const chooser = new PreviewOrientationChooser();

	it('stawia długą, leżącą broń pionowo na jej osi długości', () => {
		expect(chooser.chooseOrientation({ x: 0.8665, y: 0.0906, z: 0.295 })).toBe(
			'stand-on-east-axis'
		);
		expect(chooser.chooseOrientation({ x: 0.1, y: 0.05, z: 0.9 })).toBe('stand-on-north-axis');
	});

	it('płaski, ale szeroki przedmiot (pancerz, amulet) pokazuje leżący z góry', () => {
		expect(chooser.chooseOrientation({ x: 0.9862, y: 0.1941, z: 1.1606 })).toBe('view-from-above');
		expect(chooser.chooseOrientation({ x: 0.1834, y: 0.027, z: 0.1515 })).toBe('view-from-above');
	});

	it('zostawia przedmioty o naturalnych proporcjach i brak wymiarów', () => {
		expect(chooser.chooseOrientation({ x: 0.3, y: 0.35, z: 0.28 })).toBe('as-saved');
		expect(chooser.chooseOrientation(null)).toBe('as-saved');
	});
});
