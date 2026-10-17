import type { AppEventBus } from '#lib/events/app-events.js';
import { FrameRateMonitor } from './frame-rate-monitor.js';
import type { PerformancePreferenceStore } from './performance-preference-store.js';
import {
	findLowerQualityLevel,
	PERFORMANCE_PROFILES,
	type PerformancePreference,
	type PerformanceProfile,
	type QualityLevel
} from './performance-profiles.js';

export interface PerformanceDisplay {
	showPerformanceProfile(profile: PerformanceProfile): void;
}

export const SLOW_FRAME_RATE_THRESHOLD = 24;
export const SLOW_WINDOWS_BEFORE_LOWERING = 2;
const STARTING_AUTOMATIC_LEVEL: QualityLevel = 'high';

/**
 * Dobiera jakość renderowania. Wybór ręczny stosuje się zawsze. W trybie automatycznym start jest
 * na poziomie wysokim, a jakość tylko spada — gdy FPS przez kilka kolejnych okien pomiaru są niskie.
 * Nigdy nie wraca w górę sama, bo po podniesieniu jakości FPS znów by spadły i ustawienia
 * migałyby; powrót do wyższej jakości to decyzja użytkownika.
 */
export class PerformanceCoordinator {
	private preference: PerformancePreference;
	private effectiveLevel: QualityLevel;
	private wasLoweredAutomatically = false;
	private measuredFramesPerSecond: number | null = null;
	private consecutiveSlowWindows = 0;
	private windowsToIgnore = 0;
	private readonly frameRateMonitor = new FrameRateMonitor();

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => PerformanceDisplay | null,
		private readonly preferenceStore: PerformancePreferenceStore
	) {
		this.preference = preferenceStore.load();
		this.effectiveLevel = this.preference === 'auto' ? STARTING_AUTOMATIC_LEVEL : this.preference;
	}

	selectPreference(preference: PerformancePreference): void {
		this.preference = preference;
		this.effectiveLevel = preference === 'auto' ? STARTING_AUTOMATIC_LEVEL : preference;
		this.wasLoweredAutomatically = false;
		this.preferenceStore.save(preference);
		this.applyEffectiveLevel();
	}

	showOnMap(): void {
		this.frameRateMonitor.restartWindow();
		this.getDisplay()?.showPerformanceProfile(PERFORMANCE_PROFILES[this.effectiveLevel]);
		this.publish();
	}

	recordFrame(timestampMilliseconds: number): void {
		const framesPerSecond = this.frameRateMonitor.recordFrame(timestampMilliseconds);
		if (framesPerSecond === null) return;
		if (this.windowsToIgnore > 0) {
			this.windowsToIgnore--;
			return;
		}
		this.measuredFramesPerSecond = Math.round(framesPerSecond);
		if (this.preference === 'auto') this.lowerLevelWhenTooSlow(framesPerSecond);
		this.publish();
	}

	private lowerLevelWhenTooSlow(framesPerSecond: number): void {
		if (framesPerSecond >= SLOW_FRAME_RATE_THRESHOLD) {
			this.consecutiveSlowWindows = 0;
			return;
		}
		this.consecutiveSlowWindows++;
		if (this.consecutiveSlowWindows < SLOW_WINDOWS_BEFORE_LOWERING) return;
		const lowerLevel = findLowerQualityLevel(this.effectiveLevel);
		if (!lowerLevel) return;
		this.effectiveLevel = lowerLevel;
		this.wasLoweredAutomatically = true;
		this.applyEffectiveLevel();
	}

	private applyEffectiveLevel(): void {
		this.consecutiveSlowWindows = 0;
		this.windowsToIgnore = 1;
		this.measuredFramesPerSecond = null;
		this.getDisplay()?.showPerformanceProfile(PERFORMANCE_PROFILES[this.effectiveLevel]);
		this.publish();
	}

	private publish(): void {
		this.eventBus.publish({
			type: 'performance-changed',
			preference: this.preference,
			effectiveLevel: this.effectiveLevel,
			wasLoweredAutomatically: this.wasLoweredAutomatically,
			measuredFramesPerSecond: this.measuredFramesPerSecond
		});
	}
}
