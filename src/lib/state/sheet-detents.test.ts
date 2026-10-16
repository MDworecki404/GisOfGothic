import { describe, expect, it } from 'vitest';
import {
	SheetHeightResolver,
	findHigherSheetDetent,
	findLowerSheetDetent,
	findNextSheetDetent
} from './sheet-detents.js';

const resolver = new SheetHeightResolver({ collapsedPixels: 28, halfPixels: 400, fullPixels: 730 });

describe('stany arkusza', () => {
	it('przechodzi cyklicznie: zwinięty → połowa → pełny → zwinięty', () => {
		expect(findNextSheetDetent('collapsed')).toBe('half');
		expect(findNextSheetDetent('half')).toBe('full');
		expect(findNextSheetDetent('full')).toBe('collapsed');
	});

	it('strzałki zatrzymują się na skrajnych stanach', () => {
		expect(findHigherSheetDetent('full')).toBe('full');
		expect(findLowerSheetDetent('collapsed')).toBe('collapsed');
		expect(findHigherSheetDetent('collapsed')).toBe('half');
		expect(findLowerSheetDetent('full')).toBe('half');
	});
});

describe('SheetHeightResolver', () => {
	it('podaje wysokość każdego stanu', () => {
		expect(resolver.findHeightOfDetent('collapsed')).toBe(28);
		expect(resolver.findHeightOfDetent('half')).toBe(400);
		expect(resolver.findHeightOfDetent('full')).toBe(730);
	});

	it('nie pozwala wyjść poza zakres wysokości', () => {
		expect(resolver.clampHeight(5)).toBe(28);
		expect(resolver.clampHeight(900)).toBe(730);
		expect(resolver.clampHeight(300)).toBe(300);
	});

	it('bez rozpędu wybiera najbliższy stan', () => {
		expect(resolver.findDetentAfterRelease(120, 0)).toBe('collapsed');
		expect(resolver.findDetentAfterRelease(380, 0)).toBe('half');
		expect(resolver.findDetentAfterRelease(650, 0)).toBe('full');
	});

	it('szybkie machnięcie w górę i w dół przeskakuje do dalszego stanu', () => {
		expect(resolver.findDetentAfterRelease(300, 2)).toBe('full');
		expect(resolver.findDetentAfterRelease(450, -2)).toBe('collapsed');
	});
});
