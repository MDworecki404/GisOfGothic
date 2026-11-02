import type { Anchor } from '#lib/data/types.js';
import type { WorldDefinition } from '#lib/data/world-catalog.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import { REFERENCE_WORLD_KEY } from '#lib/services/map/size-world-keys.js';
import type { WorldExtent } from '#lib/services/map/world-extent-reader.js';
import type { SizeWorldPlacement } from '#lib/services/map/world-placement-calculator.js';

export interface WorldSizeDisplay {
	showSizeWorld(
		key: string,
		tilesetUrl: string,
		anchor: Anchor,
		tintCssColor: string
	): Promise<WorldExtent | null>;
	removeSizeWorld(key: string): void;
	placeSizeWorld(key: string, placement: SizeWorldPlacement): void;
	highlightSizeWorld(key: string | null): void;
	selectSizeWorld(key: string | null): void;
	setPrimaryWorldGhost(tintCssColor: string | null): void;
	clearSizeWorlds(): void;
	readPrimaryWorldExtent(): WorldExtent | null;
}

export type SizeWorldStatus = 'loading' | 'ready' | 'error';

export interface SizeWorldView {
	key: string;
	label: string;
	color: string;
	status: SizeWorldStatus;
	errorMessage: string | null;
	widthMetres: number | null;
	depthMetres: number | null;
	/** Środek obrysu w układzie gry, zanim świat przesunięto; `null`, dopóki model się wczytuje. */
	nativeCenter: { east: number; north: number; up: number } | null;
	placement: SizeWorldPlacement;
	isHighlighted: boolean;
}

export interface SizeReferenceView {
	label: string;
	color: string;
	isHighlighted: boolean;
	widthMetres: number;
	depthMetres: number;
}

export interface WorldSizeView {
	isActive: boolean;
	/** Świat z gizmem; `null`, gdy żaden nie jest wybrany. */
	selectedKey: string | null;
	reference: SizeReferenceView | null;
	worlds: SizeWorldView[];
	isLimitReached: boolean;
}

export const NO_WORLD_SIZE_COMPARISON: WorldSizeView = {
	isActive: false,
	selectedKey: null,
	reference: null,
	worlds: [],
	isLimitReached: false
};

interface SizeWorldState {
	key: string;
	world: WorldDefinition;
	label: string;
	color: string;
	status: SizeWorldStatus;
	errorMessage: string | null;
	extent: WorldExtent | null;
	placement: SizeWorldPlacement;
	defaultPlacement: SizeWorldPlacement;
}

/** Barwy światów: nasycone, daleko od siebie na kole barw i jasne na ciemnym tle mapy. */
export const SIZE_WORLD_COLORS: readonly string[] = [
	'#ff5a3c',
	'#2ec4ff',
	'#ffd23f',
	'#b266ff',
	'#4dff88',
	'#ff5cc8'
];

/** Otwarty świat jest widmem w jasnej, prawie białej barwie, żeby odróżniał się od barwnych światów. */
export const REFERENCE_WORLD_COLOR = '#f2efe6';

const NATIVE: SizeWorldPlacement = { east: 0, north: 0, up: 0, headingDegrees: 0 };

export function buildSizeWorldKey(world: WorldDefinition): string {
	return `${world.gameId}/${world.id}`;
}

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Narzędzie Rozmiary: wybrane światy pokazują się na mapie obok otwartego (który też staje się półprzezroczystym widmem),
 * żeby porównać ich wielkość. Każdy świat można przesunąć, podnieść i obrócić polami liczbowymi, przeciągnięciem
 * albo gizmem wybranego świata. Nowy świat staje środkiem obrysu w środku otwartego (porównanie „współśrodkowe”),
 * a „Zresetuj” wraca do tej pozycji. Stan jest sesyjny i znika po zamknięciu narzędzia albo zmianie otwartego świata.
 */
