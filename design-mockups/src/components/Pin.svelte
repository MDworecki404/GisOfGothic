<script lang="ts">
	import type { Entry } from '../data/types.js';
	import { findCategoryDefinition } from '../data/categories.js';
	import CategoryIcon from './CategoryIcon.svelte';

	interface Props {
		entry: Entry;
		selected: boolean;
		showLabel: boolean;
		onselect: (entryId: string) => void;
	}

	let { entry, selected, showLabel, onselect }: Props = $props();
	const color = $derived(`var(${findCategoryDefinition(entry.category).colorVariable})`);
</script>

<button
	type="button"
	class="pin"
	class:selected
	class:diamond={entry.category === 'location'}
	style:--pin-color={color}
	aria-label={`${findCategoryDefinition(entry.category).label}: ${entry.name}`}
	aria-pressed={selected}
	onclick={(event) => {
		event.stopPropagation();
		onselect(entry.id);
	}}
	onpointerdown={(event) => event.stopPropagation()}
>
	<span class="marker"><CategoryIcon category={entry.category} size={14} tinted={false} /></span>
	{#if showLabel || selected}
		<span class="label">{entry.name}</span>
	{/if}
</button>

<style>
	.pin {
		position: relative;
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 15px;
		margin: -15px;
		background: none;
		border: 0;
		color: var(--tekst);
	}

	.marker {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--grafit);
		border: 2px solid var(--pin-color);
		color: var(--pin-color);
		box-shadow: var(--cien-pinezki);
		transition:
			transform var(--czas-krotki) var(--ruch),
			background var(--czas-krotki) ease;
	}

	.diamond .marker {
		border-radius: 4px;
		transform: rotate(45deg);
	}

	.diamond .marker :global(svg) {
		transform: rotate(-45deg);
	}

	.pin:hover .marker {
		background: var(--kamien-2);
		transform: scale(1.12);
	}

	.diamond:hover .marker {
		transform: rotate(45deg) scale(1.12);
	}

	.selected .marker {
		background: var(--pin-color);
		color: var(--grafit);
		outline: 2px solid var(--tekst);
		outline-offset: 3px;
	}

	.label {
		position: absolute;
		left: calc(100% - 6px);
		top: 50%;
		translate: 0 -50%;
		padding: 2px 8px;
		border-radius: var(--r-ostry);
		background: rgb(18 20 22 / 0.86);
		font-family: var(--font-display);
		font-size: 1.0625rem;
		font-weight: 600;
		white-space: nowrap;
		text-shadow: 0 1px 2px #000;
		pointer-events: none;
	}

	.selected .label {
		background: var(--grafit);
		color: var(--mosiadz-jasny);
	}
</style>
