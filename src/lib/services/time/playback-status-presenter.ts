import type { RoutinePlaybackView } from './time-coordinator.js';

/** Zamienia stan odtwarzania doby na tekst pod przyciskiem „Odtwórz”. */
export class PlaybackStatusPresenter {
	describeStatus(view: RoutinePlaybackView): string | null {
		if (view.isPreparing) return 'Wyznaczam drogi postaci…';
		if (view.walkingCount === 0 && view.withoutRoadCount === 0) return null;
		return `Na drogach: ${view.walkingCount}, bez drogi: ${view.withoutRoadCount}`;
	}
}
