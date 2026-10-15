import { redirect } from '@sveltejs/kit';
import { worldCatalog } from '#lib/composition-root.js';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	redirect(307, worldCatalog.buildWorldPath(worldCatalog.getDefaultWorld()));
};
