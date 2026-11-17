<script lang="ts">
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import XIcon from '@lucide/svelte/icons/x';
	import { findCategoryDefinition } from '../data/categories.js';
	import { listEntriesByIds } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import CategoryIcon from './CategoryIcon.svelte';

	let note = $state(
		'Xardas wspominał o zielu przy opuszczonej kopalni. Sprawdzić przed rozdziałem 3.'
	);
	const savedEntries = $derived(listEntriesByIds(mockupState.savedIds));
</script>

<div class="stack">
	<section aria-labelledby="saved-list">
		<h3 id="saved-list">Zapisane miejsca i wpisy</h3>
		{#if savedEntries.length === 0}
			<div class="empty">
				<BookmarkIcon size={28} strokeWidth={1.4} aria-hidden="true" />
				<p>
					Nic tu jeszcze nie ma. Otwórz kartę wpisu i naciśnij „Zapisz”, aby dodać go do zakładek.
				</p>
			</div>
		{:else}
			<ul>
				{#each savedEntries as entry (entry.id)}
					<li>
						<button type="button" class="open" onclick={() => mockupState.select(entry.id)}>
							<CategoryIcon category={entry.category} size={18} />
							<span class="text">
								<span class="name">{entry.name}</span>
								<span class="meta">{findCategoryDefinition(entry.category).label}</span>
							</span>
						</button>
						<button
							type="button"
							class="btn icon ghost"
							aria-label={`Usuń z zakładek: ${entry.name}`}
							onclick={() => mockupState.toggleSaved(entry.id)}
						>
							<XIcon size={16} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section aria-labelledby="note-title">
		<h3 id="note-title">Notatnik wyprawy</h3>
		<label class="sr-only" for="note-field">Treść notatki</label>
		<textarea
			id="note-field"
			bind:value={note}
			rows="5"
			placeholder="Zapisz, co chcesz zapamiętać o tym świecie."></textarea>
		<div class="actions">
			<button
				type="button"
				class="btn primary"
				onclick={() => mockupState.showToast('Notatka zapisana na tym urządzeniu')}
				>Zapisz notatkę</button
			>
			<button
				type="button"
				class="btn ghost"
				onclick={() => mockupState.showToast('Kopia zakładek pobrana jako plik')}
				>Pobierz kopię</button
			>
		</div>
		<p class="meta">Dane zostają w przeglądarce. Nie wymagają logowania.</p>
	</section>
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

	li {
		display: flex;
		align-items: center;
		border-top: 1px solid var(--linia);
	}

	.open {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		flex: 1;
		min-height: var(--cel-dotyku);
		padding: 6px 0;
		border: 0;
		background: none;
		text-align: left;
	}

	.text {
		display: flex;
		flex-direction: column;
	}

	.name {
		font-weight: 500;
	}

	.open:hover .name {
		color: var(--mosiadz-jasny);
	}

	.meta {
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-2);
		padding: var(--s-4);
		text-align: center;
		color: var(--tekst-2);
	}

	textarea {
		width: 100%;
		padding: var(--s-3);
		border: 1px solid var(--linia-mocna);
		border-radius: var(--r-ostry);
		background: var(--antracyt);
		resize: vertical;
		line-height: 1.5;
	}

	textarea:focus {
		border-color: var(--mosiadz-jasny);
		outline: 1px solid var(--mosiadz-jasny);
	}

	.actions {
		display: flex;
		gap: var(--s-2);
		margin: var(--s-3) 0 var(--s-2);
	}
</style>
