<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import type { Attachment } from 'svelte/attachments';
	import { appState, geoportal } from '#lib/composition-root.js';
	import type { QuestLinkView } from '#lib/services/search/quest-presenter.js';

	const TYPE_FILTERS = [
		{ value: 'all', label: 'Wszystko' },
		{ value: 'item', label: 'Przedmioty' },
		{ value: 'character', label: 'Postacie' },
		{ value: 'quest', label: 'Questy' }
	] as const;

	const questDetails = $derived(
		appState.questDetails && appState.questDetails.entryId === appState.selectedEntry?.id
			? appState.questDetails
			: null
	);

	const relatedQuests = $derived(
		appState.relatedQuests && appState.relatedQuests.entryId === appState.selectedEntry?.id
			? appState.relatedQuests
			: null
	);

	const hasQuery = $derived(appState.searchQuery.trim().length > 0);

	function showPreview(modelPath: string): Attachment<HTMLElement> {
		return (container) => geoportal.showModelPreview(container, modelPath);
	}
</script>

{#snippet linkList(heading: string, links: readonly QuestLinkView[])}
	{#if links.length > 0}
		<h4 class="group-label mt-4 mb-1">{heading}</h4>
		<ul class="text-sm">
			{#each links as link, index (index)}
				<li class="border-t border-border/60">
					{#if link.entryId}
						{@const entryId = link.entryId}
						<button
							class="list-row flex w-full items-center justify-between gap-3 px-1 text-left"
							onclick={() => geoportal.selectSearchEntry(entryId)}
						>
							<span class="text-primary">{link.name}</span>
							<span class="text-caption text-muted-foreground">
								{link.description}{link.isUncertain ? ' (możliwe)' : ''}
							</span>
						</button>
					{:else}
						<div class="flex min-h-11 items-center justify-between gap-3 px-1">
							<span>{link.name}</span>
							<span class="text-caption text-muted-foreground">
								{link.description}{link.isUncertain ? ' (możliwe)' : ''}
							</span>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#if appState.selectedEntry}
	{@const entry = appState.selectedEntry}
	<button
		class="list-row mb-2 -ml-2 inline-flex items-center gap-1.5 px-2 text-label text-muted-foreground hover:text-foreground"
		onclick={() => geoportal.clearSearchSelection()}
	>
		<ArrowLeftIcon class="size-4" />
		{hasQuery ? 'Wróć do wyników' : 'Wróć do wyszukiwarki'}
	</button>

	<article aria-labelledby="entry-name">
		<h3 id="entry-name" class="font-serif text-title">{entry.name}</h3>
		<p class="text-sm text-muted-foreground">
			{entry.categoryLabel} · <span class="text-caption">{entry.code}</span>
		</p>

		{#if entry.modelPath}
			<div
				class="my-3 h-48 overflow-hidden rounded-md border border-edge bg-background shadow-well"
				aria-label="Podgląd 3D: {entry.name}"
				role="img"
				{@attach showPreview(entry.modelPath)}
			></div>
		{/if}

		{#if entry.facts.length > 0}
			<dl class="my-3 flex flex-wrap gap-x-5 gap-y-2 tabular-nums">
				{#each entry.facts as fact (fact.label)}
					<div class="flex flex-col-reverse">
						<dt class="text-caption text-muted-foreground">{fact.label}</dt>
						<dd class="text-xl text-primary">{fact.value}</dd>
					</div>
				{/each}
			</dl>
		{/if}

		{#if entry.lootSources.length > 0}
			<h4 class="group-label mt-4 mb-1">Może wypaść z (losowy łup)</h4>
			<ul class="text-sm">
				{#each entry.lootSources as source (source)}
					<li class="border-t border-border/60 px-1 py-1.5">{source}</li>
				{/each}
			</ul>
		{/if}

		{#if entry.type === 'quest'}
			{#if questDetails?.status === 'loading' || !questDetails}
				<div class="mt-3" role="status" aria-label="Wczytuję szczegóły questa">
					<span class="skeleton w-2/5"></span>
					<span class="skeleton mt-3 w-full"></span>
					<span class="skeleton mt-2 w-11/12"></span>
					<span class="skeleton mt-2 w-3/4"></span>
				</div>
			{:else if questDetails.status === 'error' || !questDetails.details}
				<p class="mt-3 text-sm text-destructive" role="alert">
					Nie udało się wczytać szczegółów questa. Sprawdź połączenie, wróć do wyników i otwórz
					quest ponownie.
				</p>
			{:else}
				{@const quest = questDetails.details}
				{#if quest.experienceLabel}
					<p class="mt-3 text-sm">
						<span class="text-muted-foreground">Nagroda:</span>
						{quest.experienceLabel}
					</p>
				{/if}
				{@render linkList(quest.giverHeading, quest.givers)}

				{#if quest.stages.length > 0}
					<h4 class="group-label mt-4 mb-1">Etapy dziennika</h4>
					<ol class="border-l border-primary/40 pl-3 text-sm">
						{#each quest.stages as stage (stage.seq)}
							<li class="relative py-1.5">
								{#if stage.text}
									<p class="leading-snug">{stage.text}</p>
								{/if}
								{#if stage.statusLabel}
									<p class="text-caption font-medium text-primary">{stage.statusLabel}</p>
								{/if}
								{#if stage.chapterLabel || stage.isConditional}
									<p class="text-caption text-muted-foreground">
										{[stage.chapterLabel, stage.isConditional ? 'zależnie od przebiegu' : null]
											.filter((part) => part !== null)
											.join(' · ')}
									</p>
								{/if}
							</li>
						{/each}
					</ol>
					<p class="mt-1 text-caption text-muted-foreground">
						Kolejność etapów wynika ze skryptów gry, nie jest pewną chronologią.
					</p>
				{/if}

				{@render linkList('Postacie', quest.people)}
				{@render linkList('Przedmioty', quest.items)}
			{/if}
		{/if}

		{#if entry.type === 'character' && relatedQuests}
			{#if relatedQuests.status === 'error'}
				<p class="mt-3 text-sm text-muted-foreground">Nie udało się wczytać questów postaci.</p>
			{:else if relatedQuests.status === 'ready'}
				{@render linkList(`Questy (${relatedQuests.quests.length})`, relatedQuests.quests)}
			{/if}
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
			<p class="-mt-1 mb-2 text-caption text-muted-foreground">Opisy: Gothicpedia (CC BY-SA)</p>
		{/if}

		<h4 class="group-label mt-4 mb-1">
			Miejsca ({entry.places.length}) — kliknij, aby polecieć
		</h4>
		<ul class="tabular-nums">
			{#each entry.places as place (place.index)}
				<li class="border-t border-border/60">
					<button
						class="list-row grid w-full grid-cols-[12px_1fr_auto] items-center gap-2.5 px-1 py-2 text-left"
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
								<span class="text-caption text-muted-foreground">(nie zawsze)</span>
							{:else if place.isRandomLoot}
								<span class="text-caption text-muted-foreground">(losowy łup)</span>
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
				class="chip"
				aria-pressed={appState.searchTypeFilter === filter.value}
				onclick={() => geoportal.filterSearchByType(filter.value)}
			>
				{filter.label}
			</button>
		{/each}
	</div>

	{#if !hasQuery}
		<p class="mt-4 text-sm text-muted-foreground">
			Wpisz nazwę przedmiotu, postaci albo questa w polu u góry, np. „ziele”, „Harad” albo „Bennet”.
			{#if appState.indexCounts}
				W tym świecie jest {appState.indexCounts.items} przedmiotów i {appState.indexCounts
					.characters} unikatowych postaci i {appState.indexCounts.quests} questów.
			{/if}
		</p>
	{:else if appState.searchIndexStatus === 'loading'}
		<div class="mt-4" role="status" aria-label="Wczytuję przedmioty i postacie świata">
			{#each [0, 1, 2] as row (row)}
				<span class="skeleton mt-3 w-full"></span>
			{/each}
		</div>
	{:else if appState.searchResults.length === 0}
		<div class="mt-4 text-sm" role="status">
			<p>Nic nie pasuje do „{appState.searchQuery.trim()}”.</p>
			{#if appState.searchTypeFilter !== 'all'}
				<p class="mt-1 text-muted-foreground">Szukasz tylko w jednym rodzaju wyników.</p>
				<button class="button-quiet mt-3" onclick={() => geoportal.filterSearchByType('all')}>
					Szukaj we wszystkich rodzajach
				</button>
			{:else}
				<p class="mt-1 text-muted-foreground">
					Spróbuj krótszej nazwy albo samego początku słowa, np. „miecz” zamiast „mieczyk”.
				</p>
			{/if}
		</div>
	{:else}
		<p class="mt-3 mb-1 text-sm text-muted-foreground">
			Wyniki: {appState.searchResults.length}
		</p>
		<ul>
			{#each appState.searchResults as result (result.id)}
				<li>
					<button
						class="list-row grid w-full grid-cols-[12px_1fr_auto] items-center gap-2.5 px-2 py-1.5 text-left"
						onclick={() => geoportal.selectSearchEntry(result.id)}
					>
						<span class="size-2.5 rounded-full" style:background-color={result.markerColor}></span>
						<span class="min-w-0">
							<span class="block truncate font-medium">{result.name}</span>
							<span class="block text-caption text-muted-foreground">{result.categoryLabel}</span>
						</span>
						<span class="text-caption text-muted-foreground tabular-nums">{result.summary}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
{/if}
