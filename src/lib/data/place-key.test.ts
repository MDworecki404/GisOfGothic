import { describe, expect, it } from 'vitest';
import { buildPlaceKey, isCollectiblePlace } from './place-key.js';
import type { Place } from './types.js';

const ground: Place = {
	kind: 'ground',
	lon: 0.001,
	lat: 0.002,
	h: 10,
	label: 'na ziemi',
	ref: 'item-695'
};

describe('buildPlaceKey', () => {
	it('łączy rodzaj miejsca z identyfikatorem obiektu', () => {
		expect(buildPlaceKey(ground)).toBe('ground:item-695');
	});

	it('nie zależy od współrzędnych, gdy jest identyfikator', () => {
		expect(buildPlaceKey({ ...ground, lon: 5 })).toBe(buildPlaceKey(ground));
	});

	it('bez identyfikatora używa współrzędnych', () => {
		const { ref, ...withoutRef } = ground;
		void ref;
		expect(buildPlaceKey(withoutRef)).toBe('ground:0.001,0.002');
	});

	it('ten sam obiekt w skrzyni i na ziemi to różne miejsca', () => {
		expect(buildPlaceKey({ ...ground, kind: 'container' })).not.toBe(buildPlaceKey(ground));
	});
});

describe('isCollectiblePlace', () => {
	it('losowy łup Gothica 3 nie jest odhaczalny', () => {
		expect(isCollectiblePlace(ground)).toBe(true);
		expect(isCollectiblePlace({ ...ground, set: 'SET_A' })).toBe(false);
	});
});
