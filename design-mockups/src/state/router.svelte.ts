export type ViewId =
	'index' | 'atlas' | 'location' | 'character' | 'quests' | 'worlds' | 'system' | 'trails';

export interface Route {
	view: ViewId;
	param: string | null;
}

const VIEW_IDS: readonly ViewId[] = [
	'index',
	'atlas',
	'location',
	'character',
	'quests',
	'worlds',
	'system',
	'trails'
];

function isViewId(value: string): value is ViewId {
	return VIEW_IDS.some((viewId) => viewId === value);
}

function parseHash(hash: string): Route {
	const [viewPart, paramPart] = hash.replace(/^#\/?/, '').split('/');
	if (viewPart && isViewId(viewPart)) {
		return { view: viewPart, param: paramPart ? decodeURIComponent(paramPart) : null };
	}
	return { view: 'index', param: null };
}

export class HashRouter {
	route = $state<Route>(parseHash(window.location.hash));

	constructor() {
		window.addEventListener('hashchange', () => {
			this.route = parseHash(window.location.hash);
		});
	}

	buildHref(view: ViewId, param: string | null = null): string {
		return param ? `#/${view}/${encodeURIComponent(param)}` : `#/${view}`;
	}

	navigate(view: ViewId, param: string | null = null): void {
		window.location.hash = this.buildHref(view, param);
	}
}

export const router = new HashRouter();
