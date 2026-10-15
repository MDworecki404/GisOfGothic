export const MINUTES_PER_DAY = 24 * 60;

export interface TimeInterval {
	startMinute: number;
	endMinute: number;
}

const TIME_RANGE_PATTERN = /^(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})$/;

function toMinuteOfDay(hours: string, minutes: string): number {
	return (Number(hours) * 60 + Number(minutes)) % MINUTES_PER_DAY;
}

/** Czyta przedział „07:00–21:30”; przedział kończący się po północy („22:00–07:00”) jest dopuszczalny. */
export function parseTimeInterval(range: string): TimeInterval | null {
	const match = TIME_RANGE_PATTERN.exec(range.trim());
	if (!match) return null;
	return {
		startMinute: toMinuteOfDay(match[1], match[2]),
		endMinute: toMinuteOfDay(match[3], match[4])
	};
}

/** Przedział obejmuje początek, nie obejmuje końca; równy początek i koniec oznacza całą dobę. */
export function isMinuteWithinInterval(minuteOfDay: number, interval: TimeInterval): boolean {
	const { startMinute, endMinute } = interval;
	if (startMinute === endMinute) return true;
	if (startMinute < endMinute) return minuteOfDay >= startMinute && minuteOfDay < endMinute;
	return minuteOfDay >= startMinute || minuteOfDay < endMinute;
}

export function formatMinuteOfDay(minuteOfDay: number): string {
	const normalized = ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
	const hours = Math.floor(normalized / 60);
	const minutes = normalized % 60;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export class DailySchedule<T> {
	private readonly entries: { value: T; intervals: TimeInterval[] }[];

	constructor(values: readonly T[], readTimeRanges: (value: T) => readonly string[]) {
		this.entries = values.map((value) => ({
			value,
			intervals: readTimeRanges(value).flatMap((range) => {
				const interval = parseTimeInterval(range);
				return interval ? [interval] : [];
			})
		}));
	}

	findActiveAt(minuteOfDay: number): { value: T; index: number }[] {
		return this.entries.flatMap((entry, index) =>
			entry.intervals.some((interval) => isMinuteWithinInterval(minuteOfDay, interval))
				? [{ value: entry.value, index }]
				: []
		);
	}
}
