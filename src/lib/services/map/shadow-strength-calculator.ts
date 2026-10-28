const SHADOW_DARKNESS_AT_FULL_SUN = 0.45;
const NO_SHADOW_DARKNESS = 1;
const SUN_ELEVATION_WITHOUT_SHADOWS = 0.05;
const SUN_ELEVATION_WITH_FULL_SHADOWS = 0.35;

/**
 * Siła cieni zależna od wysokości słońca nad horyzontem (sinus kąta: 0 – horyzont, 1 – zenit).
 * Nocą nie ma słońca, więc cieni nie rysujemy; przy wschodzie i zachodzie cienie narastają płynnie.
 * Wartość to `ShadowMap.darkness` Cesium: 1 oznacza brak przyciemnienia, mniejsza – ciemniejszy cień.
 */
export class ShadowStrengthCalculator {
	areShadowsVisible(sunElevation: number): boolean {
		return sunElevation > SUN_ELEVATION_WITHOUT_SHADOWS;
	}

	calculateDarkness(sunElevation: number): number {
		const progress =
			(sunElevation - SUN_ELEVATION_WITHOUT_SHADOWS) /
			(SUN_ELEVATION_WITH_FULL_SHADOWS - SUN_ELEVATION_WITHOUT_SHADOWS);
		const strength = Math.min(1, Math.max(0, progress));
		return NO_SHADOW_DARKNESS - strength * (NO_SHADOW_DARKNESS - SHADOW_DARKNESS_AT_FULL_SUN);
	}
}
