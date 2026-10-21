export type TravelMode = 'walk' | 'run' | 'sneak' | 'walkWithWeapon';

export interface TravelTimeEstimate {
	mode: TravelMode;
	label: string;
	realSeconds: number;
	gameMinutes: number;
}

interface TravelModeDefinition {
	mode: TravelMode;
	label: string;
	metresPerSecond: number;
}

/**
 * Prędkości bohatera policzone z animacji pętli `.MAN` modelu HUMANS (przesunięcie korzenia szkieletu
 * na cykl podzielone przez jego czas). Wartości dla Gothica II; silnik może je skalować dla postaci
 * o niestandardowym modelu.
 */
const TRAVEL_MODES: readonly TravelModeDefinition[] = [
	{ mode: 'walk', label: 'Marsz', metresPerSecond: 1.43 },
	{ mode: 'run', label: 'Bieg', metresPerSecond: 3.45 },
	{ mode: 'sneak', label: 'Skradanie', metresPerSecond: 0.77 },
	{ mode: 'walkWithWeapon', label: 'Marsz z bronią', metresPerSecond: 1.95 }
];

/** Jedna minuta czasu gry trwa ok. 4 s rzeczywistych (pomiar stoperem w grze). */
const REAL_SECONDS_PER_GAME_MINUTE = 4;

/** Przelicza odległość w poziomie na czas przejścia bohatera: rzeczywisty i w świecie gry. */
export class TravelTimeCalculator {
	estimateTravelTimes(horizontalMetres: number): TravelTimeEstimate[] {
		return TRAVEL_MODES.map(({ mode, label, metresPerSecond }) => {
			const realSeconds = horizontalMetres / metresPerSecond;
			return { mode, label, realSeconds, gameMinutes: realSeconds / REAL_SECONDS_PER_GAME_MINUTE };
		});
	}
}
