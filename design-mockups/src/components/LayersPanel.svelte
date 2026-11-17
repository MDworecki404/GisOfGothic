<script lang="ts">
	import { CATEGORY_DEFINITIONS } from '../data/categories.js';
	import { ALL_ENTRIES } from '../data/world.js';
	import { mockupState, type BaseLayers } from '../state/mockup-state.svelte.js';
	import CategoryIcon from './CategoryIcon.svelte';

	interface BaseLayerOption {
		id: keyof BaseLayers;
		label: string;
		description: string;
	}

	const BASE_LAYER_OPTIONS: readonly BaseLayerOption[] = [
		{ id: 'terrain', label: 'Teren', description: 'Lądy, lasy i linia brzegowa' },
		{ id: 'contours', label: 'Poziomice', description: 'Linie równej wysokości' },
		{ id: 'roads', label: 'Drogi i szlaki', description: 'Trakty między osadami' },
		{ id: 'rivers', label: 'Rzeki', description: 'Cieki wodne wyspy' },
		{ id: 'regions', label: 'Nazwy regionów', description: 'Podpisy krain na mapie' }
	];

	function countEntries(category: string): number {
		return ALL_ENTRIES.filter((entry) => entry.category === category).length;
	}

	function resetLayers(): void {
		for (const definition of CATEGORY_DEFINITIONS) {
			mockupState.visibleCategories[definition.id] = true;
		}
		for (const option of BASE_LAYER_OPTIONS) {
			mockupState.baseLayers[option.id] = true;
		}
	}
</script>

<div class="stack">
	<section aria-labelledby="layers-data">
		<h3 id="layers-data">Dane na mapie</h3>
		<ul>
			{#each CATEGORY_DEFINITIONS as definition (definition.id)}
				<li>
					<label class="row">
						<CategoryIcon category={definition.id} size={18} />
						<span class="text">
							<span class="name">{definition.labelPlural}</span>
							<span class="meta tabular">{countEntries(definition.id)} pozycji</span>
						</span>
						<input
							type="checkbox"
							role="switch"
							checked={mockupState.visibleCategories[definition.id]}
							onchange={() => mockupState.toggleCategory(definition.id)}
						/>
					</label>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="layers-base">
		<h3 id="layers-base">Podkład mapy</h3>
		<ul>
			{#each BASE_LAYER_OPTIONS as option (option.id)}
				<li>
					<label class="row">
						<span class="text">
							<span class="name">{option.label}</span>
							<span class="meta">{option.description}</span>
						</span>
						<input
							type="checkbox"
							role="switch"
							checked={mockupState.baseLayers[option.id]}
							onchange={() =>
								(mockupState.baseLayers[option.id] = !mockupState.baseLayers[option.id])}
						/>
					</label>
				</li>
			{/each}
		</ul>
	</section>

	<button type="button" class="btn ghost" onclick={resetLayers}>Przywróć domyślne warstwy</button>
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--s-5);
	}

	h3 {
		margin-bottom: var(--s-2);
		font-size: 1.125rem;
		color: var(--mosiadz-jasny);
	}

	li + li {
		border-top: 1px solid var(--linia);
	}

	.row {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		min-height: var(--cel-dotyku);
		padding: var(--s-2) 0;
		cursor: pointer;
	}

	.text {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.name {
		font-weight: 500;
	}

	.meta {
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	input[type='checkbox'] {
		appearance: none;
		flex: none;
		position: relative;
		width: 40px;
		height: 22px;
		margin: 0;
		border: 1px solid var(--linia-mocna);
		border-radius: 11px;
		background: var(--grafit);
		cursor: pointer;
		transition: background var(--czas-krotki) ease;
	}

	input[type='checkbox']::after {
		content: '';
		position: absolute;
		left: 3px;
		top: 3px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--tekst-3);
		transition:
			translate var(--czas-krotki) var(--ruch),
			background var(--czas-krotki) ease;
	}

	input[type='checkbox']:checked {
		background: var(--mosiadz-tlo);
		border-color: var(--mosiadz);
	}

	input[type='checkbox']:checked::after {
		translate: 18px 0;
		background: var(--mosiadz-jasny);
	}
</style>
