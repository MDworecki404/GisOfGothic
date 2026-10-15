export interface WorldDefinition {
	id: string;
	gameId: string;
	name: string;
	dataBaseUrl: string;
	worldTilesetIonAssetId: number;
}

export const KHORINIS: WorldDefinition = {
	id: 'khorinis',
	gameId: 'g2nk',
	name: 'Khorinis',
	dataBaseUrl: '/data/khorinis',
	worldTilesetIonAssetId: 6033666
};
