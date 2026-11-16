import { describe, expect, it } from 'vitest';
import { PointerClickDetector } from './pointer-click-detector.js';

describe('PointerClickDetector', () => {
	it('uznaje szybkie puszczenie w tym samym miejscu za kliknięcie', () => {
		const detector = new PointerClickDetector();
		detector.press(100, 100, 0);
		detector.move(102, 101);
		expect(detector.release(120)).toBe(true);
	});

	it('nie uznaje przeciągnięcia za kliknięcie', () => {
		const detector = new PointerClickDetector();
		detector.press(100, 100, 0);
		detector.move(140, 100);
		detector.move(101, 100);
		expect(detector.release(100)).toBe(false);
	});

	it('nie uznaje długiego przytrzymania za kliknięcie', () => {
		const detector = new PointerClickDetector();
		detector.press(100, 100, 0);
		expect(detector.release(2000)).toBe(false);
	});

	it('nie uznaje puszczenia bez wciśnięcia ani po anulowaniu za kliknięcie', () => {
		const detector = new PointerClickDetector();
		expect(detector.release(10)).toBe(false);
		detector.press(0, 0, 0);
		detector.cancel();
		expect(detector.release(10)).toBe(false);
	});

	it('każde kolejne wciśnięcie zaczyna nowy gest', () => {
		const detector = new PointerClickDetector();
		detector.press(0, 0, 0);
		detector.move(80, 0);
		detector.release(50);
		detector.press(10, 10, 1000);
		expect(detector.release(1050)).toBe(true);
	});
});
