const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

/** Zapisuje czas po polsku w dwóch najważniejszych jednostkach, np. „3 min 20 s” albo „1 h 40 min”. */
export class DurationFormatter {
	formatRealTime(totalSeconds: number): string {
		const roundedSeconds = Math.round(totalSeconds);
		const minutes = Math.floor(roundedSeconds / SECONDS_PER_MINUTE);
		const seconds = roundedSeconds % SECONDS_PER_MINUTE;
		if (minutes === 0) return `${seconds} s`;
		if (minutes >= MINUTES_PER_HOUR)
			return this.formatGameTime(roundedSeconds / SECONDS_PER_MINUTE);
		return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} s`;
	}

	formatGameTime(totalMinutes: number): string {
		const roundedMinutes = Math.round(totalMinutes);
		const hours = Math.floor(roundedMinutes / MINUTES_PER_HOUR);
		const minutes = roundedMinutes % MINUTES_PER_HOUR;
		if (hours === 0) return `${minutes} min`;
		return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
	}
}
