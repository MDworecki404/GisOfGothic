import { describe, expect, it } from 'vitest';
import { PlaybackStatusPresenter } from './playback-status-presenter.js';
import type { RoutinePlaybackView } from './time-coordinator.js';

const presenter = new PlaybackStatusPresenter();

function createView(overrides: Partial<RoutinePlaybackView>): RoutinePlaybackView {
	return {
		isPlaying: false,
		isPreparing: false,
		speed: 'game',
		walkingCount: 0,
		withoutRoadCount: 0,
		...overrides
	};
}

describe('PlaybackStatusPresenter', () => {
	it('w trakcie przygotowania mówi, że wyznacza drogi', () => {
		expect(presenter.describeStatus(createView({ isPreparing: true }))).toBe(
			'Wyznaczam drogi postaci…'
		);
	});

	it('po zbudowaniu pokazuje, ile postaci idzie drogami, a ile skacze', () => {
		expect(
			presenter.describeStatus(
				createView({ isPlaying: true, walkingCount: 93, withoutRoadCount: 4 })
			)
		).toBe('Na drogach: 93, bez drogi: 4');
	});

	it('przed pierwszym odtwarzaniem nie pokazuje nic', () => {
		expect(presenter.describeStatus(createView({}))).toBeNull();
	});
});
