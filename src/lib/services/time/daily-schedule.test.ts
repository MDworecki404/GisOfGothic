import { describe, expect, it } from 'vitest';
import {
	DailySchedule,
	formatMinuteOfDay,
	isMinuteWithinInterval,
	parseTimeInterval
} from './daily-schedule.js';

const at = (time: string): number => {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
};

describe('rozkład dnia', () => {
	it('czyta przedział godzin z półpauzą', () => {
		expect(parseTimeInterval('07:00–21:30')).toEqual({ startMinute: 420, endMinute: 1290 });
		expect(parseTimeInterval('cały dzień')).toBeNull();
	});

	it('obejmuje początek, ale nie koniec przedziału', () => {
		const interval = { startMinute: at('07:00'), endMinute: at('07:10') };
		expect(isMinuteWithinInterval(at('07:00'), interval)).toBe(true);
		expect(isMinuteWithinInterval(at('07:10'), interval)).toBe(false);
	});

	it('obsługuje przedział przez północ', () => {
		const night = { startMinute: at('22:00'), endMinute: at('07:00') };
		expect(isMinuteWithinInterval(at('23:30'), night)).toBe(true);
		expect(isMinuteWithinInterval(at('03:00'), night)).toBe(true);
		expect(isMinuteWithinInterval(at('12:00'), night)).toBe(false);
	});

	it('wybiera miejsca aktywne o danej godzinie', () => {
		const schedule = new DailySchedule(
			[
				{ name: 'łóżko', times: ['22:00–07:00'] },
				{ name: 'palenisko', times: ['07:00–07:10', '07:20–07:30'] },
				{ name: 'kowadło', times: ['07:10–07:20'] }
			],
			(place) => place.times
		);
		const namesAt = (time: string) =>
			schedule.findActiveAt(at(time)).map((active) => active.value.name);
		expect(namesAt('02:00')).toEqual(['łóżko']);
		expect(namesAt('07:15')).toEqual(['kowadło']);
		expect(namesAt('07:25')).toEqual(['palenisko']);
	});

	it('formatuje minutę doby', () => {
		expect(formatMinuteOfDay(450)).toBe('07:30');
		expect(formatMinuteOfDay(-30)).toBe('23:30');
	});
});
