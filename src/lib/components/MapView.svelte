<script lang="ts">
	import { onMount } from 'svelte';
	import { geoportal } from '#lib/composition-root.js';

	let container: HTMLDivElement;

	onMount(() => {
		geoportal.attachMapTo(container);
		return () => geoportal.detachMap();
	});
</script>

<div bind:this={container} class="absolute inset-0" data-testid="map"></div>
