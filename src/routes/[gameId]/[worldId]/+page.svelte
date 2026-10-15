<script lang="ts">
	import MapView from '#lib/components/MapView.svelte';
	import InstrumentBar from '#lib/components/shell/InstrumentBar.svelte';
	import MapControls from '#lib/components/shell/MapControls.svelte';
	import ToolPanel from '#lib/components/shell/ToolPanel.svelte';
	import ToolRail from '#lib/components/shell/ToolRail.svelte';
	import TopBar from '#lib/components/shell/TopBar.svelte';
	import { untrack } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { appState, geoportal } from '#lib/composition-root.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const ENTRY_PARAMETER = 'wpis';

	$effect(() => {
		geoportal.openWorld(data.world);
		const entryIdFromLink = untrack(() => page.url.searchParams.get(ENTRY_PARAMETER));
		if (entryIdFromLink) geoportal.selectSearchEntry(entryIdFromLink);
	});

	$effect(() => {
		const selectedEntryId = appState.selectedEntry?.id ?? null;
		const currentEntryId = untrack(() => page.url.searchParams.get(ENTRY_PARAMETER));
		if (currentEntryId === selectedEntryId) return;
		const query = selectedEntryId
			? `?${new URLSearchParams({ [ENTRY_PARAMETER]: selectedEntryId })}`
			: '';
		replaceState(
			resolve('/[gameId]/[worldId]', { gameId: data.world.gameId, worldId: data.world.id }) + query,
			{}
		);
	});
</script>

<svelte:head>
	<title
		>{appState.selectedEntry ? `${appState.selectedEntry.name} · ` : ''}{data.world.name} — GIS of Gothic</title
	>
</svelte:head>

<main class="relative h-dvh w-screen overflow-hidden bg-background">
	<MapView />
	<TopBar gameName={data.game.name} worldName={data.world.name} />
	<ToolRail />
	<ToolPanel />
	<MapControls />
	<InstrumentBar />
</main>
