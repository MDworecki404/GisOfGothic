import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { PerformanceCoordinator, type PerformanceDisplay } from './performance-coordinator.js';
import { PerformancePreferenceStore } from './performance-preference-store.js';
import { PERFORMANCE_PROFILES, type PerformanceProfile } from './performance-profiles.js';

function createMemoryStorage(initial: string | null = null) {
	let value = initial;
	return {
		getItem: () => value,
		setItem: (_key: string, next: string) => {
			value = next;
		}
	};
}

function setUp(storedPreference: string | null = null) {
	const eventBus = new EventBus<AppEvent>();
	const shownProfiles: PerformanceProfile[] = [];
	const display: PerformanceDisplay = {
		showPerformanceProfile: (profile) => shownProfiles.push(profile)
	};
	const storage = createMemoryStorage(storedPreference);
	const coordinator = new PerformanceCoordinator(
		eventBus,
		() => display,
		new PerformancePreferenceStore(storage)
	);
	return { coordinator, shownProfiles, storage };
}

/** Odtwarza `seconds` sekund renderowania z zadaną liczbą klatek na sekundę, od chwili `startMilliseconds`. */
function renderFor(
	coordinator: PerformanceCoordinator,
	startMilliseconds: number,
	seconds: number,
	framesPerSecond: number
): number {
	const step = 1000 / framesPerSecond;
	const end = startMilliseconds + seconds * 1000;
	let time = startMilliseconds;
	while (time <= end) {
		coordinator.recordFrame(time);
		time += step;
	}
	return time;
}

describe('PerformanceCoordinator', () => {
	it('w trybie automatycznym startuje z wysoką jakością', () => {
		const { coordinator, shownProfiles } = setUp();
		coordinator.showOnMap();
		expect(shownProfiles.at(-1)).toBe(PERFORMANCE_PROFILES.high);
	});

	it('obniża jakość, gdy FPS są niskie przez kilka okien pomiaru', () => {
		const { coordinator, shownProfiles } = setUp();
		coordinator.showOnMap();
		renderFor(coordinator, 0, 30, 10);
		expect(shownProfiles.at(-1)).toBe(PERFORMANCE_PROFILES.low);
	});

	it('nie obniża jakości przy płynnym działaniu', () => {
		const { coordinator, shownProfiles } = setUp();
		coordinator.showOnMap();
		renderFor(coordinator, 0, 60, 60);
		expect(shownProfiles).toHaveLength(1);
	});

	it('nigdy nie podnosi jakości sam, nawet gdy FPS się poprawią', () => {
		const { coordinator, shownProfiles } = setUp();
		coordinator.showOnMap();
		const afterSlowPhase = renderFor(coordinator, 0, 14, 10);
		renderFor(coordinator, afterSlowPhase, 60, 60);
		expect(shownProfiles.at(-1)).toBe(PERFORMANCE_PROFILES.medium);
	});

	it('wybór ręczny nie jest zmieniany przy niskich FPS i jest zapamiętany', () => {
		const { coordinator, shownProfiles, storage } = setUp();
		coordinator.showOnMap();
		coordinator.selectPreference('high');
		renderFor(coordinator, 0, 60, 10);
		expect(shownProfiles.at(-1)).toBe(PERFORMANCE_PROFILES.high);
		expect(storage.getItem()).toBe('high');
	});

	it('odczytuje zapisany wybór ręczny', () => {
		const { coordinator, shownProfiles } = setUp('low');
		coordinator.showOnMap();
		expect(shownProfiles.at(-1)).toBe(PERFORMANCE_PROFILES.low);
	});

	it('ignoruje śmieci w pamięci i wraca do trybu automatycznego', () => {
		const { coordinator, shownProfiles } = setUp('ultra');
		coordinator.showOnMap();
		expect(shownProfiles.at(-1)).toBe(PERFORMANCE_PROFILES.high);
	});
});
