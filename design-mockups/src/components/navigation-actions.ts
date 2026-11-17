import { mockupState } from '../state/mockup-state.svelte.js';
import { router } from '../state/router.svelte.js';
import type { NavigationItem } from './navigation.js';

export function activateNavigationItem(item: NavigationItem): void {
	const { action } = item;
	if (action.kind === 'view') {
		mockupState.tool = null;
		router.navigate(action.view);
	} else if (action.kind === 'search') {
		mockupState.openSearch();
	} else if (router.route.view !== 'atlas') {
		router.navigate('atlas');
		mockupState.tool = action.tool;
	} else {
		mockupState.toggleTool(action.tool);
	}
}

export function isNavigationItemActive(item: NavigationItem): boolean {
	const { action } = item;
	if (action.kind === 'view') {
		const isAtlasWithoutTool =
			action.view === 'atlas' && router.route.view === 'atlas' && !mockupState.tool;
		return isAtlasWithoutTool || (action.view !== 'atlas' && router.route.view === action.view);
	}
	if (action.kind === 'tool') {
		return router.route.view === 'atlas' && mockupState.tool === action.tool;
	}
	return mockupState.searchOpen;
}
