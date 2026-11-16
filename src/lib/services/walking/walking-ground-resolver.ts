export const EYE_HEIGHT_METRES = 1.7;

const MAXIMUM_RISE_PER_METRE_OF_STEP = 1.5;
const MAXIMUM_RISE_NOISE_METRES = 0.25;
const MAXIMUM_CLIMB_METRES_PER_SECOND = 10;
const MAXIMUM_FALL_METRES_PER_SECOND = 14;

/**
 * Reguły chodzenia po modelu świata. Model nie rozróżnia terenu od dachów i ścian, więc przejście
 * w miejsce, gdzie powierzchnia wznosi się zbyt stromo względem długości kroku (ściana, krawędź
 * dachu), jest blokowane, a spadek jest łagodzony ograniczoną prędkością opadania. Dzięki temu pieszy
 * obchodzi budynki zamiast wchodzić na ich dachy.
 */
export class WalkingGroundResolver {
	/** Czy można zrobić krok na miejsce o podanej wysokości powierzchni (`undefined` – brak kafli, nie wiadomo). */
	canStepTo(
		currentGroundHeightMetres: number,
		targetGroundHeightMetres: number | undefined,
		stepLengthMetres: number
	): boolean {
		if (targetGroundHeightMetres === undefined || !Number.isFinite(targetGroundHeightMetres)) {
			return false;
		}
		const rise = targetGroundHeightMetres - currentGroundHeightMetres;
		return rise <= stepLengthMetres * MAXIMUM_RISE_PER_METRE_OF_STEP + MAXIMUM_RISE_NOISE_METRES;
	}

	/** O ile przesunąć kamerę w pionie, żeby oczy były na wysokości postaci nad gruntem, bez gwałtownych skoków. */
	calculateVerticalChange(
		cameraHeightMetres: number,
		groundHeightMetres: number,
		frameSeconds: number
	): number {
		const wantedChange = groundHeightMetres + EYE_HEIGHT_METRES - cameraHeightMetres;
		const seconds = Math.max(0, frameSeconds);
		return Math.min(
			MAXIMUM_CLIMB_METRES_PER_SECOND * seconds,
			Math.max(-MAXIMUM_FALL_METRES_PER_SECOND * seconds, wantedChange)
		);
	}
}
