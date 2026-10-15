<script lang="ts">
	import { onMount } from 'svelte';
	import { appState, geoportal } from '#lib/composition-root.js';

	let container: HTMLDivElement;

	onMount(() => {
		geoportal.attachMapTo(container);
		return () => geoportal.detachMap();
	});
</script>

<div
	bind:this={container}
	class="absolute inset-0 {appState.activeToolId === 'measure' ||
	appState.activeToolId === 'analysis'
		? 'cursor-crosshair'
		: ''}"
	data-testid="map"
></div>
