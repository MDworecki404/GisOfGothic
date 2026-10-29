export type ViewMode = 'view-3d' | 'view-2d';

export interface SliceHeightRange {
	minimumMetres: number;
	maximumMetres: number;
}

export function isViewMode(value: unknown): value is ViewMode {
	return value === 'view-3d' || value === 'view-2d';
}

/** Przycina wysokość cięcia do zakresu świata; wartość nieskończona lub `NaN` oznacza brak cięcia (`null`). */
export function clampSliceHeight(metres: number, range: SliceHeightRange | null): number | null {
	if (!Number.isFinite(metres)) return null;
	if (!range) return metres;
	return Math.min(Math.max(metres, range.minimumMetres), range.maximumMetres);
}