export class WorldSizeCoordinator {
	private isActive = false;
	private primaryWorld: WorldDefinition | null = null;
	private primaryLabel: string | null = null;
	private reference: Pick<SizeReferenceView, 'label' | 'widthMetres' | 'depthMetres'> | null = null;
	private referenceExtent: WorldExtent | null = null;
	private worlds: SizeWorldState[] = [];
	private selectedKey: string | null = null;
	private listHighlightedKey: string | null = null;
	private mapHoveredKey: string | null = null;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => WorldSizeDisplay | null,
		private readonly loadAnchor: (world: WorldDefinition) => Promise<Anchor>
	) {}

	usePrimaryWorld(world: WorldDefinition, label: string = world.name): void {
		this.primaryWorld = world;
		this.primaryLabel = label;
		this.clearWorlds();
		this.reference = null;
		this.referenceExtent = null;
		this.publish();
	}

	activate(): void {
		this.isActive = true;
		this.showOnMap();
		this.refreshReference();
	}

	deactivate(): void {
		this.isActive = false;
		this.clearWorlds();
		this.getDisplay()?.setPrimaryWorldGhost(null);
		this.publish();
	}

	/** Po utworzeniu mapy (albo włączeniu narzędzia) otwarty świat trzeba zamienić w widmo. */
	showOnMap(): void {
		if (this.isActive) this.getDisplay()?.setPrimaryWorldGhost(REFERENCE_WORLD_COLOR);
	}

	/** Po wczytaniu modelu otwartego świata znamy jego obrys, względem którego ustawiamy pozostałe. */
	refreshReference(): void {
		const extent = this.getDisplay()?.readPrimaryWorldExtent() ?? null;
		this.referenceExtent = extent;
		this.reference =
			extent && this.primaryLabel
				? {
						label: this.primaryLabel,
						widthMetres: extent.widthMetres,
						depthMetres: extent.depthMetres
					}
				: null;
		this.publish();
	}

	async toggleWorld(world: WorldDefinition, label: string = world.name): Promise<void> {
		if (!this.isActive || this.isSamePrimaryWorld(world)) return;
		const key = buildSizeWorldKey(world);
		if (this.worlds.some((state) => state.key === key)) {
			this.removeWorld(key);
			return;
		}
		if (this.worlds.length >= SIZE_WORLD_COLORS.length) return;
		const state: SizeWorldState = {
			key,
			world,
			label,
			color: this.pickFreeColor(),
			status: 'loading',
			errorMessage: null,
			extent: null,
			placement: NATIVE,
			defaultPlacement: NATIVE
		};
		this.worlds = [...this.worlds, state];
		this.selectedKey = key;
		this.publish();
		await this.loadWorld(state);
	}

	setPlacement(key: string, change: Partial<SizeWorldPlacement>): void {
		this.updateState(key, (state) => ({ ...state, placement: { ...state.placement, ...change } }));
	}

	resetPlacement(key: string): void {
		this.updateState(key, (state) => ({ ...state, placement: state.defaultPlacement }));
	}

	/** Wybiera świat, który ma mieć gizmo (z listy albo kliknięciem na mapie). */
	select(key: string | null): void {
		if (key !== null && !this.worlds.some((state) => state.key === key)) return;
		this.selectedKey = key;
		this.getDisplay()?.selectSizeWorld(key);
		this.publish();
	}

	/** Podświetlenie z listy (najechanie na wiersz świata); `null` zdejmuje je. */
	highlight(key: string | null): void {
		this.listHighlightedKey = key;
		this.getDisplay()?.highlightSizeWorld(key);
		this.publish();
	}

	reactToMapHover(key: string | null): void {
		this.mapHoveredKey = key;
		this.publish();
	}

	/** Przeciągnięcie świata albo uchwytu gizma: warstwa mapy już go ustawiła, więc zapisujemy tylko nową pozycję. */
	reactToMapPlacement(key: string, placement: SizeWorldPlacement): void {
		this.updateState(key, (state) => ({ ...state, placement }), false);
	}

	private isSamePrimaryWorld(world: WorldDefinition): boolean {
		return world.gameId === this.primaryWorld?.gameId && world.id === this.primaryWorld.id;
	}

	private pickFreeColor(): string {
		const used = new Set(this.worlds.map((state) => state.color));
		return SIZE_WORLD_COLORS.find((color) => !used.has(color)) ?? SIZE_WORLD_COLORS[0];
	}

	private async loadWorld(state: SizeWorldState): Promise<void> {
		const display = this.getDisplay();
		if (!display) return;
		try {
			const anchor = await this.loadAnchor(state.world);
			if (!this.isStillSelected(state.key)) return;
			const extent = await display.showSizeWorld(
				state.key,
				state.world.worldTilesetUrl,
				anchor,
				state.color
			);
			if (!extent || !this.isStillSelected(state.key)) return;
			const defaultPlacement = this.buildCenteredPlacement(extent);
			display.placeSizeWorld(state.key, defaultPlacement);
			if (this.selectedKey === state.key) display.selectSizeWorld(state.key);
			this.updateState(
				state.key,
				(current) => ({
					...current,
					status: 'ready',
					extent,
					placement: defaultPlacement,
					defaultPlacement
				}),
				false
			);
		} catch (error) {
			if (!this.isStillSelected(state.key)) return;
			console.error(error);
			this.updateState(
				state.key,
				(current) => ({ ...current, status: 'error', errorMessage: describeError(error) }),
				false
			);
		}
	}

	private buildCenteredPlacement(extent: WorldExtent): SizeWorldPlacement {
		const reference = this.referenceExtent;
		if (!reference) return NATIVE;
		return {
			east: reference.centerEast - extent.centerEast,
			north: reference.centerNorth - extent.centerNorth,
			up: reference.centerUp - extent.centerUp,
			headingDegrees: 0
		};
	}

	private isStillSelected(key: string): boolean {
		return this.isActive && this.worlds.some((state) => state.key === key);
	}

	private removeWorld(key: string): void {
		this.worlds = this.worlds.filter((state) => state.key !== key);
		this.getDisplay()?.removeSizeWorld(key);
		if (this.selectedKey === key) {
			this.selectedKey = this.worlds.at(-1)?.key ?? null;
			this.getDisplay()?.selectSizeWorld(this.selectedKey);
		}
		this.publish();
	}

	private clearWorlds(): void {
		this.worlds = [];
		this.selectedKey = null;
		this.listHighlightedKey = null;
		this.mapHoveredKey = null;
		this.getDisplay()?.clearSizeWorlds();
	}

	private updateState(
		key: string,
		change: (state: SizeWorldState) => SizeWorldState,
		shouldPlaceOnMap = true
	): void {
		this.worlds = this.worlds.map((state) => (state.key === key ? change(state) : state));
		const updated = this.worlds.find((state) => state.key === key);
		if (updated && shouldPlaceOnMap) this.getDisplay()?.placeSizeWorld(key, updated.placement);
		this.publish();
	}

	private publish(): void {
		const emphasizedKey = this.listHighlightedKey ?? this.mapHoveredKey;
		this.eventBus.publish({
			type: 'world-size-changed',
			sizes: {
				isActive: this.isActive,
				selectedKey: this.selectedKey,
				reference: this.reference
					? {
							...this.reference,
							color: REFERENCE_WORLD_COLOR,
							isHighlighted: emphasizedKey === REFERENCE_WORLD_KEY
						}
					: null,
				worlds: this.worlds.map((state) => ({
					key: state.key,
					label: state.label,
					color: state.color,
					status: state.status,
					errorMessage: state.errorMessage,
					widthMetres: state.extent?.widthMetres ?? null,
					depthMetres: state.extent?.depthMetres ?? null,
					nativeCenter: state.extent
						? {
								east: state.extent.centerEast,
								north: state.extent.centerNorth,
								up: state.extent.centerUp
							}
						: null,
					placement: state.placement,
					isHighlighted: state.key === emphasizedKey
				})),
				isLimitReached: this.worlds.length >= SIZE_WORLD_COLORS.length
			}
		});
	}
}
