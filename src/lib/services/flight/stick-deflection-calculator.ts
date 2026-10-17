import type { StickDeflection } from './flight-input.js';

const DEAD_ZONE_FRACTION = 0.12;

/**
 * Zamienia przesunięcie gałki joysticka od środka (w pikselach ekranu, oś Y rośnie w dół)
 * na wychylenie jednostkowe. Wychylenie ma długość co najwyżej 1, a mała strefa martwa
 * w środku zapobiega dryfowaniu od drżenia palca.
 */
export class StickDeflectionCalculator {
	calculate(offsetXPixels: number, offsetYPixels: number, radiusPixels: number): StickDeflection {
		if (!(radiusPixels > 0)) return { x: 0, y: 0 };
		const length = Math.hypot(offsetXPixels, offsetYPixels);
		const fraction = Math.min(length / radiusPixels, 1);
		if (fraction < DEAD_ZONE_FRACTION) return { x: 0, y: 0 };
		const strength = (fraction - DEAD_ZONE_FRACTION) / (1 - DEAD_ZONE_FRACTION);
		return {
			x: (offsetXPixels / length) * strength,
			y: (-offsetYPixels / length) * strength
		};
	}
}
