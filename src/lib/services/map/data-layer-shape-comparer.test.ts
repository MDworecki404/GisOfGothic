import { describe, expect, it } from 'vitest';
import { DataLayerShapeComparer } from './data-layer-shape-comparer.js';

const comparer = new DataLayerShapeComparer();

describe('DataLayerShapeComparer', () => {
	it('kształt się zgadza przy samej zmianie pozycji', () => {
		const previous = [
			{ lon: 1, lat: 1, h: 0, iconId: 'person' },
			{ lon: 2, lat: 2, h: 0, iconId: 'person' }
		] as const;
		const next = [
			{ lon: 5, lat: 5, h: 3, iconId: 'person' },
			{ lon: 6, lat: 6, h: 3, iconId: 'person' }
		] as const;
		expect(comparer.isSameShape(previous, next)).toBe(true);
	});

	it('kształt się nie zgadza przy innej liczbie punktów', () => {
		expect(comparer.isSameShape([{ iconId: 'person' }], [])).toBe(false);
	});

	it('kształt się nie zgadza przy innej ikonie albo kolorze punktu', () => {
		expect(comparer.isSameShape([{ iconId: 'person' }], [{ iconId: 'sword' }])).toBe(false);
		expect(comparer.isSameShape([{ cssColor: '#fff' }], [{ cssColor: '#000' }])).toBe(false);
	});

	it('dwie puste warstwy mają ten sam kształt', () => {
		expect(comparer.isSameShape([], [])).toBe(true);
	});
});
