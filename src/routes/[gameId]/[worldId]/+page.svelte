<script lang="ts">
	import MapView from '#lib/components/MapView.svelte';
	import ActiveLayersLegend from '#lib/components/shell/ActiveLayersLegend.svelte';
	import IdentifyCard from '#lib/components/shell/IdentifyCard.svelte';
	import InstrumentBar from '#lib/components/shell/InstrumentBar.svelte';
	import MapInsetsReporter from '#lib/components/shell/MapInsetsReporter.svelte';
	import MapLoadError from '#lib/components/shell/MapLoadError.svelte';
	import TilesLoadingBadge from '#lib/components/shell/TilesLoadingBadge.svelte';
	import FlightSticks from '#lib/components/shell/FlightSticks.svelte';
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

	$effect(() => {
		geoportal.openWorld(data.world);
		geoportal.openSharedView(untrack(() => page.url.search));
	});

	$effect(() => {
		const viewQuery = appState.sharedViewQuery;
		if (untrack(() => window.location.search) === viewQuery) return;
		replaceState(
			resolve('/[gameId]/[worldId]', { gameId: data.world.gameId, worldId: data.world.id }) +
				viewQuery,
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
	<TopBar games={data.games} currentGameId={data.game.id} currentWorldId={data.world.id} />
	<ToolRail />
	<ToolPanel />
	<MapInsetsReporter />
	<MapControls />
	<FlightSticks />
	<TilesLoadingBadge />
	<ActiveLayersLegend />
	<MapLoadError />
	<IdentifyCard />
	<InstrumentBar />
</main>
