<script lang="ts">
	import MapView from '#lib/components/MapView.svelte';
	import InstrumentBar from '#lib/components/shell/InstrumentBar.svelte';
	import MapControls from '#lib/components/shell/MapControls.svelte';
	import ToolPanel from '#lib/components/shell/ToolPanel.svelte';
	import ToolRail from '#lib/components/shell/ToolRail.svelte';
	import TopBar from '#lib/components/shell/TopBar.svelte';
	import { geoportal } from '#lib/composition-root.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	$effect(() => {
		geoportal.openWorld(data.world);
	});
</script>

<svelte:head>
	<title>{data.world.name} — GIS of Gothic</title>
</svelte:head>

<main class="relative h-dvh w-screen overflow-hidden bg-background">
	<MapView />
	<TopBar gameName={data.game.name} worldName={data.world.name} />
	<ToolRail />
	<ToolPanel />
	<MapControls />
	<InstrumentBar />
</main>
