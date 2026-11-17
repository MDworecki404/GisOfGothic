<script lang="ts">
	import ArrowRightIcon from '@lucide/svelte/icons/corner-down-right';
	import HistoryIcon from '@lucide/svelte/icons/clock';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { tick } from 'svelte';
	import { CATEGORY_DEFINITIONS, findCategoryDefinition } from '../data/categories.js';
	import type { Entry } from '../data/types.js';
	import { listEntriesByIds } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import { router } from '../state/router.svelte.js';
	import CategoryIcon from './CategoryIcon.svelte';

	const SUGGESTED_QUERIES = ['Xardas', 'farma', 'kowal', 'runa', 'zębacz'];

	let input = $state<HTMLInputElement | null>(null);
	let activeIndex = $state(0);

	const flatResults = $derived(mockupState.searchGroups.flatMap((group) => group.results));
	const hasQuery = $derived(mockupState.query.trim().length > 0);
	const recentEntries = $derived(listEntriesByIds(mockupState.recentIds));

	$effect(() => {
		if (mockupState.searchOpen) {
			void tick().then(() => input?.focus());
		}
	});

	$effect(() => {
		void mockupState.query;
		void mockupState.searchCategory;
		activeIndex = 0;
	});

	function chooseEntry(entry: Entry): void {
		mockupState.closeSearch();
		if (router.route.view !== 'atlas') {
			router.navigate('atlas');
		}
		mockupState.select(entry.id);
	}

	function handleKeyDown(event: KeyboardEvent): void {
		const list = hasQuery ? flatResults : recentEntries;
		if (event.key === 'Escape') {
			event.preventDefault();
			mockupState.closeSearch();
		} else if (event.key === 'ArrowDown') {
			event.preventDefault();
			activeIndex = Math.min(list.length - 1, activeIndex + 1);
		} else if (event.key === 'ArrowUp') {
			event.preventDefault();
			activeIndex = Math.max(0, activeIndex - 1);
		} else if (event.key === 'Enter' && list[activeIndex]) {
			event.preventDefault();
			chooseEntry(list[activeIndex]);
		}
	}

	function indexOfEntry(entry: Entry): number {
		return flatResults.findIndex((candidate) => candidate.id === entry.id);
	}
</script>

