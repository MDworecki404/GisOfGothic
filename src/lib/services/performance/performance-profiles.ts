export const QUALITY_LEVELS = ['low', 'medium', 'high'] as const;

export type QualityLevel = (typeof QUALITY_LEVELS)[number];

export type PerformancePreference = 'auto' | QualityLevel;

export type ShadowQualityLimit = 'off' | 'sharp' | 'soft';

/** Zestaw ustawień renderowania, który MapService stosuje do sceny i tilesetów. */
export interface PerformanceProfile {
	resolutionScale: number;
	maximumScreenSpaceError: number;
	msaaSamples: 1 | 2 | 4;
	isFxaaEnabled: boolean;
	shadowQualityLimit: ShadowQualityLimit;
}

export const PERFORMANCE_PROFILES: Readonly<Record<QualityLevel, PerformanceProfile>> = {
	low: {
		resolutionScale: 0.6,
		maximumScreenSpaceError: 40,
		msaaSamples: 1,
		isFxaaEnabled: false,
		shadowQualityLimit: 'off'
	},
	medium: {
		resolutionScale: 0.8,
		maximumScreenSpaceError: 24,
		msaaSamples: 1,
		isFxaaEnabled: true,
		shadowQualityLimit: 'sharp'
	},
	high: {
		resolutionScale: 1,
		maximumScreenSpaceError: 16,
		msaaSamples: 4,
		isFxaaEnabled: false,
		shadowQualityLimit: 'soft'
	}
};

export const QUALITY_LEVEL_LABELS: Readonly<Record<QualityLevel, string>> = {
	low: 'Niska',
	medium: 'Średnia',
	high: 'Wysoka'
};

export function isQualityLevel(value: unknown): value is QualityLevel {
	return QUALITY_LEVELS.some((level) => level === value);
}

export function isPerformancePreference(value: unknown): value is PerformancePreference {
	return value === 'auto' || isQualityLevel(value);
}

/** Następny niższy poziom jakości; `null`, gdy poziom jest już najniższy. */
export function findLowerQualityLevel(level: QualityLevel): QualityLevel | null {
	const index = QUALITY_LEVELS.indexOf(level);
	return index > 0 ? (QUALITY_LEVELS[index - 1] ?? null) : null;
}
