import { describe, expect, it } from 'vitest';
import { PreviewOrientationChooser } from './preview-orientation.js';

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
