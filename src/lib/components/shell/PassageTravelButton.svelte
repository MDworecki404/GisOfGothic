<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { PassageDestination } from '#lib/data/types.js';
	import { geoportal } from '#lib/composition-root.js';

	let {
		passage,
		class: className = 'button-ink'
	}: { passage: PassageDestination; class?: string } = $props();

	const isPassageToOtherWorld = $derived(
		passage.toWorld !== `${page.params.gameId}/${page.params.worldId}`
	);

	async function travelThroughPassage(): Promise<void> {
		const target = await geoportal.planPassageTravel(passage);
		if (!target) return;
		geoportal.closeFeatureIdentification();
		const worldPath = resolve('/[gameId]/[worldId]', {
			gameId: target.gameId,
			worldId: target.worldId
		});
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- worldPath pochodzi z resolve(), dopisujemy tylko parametry widoku
		await goto(worldPath + target.query);
	}
</script>

{#if isPassageToOtherWorld}
	<button class={className} onclick={travelThroughPassage}>Przejdź do tego świata</button>
{/if}
