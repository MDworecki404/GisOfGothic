<script lang="ts">
	import CompassIcon from '@lucide/svelte/icons/compass';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { CATEGORY_DEFINITIONS } from '../data/categories.js';
	import { ALL_ENTRIES } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import { router } from '../state/router.svelte.js';
	import CategoryIcon from './CategoryIcon.svelte';

	interface Props {
		showFilters?: boolean;
	}

	let { showFilters = true }: Props = $props();

	function countEntries(category: string): number {
		return ALL_ENTRIES.filter((entry) => entry.category === category).length;
	}
</script>

<header class="topbar">
	<a class="brand" href={router.buildHref('atlas')} aria-label="Atlas Gothic, wróć do mapy">
		<span class="seal" aria-hidden="true"><CompassIcon size={18} strokeWidth={1.5} /></span>
		<span class="brand-name">Atlas Gothic</span>
	</a>

	<a class="world" href={router.buildHref('worlds')} aria-label="Zmień świat, teraz Khorinis">
		<span class="game">Gothic 2: Noc Kruka</span>
		<span class="world-name">Khorinis</span>
		<ChevronDownIcon size={16} aria-hidden="true" />
	</a>

	<button
		type="button"
		class="search field"
		onclick={() => mockupState.openSearch()}
		aria-label="Szukaj lokacji, postaci, przedmiotów i zadań. Skrót: Ctrl K"
	>
		<SearchIcon size={16} aria-hidden="true" />
		<span class="placeholder">Szukaj lokacji, postaci, przedmiotów…</span>
		<span class="kbds" aria-hidden="true"><kbd class="kbd">Ctrl</kbd><kbd class="kbd">K</kbd></span>
	</button>

	{#if showFilters}
		<div class="filters" role="group" aria-label="Pokazuj na mapie">
			{#each CATEGORY_DEFINITIONS as definition (definition.id)}
				<button
					type="button"
					class="chip"
					aria-pressed={mockupState.visibleCategories[definition.id]}
					onclick={() => mockupState.toggleCategory(definition.id)}
				>
					<CategoryIcon
						category={definition.id}
						size={14}
						tinted={mockupState.visibleCategories[definition.id]}
					/>
					<span>{definition.labelPlural}</span>
					<span class="count tabular">{countEntries(definition.id)}</span>
				</button>
			{/each}
		</div>
	{/if}
</header>

<style>
	.topbar {
		grid-area: top;
		display: flex;
		align-items: center;
		gap: var(--s-4);
		padding: 0 var(--s-4);
		min-width: 0;
		background: var(--antracyt);
		border-bottom: 1px solid var(--mosiadz-ciemny);
		position: relative;
		z-index: 30;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: var(--cel-dotyku);
		color: var(--tekst);
		text-decoration: none;
	}

	.seal {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border: 1px solid var(--mosiadz);
		border-radius: 50%;
		color: var(--mosiadz-jasny);
		box-shadow:
			inset 0 0 0 3px var(--antracyt),
			inset 0 0 0 4px var(--mosiadz-ciemny);
	}

	.brand-name {
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.world {
		display: flex;
		flex-direction: column;
		justify-content: center;
		position: relative;
		min-height: var(--cel-dotyku);
		padding: 0 var(--s-5) 0 var(--s-4);
		border-left: 1px solid var(--linia);
		color: var(--tekst);
		text-decoration: none;
		line-height: 1.15;
	}

	.world :global(svg) {
		position: absolute;
		right: 0;
		top: 50%;
		translate: 0 -50%;
		color: var(--tekst-2);
	}

	.world:hover .world-name {
		color: var(--mosiadz-jasny);
	}

	.game {
		font-size: var(--tx-xs);
		color: var(--tekst-2);
	}

	.world-name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.search {
		flex: 0 1 380px;
		min-width: 0;
		min-height: 40px;
		text-align: left;
		background: var(--grafit);
		color: var(--tekst-2);
	}

	.placeholder {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--tekst-3);
		font-size: var(--tx-sm);
	}

	.kbds {
		display: flex;
		gap: 4px;
	}

	.filters {
		display: flex;
		gap: 6px;
		margin-left: auto;
		overflow-x: auto;
		scrollbar-width: none;
		padding: 2px;
	}

	.count {
		color: var(--tekst-3);
		font-size: var(--tx-xs);
	}

	.chip[aria-pressed='true'] .count {
		color: var(--mosiadz-ciemny);
		color: var(--tekst-2);
	}

	@media (max-width: 69.99rem) {
		.game,
		.kbds {
			display: none;
		}

		.brand-name {
			display: none;
		}
	}

	@media (max-width: 47.99rem) {
		.topbar {
			gap: var(--s-2);
			padding: 0 var(--s-3);
		}

		.world {
			padding-left: var(--s-3);
		}

		.filters {
			display: none;
		}

		.search {
			flex: 1;
		}
	}
</style>
