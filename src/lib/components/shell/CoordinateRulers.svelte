<script lang="ts">
	import { appState } from '#lib/composition-root.js';

	const rulers = $derived(appState.coordinateRulers);
</script>

{#if rulers}
	<div
		class="coordinate-ruler pointer-events-none fixed inset-x-0 top-(--top-bar-height) z-10 hidden h-(--ruler-size) overflow-hidden border-b md:block"
		data-testid="coordinate-ruler-east"
		role="img"
		aria-label="Linijka współrzędnej Wschód, w metrach od punktu zakotwiczenia świata"
	>
		{#each rulers.horizontal as tick (tick.offsetPixels)}
			<span
				class="coordinate-ruler-tick absolute top-0 h-full border-l pl-1"
				style:left="{tick.offsetPixels}px"
			>
				{tick.label}
			</span>
		{/each}
	</div>
	<div
		class="coordinate-ruler pointer-events-none fixed top-[calc(var(--top-bar-height)+var(--ruler-size))] bottom-0 left-(--rail-width) z-10 hidden w-(--ruler-size) overflow-hidden border-r md:block"
		data-testid="coordinate-ruler-north"
		role="img"
		aria-label="Linijka współrzędnej Północ, w metrach od punktu zakotwiczenia świata"
	>
		{#each rulers.vertical as tick (tick.offsetPixels)}
			<span
				class="coordinate-ruler-tick absolute left-0 w-full border-t"
				style:top="calc({tick.offsetPixels}px - var(--top-bar-height) - var(--ruler-size))"
			>
				<span class="coordinate-ruler-vertical-label">{tick.label}</span>
			</span>
		{/each}
	</div>
{/if}
