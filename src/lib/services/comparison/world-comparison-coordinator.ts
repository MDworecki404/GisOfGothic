import type { Anchor } from '#lib/data/types.js';
import type { WorldDefinition } from '#lib/data/world-catalog.js';
import type { AppEventBus } from '#lib/events/app-events.js';

export interface WorldComparisonDisplay {
	showComparisonTileset(tilesetUrl: string, anchor: Anchor): Promise<void>;
	removeComparisonTileset(): void;
	setComparisonSplitPosition(fraction: number): void;
}

export type WorldComparisonStatus = 'inactive' | 'loading' | 'ready' | 'error';

export interface WorldComparisonView {
	status: WorldComparisonStatus;
	primaryWorldName: string | null;
	comparedWorldName: string | null;
	splitFraction: number;
	errorMessage: string | null;
}

export const NO_WORLD_COMPARISON: WorldComparisonView = {
	status: 'inactive',
	primaryWorldName: null,
	comparedWorldName: null,
	splitFraction: 0.5,
	errorMessage: null
};

const MINIMUM_SPLIT_FRACTION = 0.03;
const MAXIMUM_SPLIT_FRACTION = 0.97;

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Porównanie dwóch światów suwakiem podziału ekranu: po lewej świat otwarty w aplikacji, po prawej wybrany drugi.
 * Stan jest tylko sesyjny (nie wchodzi do adresu ani zakładek). Zmiana otwartego świata kończy porównanie,
 * a wynik starszego wczytania drugiego świata jest pomijany.
 */
export class WorldComparisonCoordinator {
	private primaryWorld: WorldDefinition | null = null;
	private primaryLabel: string | null = null;
	private comparedWorld: WorldDefinition | null = null;
	private comparedLabel: string | null = null;
	private status: WorldComparisonStatus = 'inactive';
	private splitFraction = NO_WORLD_COMPARISON.splitFraction;
	private errorMessage: string | null = null;
	private loadGeneration = 0;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => WorldComparisonDisplay | null,
		private readonly loadAnchor: (world: WorldDefinition) => Promise<Anchor>
	) {}

	/**
	 * Nowy otwarty świat kończy trwające porównanie. Podpis (np. „Gothic 2: Noc Kruka — Khorinis”) odróżnia światy
	 * o tej samej nazwie z różnych gier.
	 */
	usePrimaryWorld(world: WorldDefinition, label: string = world.name): void {
		this.primaryWorld = world;
		this.primaryLabel = label;
		this.stop();
	}

	async start(world: WorldDefinition, label: string = world.name): Promise<void> {
		const primary = this.primaryWorld;
		if (!primary || (world.gameId === primary.gameId && world.id === primary.id)) return;
		this.comparedWorld = world;
		this.comparedLabel = label;
		this.status = 'loading';
		this.errorMessage = null;
		this.publish();
		await this.showComparedWorldOnMap();
	}

	/** Po ponownym utworzeniu mapy albo wczytaniu modelu świata drugi świat trzeba położyć na mapie od nowa. */
	async showOnMap(): Promise<void> {
		if (this.comparedWorld === null) return;
		await this.showComparedWorldOnMap();
	}

	stop(): void {
		this.loadGeneration++;
		this.comparedWorld = null;
		this.comparedLabel = null;
		this.status = 'inactive';
		this.errorMessage = null;
		this.getDisplay()?.removeComparisonTileset();
		this.publish();
	}

	setSplitFraction(fraction: number): void {
		this.splitFraction = Math.min(
			MAXIMUM_SPLIT_FRACTION,
			Math.max(MINIMUM_SPLIT_FRACTION, fraction)
		);
		this.getDisplay()?.setComparisonSplitPosition(this.splitFraction);
		this.publish();
	}

	private async showComparedWorldOnMap(): Promise<void> {
		const world = this.comparedWorld;
		const display = this.getDisplay();
		if (!world || !display) return;
		const generation = ++this.loadGeneration;
		try {
			const anchor = await this.loadAnchor(world);
			if (generation !== this.loadGeneration) return;
			await display.showComparisonTileset(world.worldTilesetUrl, anchor);
			if (generation !== this.loadGeneration) return;
			display.setComparisonSplitPosition(this.splitFraction);
			this.status = 'ready';
		} catch (error) {
			if (generation !== this.loadGeneration) return;
			console.error(error);
			this.status = 'error';
			this.errorMessage = describeError(error);
		}
		this.publish();
	}

	private publish(): void {
		this.eventBus.publish({
			type: 'world-comparison-changed',
			comparison: {
				status: this.status,
				primaryWorldName: this.primaryLabel,
				comparedWorldName: this.comparedLabel,
				splitFraction: this.splitFraction,
				errorMessage: this.errorMessage
			}
		});
	}
}
