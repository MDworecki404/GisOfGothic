import type { MovementSpeeds } from '#lib/data/types.js';

export type TravelMode = 'walk' | 'run' | 'sneak' | 'walkWithWeapon';

export interface TravelTimeEstimate {
	mode: TravelMode;
	label: string;
	realSeconds: number;
	gameMinutes: number;
}

/** Etykiety trybów w kolejności pokazywania; prędkości pochodzą z `metadata.json` świata. */
const TRAVEL_MODE_LABELS: readonly { mode: TravelMode; label: string }[] = [
	{ mode: 'walk', label: 'Marsz' },
	{ mode: 'run', label: 'Bieg' },
	{ mode: 'sneak', label: 'Skradanie' },
	{ mode: 'walkWithWeapon', label: 'Marsz z bronią' }
];

/** Jedna minuta czasu gry trwa ok. 4 s rzeczywistych (pomiar stoperem w grze). */
const REAL_SECONDS_PER_GAME_MINUTE = 4;

/** Przelicza odległość w poziomie na czas przejścia bohatera: rzeczywisty i w świecie gry. */
export class TravelTimeCalculator {
	constructor(private readonly movementSpeeds: MovementSpeeds) {}

	estimateTravelTimes(horizontalMetres: number): TravelTimeEstimate[] {
		return TRAVEL_MODE_LABELS.map(({ mode, label }) => {
			const metresPerSecond = this.readSpeed(mode);
			const realSeconds = horizontalMetres / metresPerSecond;
			return { mode, label, realSeconds, gameMinutes: realSeconds / REAL_SECONDS_PER_GAME_MINUTE };
		});
	}

	private readSpeed(mode: TravelMode): number {
		if (mode === 'walk') return this.movementSpeeds.walk;
		if (mode === 'run') return this.movementSpeeds.run;
		if (mode === 'sneak') return this.movementSpeeds.sneak;
		return this.movementSpeeds.walkArmed;
	}
}
