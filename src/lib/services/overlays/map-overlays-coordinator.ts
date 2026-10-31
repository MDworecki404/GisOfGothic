import type { AppEventBus } from '#lib/events/app-events.js';
import { NO_MAP_OVERLAYS, type MapOverlayId, type MapOverlays } from './map-overlays.js';

export interface MapOverlaysDisplay {
	showMapOverlays(overlays: MapOverlays): void;
}

/** Trzyma, które nakładki (poziomice, siatka) są włączone na modelu świata, i pokazuje je na mapie, gdy ta jest gotowa. */
export class MapOverlaysCoordinator {
	private overlays: MapOverlays = NO_MAP_OVERLAYS;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => MapOverlaysDisplay | null
	) {}

	get currentOverlays(): MapOverlays {
		return this.overlays;
	}

	toggleOverlay(overlayId: MapOverlayId): void {
		this.overlays = { ...this.overlays, [overlayId]: !this.overlays[overlayId] };
		this.getDisplay()?.showMapOverlays(this.overlays);
		this.eventBus.publish({ type: 'map-overlays-changed', overlays: this.overlays });
	}

	showOnMap(): void {
		this.getDisplay()?.showMapOverlays(this.overlays);
	}
}
