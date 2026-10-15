export interface WorldDefinition {
	id: string;
	gameId: string;
	name: string;
	dataBaseUrl: string;
	modelsBaseUrl: string;
	worldTilesetIonAssetId: number;
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
	modelsBaseUrl: 'https://gisofgothicmodels.dworecki.dev/g2nk/khorinis/models',
	worldTilesetIonAssetId: 6033666
};

export const worldCatalog = new WorldCatalog(
	[{ id: 'g2nk', name: 'Gothic 2: Noc Kruka', worlds: [KHORINIS] }],
	KHORINIS
);
