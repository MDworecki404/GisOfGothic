<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import type { Attachment } from 'svelte/attachments';
	import { appState, geoportal } from '#lib/composition-root.js';

	const TYPE_FILTERS = [
		{ value: 'all', label: 'Wszystko' },
		{ value: 'item', label: 'Przedmioty' },
		{ value: 'character', label: 'Postacie' }
	] as const;

	const hasQuery = $derived(appState.searchQuery.trim().length > 0);

	function showPreview(modelPath: string): Attachment<HTMLElement> {
		return (container) => geoportal.showModelPreview(container, modelPath);
	}
</script>

{#if appState.selectedEntry}
	{@const entry = appState.selectedEntry}
	<button
		class="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
		onclick={() => geoportal.clearSearchSelection()}
	>
		<ArrowLeftIcon class="size-4" />
		{hasQuery ? 'Wróć do wyników' : 'Wróć do wyszukiwarki'}
	</button>

	<article aria-labelledby="entry-name">
		<h3 id="entry-name" class="font-serif text-[22px] leading-tight">{entry.name}</h3>
		<p class="text-sm text-muted-foreground">
			{entry.categoryLabel} · <span class="text-xs">{entry.code}</span>
		</p>

		{#if entry.modelPath}
			<div
				class="my-3 h-48 overflow-hidden rounded-sm border border-border"
				aria-label="Podgląd 3D: {entry.name}"
				role="img"
				{@attach showPreview(entry.modelPath)}
			></div>
		{/if}

		{#if entry.facts.length > 0}
			<dl class="my-3 flex flex-wrap gap-x-5 gap-y-2 tabular-nums">
				{#each entry.facts as fact (fact.label)}
					<div class="flex flex-col-reverse">
						<dt class="text-xs text-muted-foreground">{fact.label}</dt>
						<dd class="text-xl text-primary">{fact.value}</dd>
					</div>
				{/each}
			</dl>
		{/if}

		{#if entry.encyclopediaUrl}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- zewnętrzny adres Gothicpedii, nie ścieżka aplikacji -->
			<a
				class="my-3 flex items-center gap-1.5 text-sm text-primary hover:underline"
				href={entry.encyclopediaUrl}
				target="_blank"
				rel="noopener noreferrer"
			>
				<ExternalLinkIcon class="size-4" />
				Zobacz na Gothicpedii
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			<p class="-mt-1 mb-2 text-xs text-muted-foreground">Opisy postaci: Gothicpedia (CC BY-SA)</p>
		{/if}

		<h4 class="mt-4 mb-1 text-sm text-muted-foreground">
			Miejsca ({entry.places.length}) — kliknij, aby polecieć
		</h4>
		<ul class="tabular-nums">
			{#each entry.places as place (place.index)}
				<li class="border-t border-border/60">
					<button
						class="grid w-full grid-cols-[12px_1fr_auto] items-baseline gap-2.5 py-2 text-left text-sm hover:bg-secondary/60"
						onclick={() => geoportal.flyToPlaceOfSelectedEntry(place.index)}
					>
						<span
							class="size-2.5 translate-y-px rounded-full"
							style:background-color={place.color}
							title={place.kindLabel}
						></span>
						<span>
							{place.description}
							{#if place.isUncertain}
								<span class="text-xs text-muted-foreground">(nie zawsze)</span>
							{/if}
						</span>
						<span class="text-muted-foreground">{place.quantity ?? ''}</span>
					</button>
				</li>
			{/each}
		</ul>
	</article>
{:else}
	<div class="flex flex-wrap gap-1.5" role="group" aria-label="Rodzaj wyników">
		{#each TYPE_FILTERS as filter (filter.value)}
			<button
				class="rounded-full border px-2.5 py-0.5 text-[13px] {appState.searchTypeFilter ===
				filter.value
					? 'border-primary/60 bg-secondary text-foreground'
					: 'border-border text-muted-foreground hover:text-foreground'}"
				aria-pressed={appState.searchTypeFilter === filter.value}
				onclick={() => geoportal.filterSearchByType(filter.value)}
			>
				{filter.label}
			</button>
		{/each}
	</div>

	{#if !hasQuery}
		<p class="mt-4 text-sm text-muted-foreground">
			Wpisz nazwę przedmiotu albo postaci w polu u góry, np. „ziele”, „klucz” albo „Harad”.
			{#if appState.indexCounts}
				W tym świecie jest {appState.indexCounts.items} przedmiotów i {appState.indexCounts
					.characters} unikatowych postaci.
			{/if}
		</p>
	{:else if appState.searchResults.length === 0}
		<p class="mt-4 text-sm text-muted-foreground">
			Nic nie znaleziono. Spróbuj krótszej nazwy albo zmień rodzaj wyników.
		</p>
	{:else}
		<p class="mt-3 mb-1 text-sm text-muted-foreground">
			Wyniki: {appState.searchResults.length}
		</p>
		<ul>
			{#each appState.searchResults as result (result.id)}
				<li>
					<button
						class="grid w-full grid-cols-[12px_1fr_auto] items-center gap-2.5 rounded-sm px-2 py-2 text-left hover:bg-secondary"
						onclick={() => geoportal.selectSearchEntry(result.id)}
					>
						<span class="size-2.5 rounded-full" style:background-color={result.markerColor}></span>
						<span class="min-w-0">
							<span class="block truncate font-medium">{result.name}</span>
							<span class="block text-[13px] text-muted-foreground">{result.categoryLabel}</span>
						</span>
						<span class="text-[13px] text-muted-foreground tabular-nums">{result.summary}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
{/if}
