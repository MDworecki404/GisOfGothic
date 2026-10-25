<script lang="ts">
	import { onMount } from 'svelte';
	import { appState, geoportal } from '#lib/composition-root.js';
	import MapAttribution from '#lib/components/shell/MapAttribution.svelte';

	let container: HTMLDivElement;
	let creditContainer = $state<HTMLElement>();

	onMount(() => {
		if (!creditContainer) return;
		geoportal.attachMapTo(container, creditContainer);
		const stopListeningToFlightKeyboard = geoportal.listenToFlightKeyboard(window);
		return () => {
			stopListeningToFlightKeyboard();
			geoportal.detachMap();
		};
	});
</script>

<div class="map-parchment absolute inset-0">
	<div
		bind:this={container}
		class="absolute inset-0 {appState.activeToolId === 'measure' ||
		appState.activeToolId === 'analysis'
			? 'cursor-crosshair'
			: ''}"
		data-testid="map"
	></div>
	<div class="map-parchment-frame pointer-events-none absolute inset-0" aria-hidden="true"></div>
</div>

<MapAttribution bind:creditContainer />
