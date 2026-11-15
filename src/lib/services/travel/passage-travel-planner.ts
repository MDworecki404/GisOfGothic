import type { WorldCatalog } from '#lib/data/world-catalog.js';
import type { Anchor } from '#lib/data/types.js';
import type { PassageDestination } from '#lib/services/layers/data-layer-catalog.js';
import { CameraViewCodec, type CameraView } from '#lib/services/bookmarks/camera-view-codec.js';
import { WorldFrame } from '#lib/services/geodesy/world-frame.js';

/** Gdzie nawigować po przejściu: świat docelowy i parametry adresu z widokiem na punkt przybycia. */
export interface PassageTravelTarget {
	gameId: string;
	worldId: string;
	query: string;
}

const VIEW_DISTANCE_METRES = 80;
const VIEW_PITCH_DEGREES = -30;
const VIEW_HEADING_DEGREES = 0;

/**
 * Zamienia przejście między światami na adres świata docelowego z kamerą ustawioną
 * kilkadziesiąt metrów od punktu przybycia i patrzącą na niego z południa.
 */
export class PassageTravelPlanner {
	private readonly cameraViewCodec = new CameraViewCodec();

	constructor(
		private readonly worldCatalog: WorldCatalog,
		private readonly loadWorldAnchor: (gameId: string, worldId: string) => Promise<Anchor>
	) {}

	async planTravel(destination: PassageDestination): Promise<PassageTravelTarget | null> {
		const [gameId, worldId] = destination.toWorld.split('/');
		if (!gameId || !worldId) return null;
		if (!this.worldCatalog.findWorld(gameId, worldId)) return null;
		if (!destination.arrival) return { gameId, worldId, query: '' };
		const anchor = await this.loadWorldAnchor(gameId, worldId);
		const arrival = new WorldFrame(anchor).toLocalPosition(destination.arrival);
		const pitchRadians = (VIEW_PITCH_DEGREES * Math.PI) / 180;
		const view: CameraView = {
			east: arrival.east,
			north: arrival.north - VIEW_DISTANCE_METRES * Math.cos(pitchRadians),
			height: arrival.height - VIEW_DISTANCE_METRES * Math.sin(pitchRadians),
			headingDegrees: VIEW_HEADING_DEGREES,
			pitchDegrees: VIEW_PITCH_DEGREES
		};
		return { gameId, worldId, query: `?widok=${this.cameraViewCodec.serialize(view)}` };
	}
}
