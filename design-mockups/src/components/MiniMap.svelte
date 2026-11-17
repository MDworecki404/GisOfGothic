<script lang="ts">
	import {
		ISLAND_OUTLINE,
		ROADS,
		WORLD_HEIGHT,
		WORLD_WIDTH,
		findEntry,
		findLocation
	} from '../data/world.js';

	interface Props {
		highlightIds?: readonly string[];
		routeIds?: readonly string[];
		label: string;
	}

	let { highlightIds = [], routeIds = [], label }: Props = $props();

	const routePoints = $derived(
		routeIds.flatMap((id) => {
			const location = findLocation(id);
			return location ? [`${location.x},${location.y}`] : [];
		})
	);
	const highlighted = $derived(
		highlightIds.flatMap((id) => {
			const entry = findEntry(id);
			return entry ? [entry] : [];
		})
	);
</script>

<svg viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} role="img" aria-label={label}>
	<rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="var(--morze)" />
	<path d={ISLAND_OUTLINE} fill="var(--ziemia)" stroke="var(--mosiadz-ciemny)" stroke-width="3" />
	{#each ROADS as road (road.id)}
		<path
			d={road.path}
			fill="none"
			stroke="var(--linia-mocna)"
			stroke-width="3"
			stroke-dasharray="10 8"
		/>
	{/each}
	{#if routePoints.length > 1}
		<polyline
			points={routePoints.join(' ')}
			fill="none"
			stroke="var(--kat-quest)"
			stroke-width="5"
			stroke-dasharray="14 9"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		{#each routeIds as id, index (`${id}-${index}`)}
			{@const location = findLocation(id)}
			{#if location}
				<circle
					cx={location.x}
					cy={location.y}
					r="14"
					fill="var(--grafit)"
					stroke="var(--kat-quest)"
					stroke-width="4"
				/>
				<text
					x={location.x}
					y={location.y + 6}
					text-anchor="middle"
					font-size="18"
					font-weight="600"
					fill="var(--kat-quest)"
					font-family="var(--font-ui)">{index + 1}</text
				>
			{/if}
		{/each}
	{/if}
	{#each highlighted as entry (entry.id)}
		<circle
			cx={entry.x}
			cy={entry.y}
			r="30"
			fill="none"
			stroke="var(--mosiadz-jasny)"
			stroke-width="2"
			opacity="0.5"
		/>
		<circle
			cx={entry.x}
			cy={entry.y}
			r="13"
			fill="var(--mosiadz)"
			stroke="var(--grafit)"
			stroke-width="4"
		/>
	{/each}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
		border: 1px solid var(--linia);
		border-radius: var(--r-panel);
	}
</style>
