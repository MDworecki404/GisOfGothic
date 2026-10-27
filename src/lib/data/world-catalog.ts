export interface WorldDefinition {
	id: string;
	gameId: string;
	name: string;
	/** Nazwa lokalnego układu współrzędnych w pasku przyrządu, np. „Układ Khorinis 1992”. */
	localCoordinateSystemName: string;
	dataBaseUrl: string;
	modelNamespace: string;
	protectedModelsUrl: string;
	/** Adres `tileset.json` modelu świata w bramce zasobów (kafle z Cesium ion, ADR 0013). */
	worldTilesetUrl: string;
	/**
	 * Adresy `tileset.json` statycznych obiektów świata (voby) w bramce zasobów. Zwykle jeden;
	 * duże światy dzielimy na kilka assetów ion, które aplikacja ładuje razem.
	 */
	staticObjectsTilesetUrls: readonly string[];
	/** `false` w grze bez rozdziałów (Gothic 3): UI ukrywa wybór rozdziału. */
	hasChapters: boolean;
	/** `true`, gdy godziny rutyn są robocze, a nie zapisane w grze (Gothic 3): UI pokazuje je jako orientacyjne. */
	hasApproximateRoutineTimes: boolean;
}

export interface GameDefinition {
	id: string;
	name: string;
	worlds: WorldDefinition[];
}

export class WorldCatalog {
	constructor(
		private readonly games: readonly GameDefinition[],
		private readonly defaultWorld: WorldDefinition
	) {}

	listGames(): readonly GameDefinition[] {
		return this.games;
	}

	listAllWorlds(): WorldDefinition[] {
		return this.games.flatMap((game) => game.worlds);
	}

	findGame(gameId: string): GameDefinition | undefined {
		return this.games.find((game) => game.id === gameId);
	}

	findWorld(gameId: string, worldId: string): WorldDefinition | undefined {
		return this.findGame(gameId)?.worlds.find((world) => world.id === worldId);
	}

	getDefaultWorld(): WorldDefinition {
		return this.defaultWorld;
	}

	buildWorldPath(world: WorldDefinition): string {
		return `/${world.gameId}/${world.id}`;
	}
}

