export interface MapOverlays {
	areContoursVisible: boolean;
	isGridVisible: boolean;
}

export type MapOverlayId = keyof MapOverlays;

export const NO_MAP_OVERLAYS: MapOverlays = { areContoursVisible: false, isGridVisible: false };

export function hasAnyMapOverlay(overlays: MapOverlays): boolean {
	return overlays.areContoursVisible || overlays.isGridVisible;
}
