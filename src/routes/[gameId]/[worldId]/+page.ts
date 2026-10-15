import { error } from '@sveltejs/kit';
import { worldCatalog } from '#lib/composition-root.js';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () =>
	worldCatalog.listAllWorlds().map((world) => ({ gameId: world.gameId, worldId: world.id }));

export const load: PageLoad = ({ params }) => {
	const world = worldCatalog.findWorld(params.gameId, params.worldId);
	if (!world) error(404, 'Nie ma takiego świata');
	return { world };
};
