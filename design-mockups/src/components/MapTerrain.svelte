<script lang="ts">
	import type { BaseLayers } from '../state/mockup-state.svelte.js';
	import {
		ISLAND_OUTLINE,
		REGIONS,
		RIVER_PATH,
		ROADS,
		WORLD_HEIGHT,
		WORLD_WIDTH
	} from '../data/world.js';

	interface Props {
		layers: BaseLayers;
		hour: number;
	}

	let { layers, hour }: Props = $props();

	const CONTOUR_SCALES = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4];
	const GRID_STEP = 100;
	const GRID_COLUMNS = Array.from({ length: WORLD_WIDTH / GRID_STEP + 1 }, (_, index) => index);
	const GRID_ROWS = Array.from(
		{ length: Math.floor(WORLD_HEIGHT / GRID_STEP) + 1 },
		(_, index) => index
	);
	const centerX = WORLD_WIDTH / 2 + 30;
	const centerY = WORLD_HEIGHT / 2 + 10;

	const nightOpacity = $derived.by(() => {
		const distanceFromNoon = Math.abs((((hour % 24) + 24) % 24) - 13);
		const shifted = Math.min(distanceFromNoon, 24 - distanceFromNoon);
		return Math.max(0, Math.min(0.5, (shifted - 5) * 0.09));
	});
</script>

<svg
	viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
	width={WORLD_WIDTH}
	height={WORLD_HEIGHT}
	aria-hidden="true"
	focusable="false"
>
	<defs>
		<pattern id="forest" width="22" height="22" patternUnits="userSpaceOnUse">
			<path d="M5 14 L8 7 L11 14 Z M14 19 L17 12 L20 19 Z" fill="#3d4630" opacity="0.7" />
		</pattern>
		<pattern id="waves" width="46" height="18" patternUnits="userSpaceOnUse">
			<path
				d="M2 10 q5-5 10 0 t10 0 t10 0 t10 0"
				fill="none"
				stroke="#2b3d42"
				stroke-width="1"
				opacity="0.65"
			/>
		</pattern>
		<clipPath id="island-clip"><path d={ISLAND_OUTLINE} /></clipPath>
		<radialGradient id="terrain-light" cx="0.5" cy="0.45" r="0.65">
			<stop offset="0" stop-color="#3a3f31" />
			<stop offset="1" stop-color="#262a24" />
		</radialGradient>
	</defs>

	<rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="var(--morze)" />
	<rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#waves)" />

	{#if layers.terrain}
		<path
			d={ISLAND_OUTLINE}
			fill="none"
			stroke="#2f464b"
			stroke-width="22"
			stroke-linejoin="round"
			opacity="0.28"
		/>
		<path
			d={ISLAND_OUTLINE}
			fill="none"
			stroke="#2f464b"
			stroke-width="10"
			stroke-linejoin="round"
			opacity="0.4"
		/>
		<path
			d={ISLAND_OUTLINE}
			fill="url(#terrain-light)"
			stroke="var(--mosiadz-ciemny)"
			stroke-width="1.6"
		/>
		<g clip-path="url(#island-clip)">
			<rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#forest)" opacity="0.55" />
		</g>
	{/if}

	{#if layers.contours}
		<g fill="none" stroke="var(--linia-mocna)" stroke-width="0.9" opacity="0.65">
			{#each CONTOUR_SCALES as scale, index (scale)}
				<path
					d={ISLAND_OUTLINE}
					transform={`translate(${centerX} ${centerY}) scale(${scale}) translate(${-centerX} ${-centerY})`}
					stroke-dasharray={index % 2 === 1 ? '2 4' : 'none'}
				/>
			{/each}
		</g>
	{/if}

	{#if layers.rivers}
		<path
			d={RIVER_PATH}
			fill="none"
			stroke="#1d3b44"
			stroke-width="7"
			stroke-linecap="round"
			opacity="0.85"
		/>
		<path d={RIVER_PATH} fill="none" stroke="#4d7a86" stroke-width="2" stroke-linecap="round" />
	{/if}

	{#if layers.roads}
		<g fill="none" stroke-linecap="round">
			{#each ROADS as road (road.id)}
				<path d={road.path} stroke="#171a14" stroke-width="5" opacity="0.6" />
				<path
					d={road.path}
					stroke="var(--mosiadz)"
					stroke-width="1.8"
					stroke-dasharray="7 5"
					opacity="0.85"
				/>
			{/each}
		</g>
	{/if}

	{#if layers.regions}
		<g
			font-family="var(--font-display)"
			font-style="italic"
			font-weight="500"
			font-size="26"
			letter-spacing="9"
			text-anchor="middle"
			fill="var(--tekst)"
			opacity="0.5"
		>
			{#each REGIONS as region (region.id)}
				<text
					x={region.x}
					y={region.y}
					transform={`rotate(${region.rotate} ${region.x} ${region.y})`}
				>
					{region.name}
				</text>
			{/each}
		</g>
		<text
			x="95"
			y="330"
			font-family="var(--font-display)"
			font-style="italic"
			font-size="30"
			letter-spacing="14"
			fill="#6f9099"
			opacity="0.6"
			text-anchor="middle"
			transform="rotate(-90 95 330)"
		>
			Morze
		</text>
	{/if}

	<g stroke="var(--tekst)" stroke-width="0.5" opacity="0.07">
		{#each GRID_COLUMNS as column (column)}
			<path d={`M${column * GRID_STEP} 0 V${WORLD_HEIGHT}`} />
		{/each}
		{#each GRID_ROWS as row (row)}
			<path d={`M0 ${row * GRID_STEP} H${WORLD_WIDTH}`} />
		{/each}
	</g>

	<rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="#05080f" opacity={nightOpacity} />
</svg>

<style>
	svg {
		display: block;
	}
</style>
