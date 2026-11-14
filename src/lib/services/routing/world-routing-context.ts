import type { Anchor, WaypointNetwork } from '#lib/data/types.js';
import { LocalProjector } from '#lib/services/analysis/local-projector.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import { RouteFinder } from './route-finder.js';
import { RoutePlanner } from './route-planner.js';
import { WaypointGraph } from './waypoint-graph.js';

/**
 * Wszystko, co trasy potrzebują od jednego świata: leniwie pobraną i zbudowaną sieć dróg
 * oraz przeliczanie współrzędnych miejsc na metry od kotwicy. Sieć pobiera się przy pierwszej
 * trasie, a nieudane pobranie można powtórzyć.
 */
export class WorldRoutingContext {
	private readonly projector: LocalProjector;
	private planning: Promise<RoutePlanner | null> | null = null;

	constructor(
		private readonly downloadNetwork: () => Promise<WaypointNetwork | null>,
		anchor: Anchor
	) {
		this.projector = new LocalProjector(anchor);
	}

	loadRoutePlanner(): Promise<RoutePlanner | null> {
		this.planning ??= this.buildRoutePlanner().catch((error: unknown) => {
			this.planning = null;
			throw error;
		});
		return this.planning;
	}

	readProjector(): LocalProjector {
		return this.projector;
	}

	convertToWorldPosition(lon: number, lat: number, height: number): WorldPosition {
		return { ...this.projector.projectToLocalPoint(lon, lat, height), lon, lat };
	}

	private async buildRoutePlanner(): Promise<RoutePlanner | null> {
		const network = await this.downloadNetwork();
		if (network === null) return null;
		return new RoutePlanner(new WaypointGraph(network, this.projector), new RouteFinder());
	}
}