{#if mockupState.searchOpen}
	<div class="overlay">
		<button
			type="button"
			class="scrim"
			tabindex="-1"
			aria-label="Zamknij wyszukiwarkę"
			onclick={() => mockupState.closeSearch()}
		></button>
		<div
			class="palette cartouche"
			role="dialog"
			aria-modal="true"
			aria-label="Wyszukiwarka"
			tabindex="-1"
			onkeydown={handleKeyDown}
		>
			<div class="query">
				<SearchIcon size={18} aria-hidden="true" />
				<input
					bind:this={input}
					bind:value={mockupState.query}
					type="search"
					placeholder="Szukaj lokacji, postaci, przedmiotów, zadań…"
					aria-label="Szukaj"
					role="combobox"
					aria-expanded="true"
					aria-controls="search-results"
					aria-activedescendant={flatResults[activeIndex]
						? `result-${flatResults[activeIndex].id}`
						: undefined}
					autocomplete="off"
					spellcheck="false"
				/>
				{#if hasQuery}
					<button
						type="button"
						class="btn icon ghost"
						aria-label="Wyczyść wyszukiwanie"
						onclick={() => {
							mockupState.query = '';
							input?.focus();
						}}
					>
						<XIcon size={16} />
					</button>
				{/if}
				<kbd class="kbd">Esc</kbd>
			</div>

			<div class="tabs" role="group" aria-label="Filtruj wyniki według rodzaju">
				<button
					type="button"
					class="chip"
					aria-pressed={mockupState.searchCategory === 'all'}
					onclick={() => (mockupState.searchCategory = 'all')}
				>
					Wszystko
					{#if hasQuery}<span class="count tabular">{mockupState.searchCategoryCounts.all}</span
						>{/if}
				</button>
				{#each CATEGORY_DEFINITIONS as definition (definition.id)}
					<button
						type="button"
						class="chip"
						aria-pressed={mockupState.searchCategory === definition.id}
						onclick={() => (mockupState.searchCategory = definition.id)}
					>
						<CategoryIcon
							category={definition.id}
							size={14}
							tinted={mockupState.searchCategory === definition.id}
						/>
						{definition.labelPlural}
						{#if hasQuery}<span class="count tabular"
								>{mockupState.searchCategoryCounts[definition.id]}</span
							>{/if}
					</button>
				{/each}
			</div>

			<div class="results scroll" id="search-results" role="listbox" aria-label="Wyniki">
				{#if !hasQuery}
					<h2 class="group-title">Ostatnio oglądane</h2>
					{#each recentEntries as entry, index (entry.id)}
						<button
							type="button"
							id={`result-${entry.id}`}
							role="option"
							aria-selected={index === activeIndex}
							class="result"
							class:active={index === activeIndex}
							onpointermove={() => (activeIndex = index)}
							onclick={() => chooseEntry(entry)}
						>
							<span class="result-icon"><HistoryIcon size={16} aria-hidden="true" /></span>
							<span class="result-text">
								<span class="result-name">{entry.name}</span>
								<span class="result-meta">{findCategoryDefinition(entry.category).label}</span>
							</span>
						</button>
					{/each}
					<h2 class="group-title">Spróbuj wyszukać</h2>
					<div class="suggestions">
						{#each SUGGESTED_QUERIES as suggestion (suggestion)}
							<button
								type="button"
								class="chip"
								onclick={() => {
									mockupState.query = suggestion;
									input?.focus();
								}}>{suggestion}</button
							>
						{/each}
					</div>
				{:else if flatResults.length === 0}
					<div class="empty">
						<SearchIcon size={28} strokeWidth={1.4} aria-hidden="true" />
						<h2>Brak wyników dla „{mockupState.query}”</h2>
						<p>
							Sprawdź pisownię, wpisz krótszy fragment nazwy albo wybierz filtr „Wszystko”. Polskie
							litery możesz pomijać.
						</p>
						<div class="actions">
							{#if mockupState.searchCategory !== 'all'}
								<button
									type="button"
									class="btn"
									onclick={() => (mockupState.searchCategory = 'all')}
									>Pokaż wszystkie rodzaje</button
								>
							{/if}
							<button
								type="button"
								class="btn ghost"
								onclick={() => {
									mockupState.query = '';
									input?.focus();
								}}>Wyczyść</button
							>
						</div>
					</div>
				{:else}
					{#each mockupState.searchGroups as group (group.category)}
						<h2 class="group-title">
							{findCategoryDefinition(group.category).labelPlural}
							<span class="tabular">{group.results.length}</span>
						</h2>
						{#each group.results as entry (entry.id)}
							{@const index = indexOfEntry(entry)}
							<button
								type="button"
								id={`result-${entry.id}`}
								role="option"
								aria-selected={index === activeIndex}
								class="result"
								class:active={index === activeIndex}
								onpointermove={() => (activeIndex = index)}
								onclick={() => chooseEntry(entry)}
							>
								<span class="result-icon"><CategoryIcon category={entry.category} size={18} /></span
								>
								<span class="result-text">
									<span class="result-name">{entry.name}</span>
									<span class="result-meta">{entry.summary}</span>
								</span>
								<span class="go"><ArrowRightIcon size={14} aria-hidden="true" /> Na mapie</span>
							</button>
						{/each}
					{/each}
				{/if}
			</div>

			<footer class="hints" aria-hidden="true">
				<span><kbd class="kbd">↑</kbd><kbd class="kbd">↓</kbd> wybierz</span>
				<span><kbd class="kbd">Enter</kbd> pokaż na mapie</span>
				<span><kbd class="kbd">Esc</kbd> zamknij</span>
			</footer>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		justify-content: center;
		align-items: flex-start;
		padding-top: 9vh;
	}

	.scrim {
		position: absolute;
		inset: 0;
		border: 0;
		background: var(--scrim);
		animation: fade var(--czas-sredni) ease;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	.palette {
		position: relative;
		display: flex;
		flex-direction: column;
		width: min(640px, calc(100vw - 32px));
		max-height: min(640px, 82dvh);
		animation: rise var(--czas-sredni) var(--ruch);
	}

	@keyframes rise {
		from {
			opacity: 0;
			translate: 0 -8px;
		}
	}

	.query {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		padding: var(--s-3) var(--s-4);
		border-bottom: 1px solid var(--linia);
		color: var(--tekst-2);
	}

	.query input {
		flex: 1;
		min-width: 0;
		min-height: 36px;
		border: 0;
		outline: 0;
		background: none;
		color: var(--tekst);
		font-size: var(--tx-lg);
	}

	.query input::placeholder {
		color: var(--tekst-3);
	}

	.tabs {
		display: flex;
		gap: 6px;
		padding: var(--s-3) var(--s-4);
		overflow-x: auto;
		scrollbar-width: none;
		border-bottom: 1px solid var(--linia);
	}

	.count {
		color: var(--tekst-3);
		font-size: var(--tx-xs);
	}

	.results {
		flex: 1;
		min-height: 160px;
		padding: var(--s-2) var(--s-2) var(--s-3);
	}

	.group-title {
		display: flex;
		justify-content: space-between;
		padding: var(--s-3) var(--s-3) var(--s-1);
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--mosiadz-jasny);
	}

	.group-title span {
		font-family: var(--font-ui);
		font-size: var(--tx-xs);
		font-weight: 400;
		color: var(--tekst-3);
	}

	.result {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		width: 100%;
		min-height: 52px;
		padding: 6px var(--s-3);
		border: 0;
		border-radius: var(--r-ostry);
		background: none;
		text-align: left;
	}

	.result.active {
		background: var(--kamien-2);
		box-shadow: inset 2px 0 0 var(--mosiadz);
	}

	.result-icon {
		display: grid;
		place-items: center;
		flex: none;
		width: 32px;
		height: 32px;
		border: 1px solid var(--linia);
		border-radius: 50%;
		color: var(--tekst-2);
	}

	.result-text {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-width: 0;
	}

	.result-name {
		font-weight: 500;
	}

	.result-meta {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--tekst-2);
		font-size: var(--tx-sm);
	}

	.go {
		display: none;
		align-items: center;
		gap: 4px;
		color: var(--mosiadz-jasny);
		font-size: var(--tx-xs);
	}

	.result.active .go {
		display: inline-flex;
	}

	.suggestions {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding: var(--s-2) var(--s-3);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-2);
		padding: var(--s-6) var(--s-5);
		text-align: center;
		color: var(--tekst-2);
	}

	.empty h2 {
		font-size: var(--tx-xl);
		color: var(--tekst);
	}

	.empty p {
		max-width: 38ch;
	}

	.actions {
		display: flex;
		gap: var(--s-2);
		margin-top: var(--s-2);
	}

	.hints {
		display: flex;
		gap: var(--s-4);
		padding: var(--s-2) var(--s-4);
		border-top: 1px solid var(--linia);
		color: var(--tekst-3);
		font-size: var(--tx-xs);
	}

	.hints span {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	@media (max-width: 47.99rem) {
		.overlay {
			padding-top: 0;
		}

		.palette {
			width: 100vw;
			max-height: 100dvh;
			height: 100dvh;
			border-radius: 0;
		}

		.hints {
			display: none;
		}
	}
</style>