const KHORINIS: WorldDefinition = {
	id: 'khorinis',
	gameId: 'g2nk',
	name: 'Khorinis',
	localCoordinateSystemName: 'Układ Khorinis 1992',
	dataBaseUrl: '/data/g2nk/khorinis',
	modelNamespace: 'g2nk/khorinis',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g2nk/khorinis/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6033666/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6045068/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

const GORNICZA_DOLINA: WorldDefinition = {
	id: 'gornicza-dolina',
	gameId: 'g2nk',
	name: 'Górnicza Dolina',
	localCoordinateSystemName: 'Układ Górniczej Doliny 1992',
	dataBaseUrl: '/data/g2nk/gornicza-dolina',
	modelNamespace: 'g2nk/gornicza-dolina',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g2nk/gornicza-dolina/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6044750/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6045072/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

const JARKENDAR: WorldDefinition = {
	id: 'jarkendar',
	gameId: 'g2nk',
	name: 'Jarkendar',
	localCoordinateSystemName: 'Układ Jarkendaru 1992',
	dataBaseUrl: '/data/g2nk/jarkendar',
	modelNamespace: 'g2nk/jarkendar',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g2nk/jarkendar/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6045115/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6045113/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

const IRDORATH: WorldDefinition = {
	id: 'irdorath',
	gameId: 'g2nk',
	name: 'Irdorath',
	localCoordinateSystemName: 'Układ Irdorath 1992',
	dataBaseUrl: '/data/g2nk/irdorath',
	modelNamespace: 'g2nk/irdorath',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g2nk/irdorath/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6047295/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6047297/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

const KOLONIA: WorldDefinition = {
	id: 'kolonia',
	gameId: 'g1',
	name: 'Kolonia Karna',
	localCoordinateSystemName: 'Układ Kolonii Karnej 1992',
	dataBaseUrl: '/data/g1/kolonia',
	modelNamespace: 'g1/kolonia',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g1/kolonia/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067772/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067768/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

const WOLNA_KOPALNIA: WorldDefinition = {
	id: 'wolna-kopalnia',
	gameId: 'g1',
	name: 'Wolna Kopalnia',
	localCoordinateSystemName: 'Układ Wolnej Kopalni 1992',
	dataBaseUrl: '/data/g1/wolna-kopalnia',
	modelNamespace: 'g1/wolna-kopalnia',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g1/wolna-kopalnia/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067744/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067746/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

const STARA_KOPALNIA: WorldDefinition = {
	id: 'stara-kopalnia',
	gameId: 'g1',
	name: 'Stara Kopalnia',
	localCoordinateSystemName: 'Układ Starej Kopalni 1992',
	dataBaseUrl: '/data/g1/stara-kopalnia',
	modelNamespace: 'g1/stara-kopalnia',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g1/stara-kopalnia/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067752/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067750/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

const CMENTARZYSKO_ORKOW: WorldDefinition = {
	id: 'cmentarzysko-orkow',
	gameId: 'g1',
	name: 'Cmentarzysko orków',
	localCoordinateSystemName: 'Układ Cmentarzyska orków 1992',
	dataBaseUrl: '/data/g1/cmentarzysko-orkow',
	modelNamespace: 'g1/cmentarzysko-orkow',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g1/cmentarzysko-orkow/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067756/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067758/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

const SWIATYNIA_ORKOW: WorldDefinition = {
	id: 'swiatynia-orkow',
	gameId: 'g1',
	name: 'Świątynia orków',
	localCoordinateSystemName: 'Układ Świątyni orków 1992',
	dataBaseUrl: '/data/g1/swiatynia-orkow',
	modelNamespace: 'g1/swiatynia-orkow',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g1/swiatynia-orkow/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067766/tileset.json',
	staticObjectsTilesetUrls: [
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6067764/tileset.json'
	],
	hasChapters: true,
	hasApproximateRoutineTimes: false
};

/**
 * Identyfikatory assetów Cesium ion modelu Myrtany: `world.glb` i części `vobs.glb` (ion odrzucił całość,
 * ADR 0023). Gdy ich brak (`null`), Gothic 3
 * nie trafia do katalogu: bez kafli świat byłby pustą mapą. Wgranie assetów opisuje `docs/dane.md`.
 */
const MYRTANA_ION_ASSETS: { world: number; staticObjects: readonly number[] } | null = {
	world: 6088791,
	staticObjects: []
};

function buildMyrtanaWorlds(): WorldDefinition[] {
	if (!MYRTANA_ION_ASSETS) return [];
	return [
		{
			id: 'myrtana',
			gameId: 'g3',
			name: 'Myrtana',
			localCoordinateSystemName: 'Układ Myrtany 1992',
			dataBaseUrl: '/data/g3/myrtana',
			modelNamespace: 'g3/myrtana',
			protectedModelsUrl:
				'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g3/myrtana/items',
			worldTilesetUrl: `https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/${MYRTANA_ION_ASSETS.world}/tileset.json`,
			staticObjectsTilesetUrls: MYRTANA_ION_ASSETS.staticObjects.map(
				(assetId) =>
					`https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/${assetId}/tileset.json`
			),
			hasChapters: false,
			hasApproximateRoutineTimes: true
		}
	];
}

const GOTHIC_3_WORLDS = buildMyrtanaWorlds();

export const worldCatalog = new WorldCatalog(
	[
		{
			id: 'g1',
			name: 'Gothic',
			worlds: [KOLONIA, WOLNA_KOPALNIA, STARA_KOPALNIA, CMENTARZYSKO_ORKOW, SWIATYNIA_ORKOW]
		},
		{
			id: 'g2nk',
			name: 'Gothic 2: Noc Kruka',
			worlds: [KHORINIS, GORNICZA_DOLINA, JARKENDAR, IRDORATH]
		},
		...(GOTHIC_3_WORLDS.length > 0 ? [{ id: 'g3', name: 'Gothic 3', worlds: GOTHIC_3_WORLDS }] : [])
	],
	KHORINIS
);
