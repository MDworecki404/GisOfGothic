export interface WorldDefinition {
	id: string;
	gameId: string;
	name: string;
	dataBaseUrl: string;
	modelNamespace: string;
	protectedModelsUrl: string;
	/** Adres `tileset.json` modelu świata w bramce zasobów (kafle z Cesium ion, ADR 0013). */
	worldTilesetUrl: string;
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
	dataBaseUrl: '/data/g2nk/khorinis',
	modelNamespace: 'g2nk/khorinis',
	protectedModelsUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g2nk/khorinis/items',
	worldTilesetUrl:
		'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/ion/6033666/tileset.json'
};

export const worldCatalog = new WorldCatalog(
	[{ id: 'g2nk', name: 'Gothic 2: Noc Kruka', worlds: [KHORINIS] }],
	KHORINIS
);
