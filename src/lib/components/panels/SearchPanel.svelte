<script lang="ts">
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import type { Attachment } from 'svelte/attachments';
	import { appState, geoportal } from '#lib/composition-root.js';
	import CopyViewLinkButton from '#lib/components/shell/CopyViewLinkButton.svelte';
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

	const collectedPlaceKeys = $derived(appState.collectedPlaceKeysOfSelectedEntry);
	const collectiblePlaceCount = $derived(
		appState.selectedEntry?.places.filter((place) => place.isCollectible).length ?? 0
	);
	const collectedPlaceCount = $derived(
		appState.selectedEntry?.places.filter(
			(place) => place.isCollectible && collectedPlaceKeys.has(place.key)
		).length ?? 0
	);

	const relatedEntries = $derived(
		appState.relatedEntries && appState.relatedEntries.entryId === appState.selectedEntry?.id
			? appState.relatedEntries
			: null
	);

	const isAttributeFilterActive = $derived(
		appState.searchAttributeFilter.minimumLevel !== null ||
			appState.searchAttributeFilter.maximumLevel !== null ||
			appState.searchAttributeFilter.questChapter !== null
	);

	function readLevelBound(text: string): number | null {
		const level = Number.parseInt(text, 10);
		return Number.isFinite(level) && level >= 0 ? level : null;
	}

	function clearAttributeFilters(): void {
		geoportal.filterSearchByLevelRange(null, null);
		geoportal.filterSearchByQuestChapter(null);
	}

	const hasQuery = $derived(appState.searchQuery.trim().length > 0);

	const RESULTS_PAGE_SIZE = 60;
	let visibleResultsCount = $state(RESULTS_PAGE_SIZE);
	const visibleResults = $derived(appState.searchResults.slice(0, visibleResultsCount));

	$effect(() => {
		void appState.searchQuery;
		void appState.searchTypeFilter;
		void appState.searchCategoryFilter;
		visibleResultsCount = RESULTS_PAGE_SIZE;
	});

	function showPreview(modelPath: string): Attachment<HTMLElement> {
		return (container) => geoportal.showModelPreview(container, modelPath);
	}
</script>

{#snippet linkList(heading: string, links: readonly QuestLinkView[], hiddenCount = 0)}
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
		{#if hiddenCount > 0}
			<p class="px-1 pt-1 text-caption text-muted-foreground">…i jeszcze {hiddenCount}</p>
		{/if}
	{/if}
{/snippet}

{#if appState.selectedEntry}
	{@const entry = appState.selectedEntry}
	<button
		class="list-row mb-2 -ml-2 inline-flex items-center gap-1.5 px-2 text-label text-muted-foreground hover:text-foreground"
		onclick={() => geoportal.clearSearchSelection()}
	>
		<ArrowLeftIcon class="size-4" />
		{hasQuery ? 'Wróć do wyników' : 'Wróć do listy'}
	</button>

	<article aria-labelledby="entry-name">
		<h3 id="entry-name" class="font-serif text-title">{entry.name}</h3>
		<p class="text-sm text-muted-foreground">
			{entry.categoryLabel} · <span class="text-caption">{entry.code}</span>
		</p>

		<div class="mt-2 flex flex-wrap gap-2">
			{#if entry.type === 'quest'}
				<button
					class={appState.isSelectedQuestCollected ? 'button-ochre' : 'button-quiet'}
					aria-pressed={appState.isSelectedQuestCollected}
					onclick={() => geoportal.toggleCollectedStateOfSelectedQuest()}
				>
					{appState.isSelectedQuestCollected ? 'Quest wykonany' : 'Oznacz jako wykonany'}
				</button>
			{/if}
			<CopyViewLinkButton />
		</div>

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
				<div class="mt-3" role="status" aria-label="Wczytywanie szczegółów questa">
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

		{#each relatedEntries?.groups ?? [] as group (group.heading)}
			{@render linkList(
				`${group.heading} (${group.links.length + group.hiddenCount})`,
				group.links,
				group.hiddenCount
			)}
		{/each}

		{#if entry.type !== 'quest' && relatedQuests}
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
			Miejsca ({entry.places.length}): kliknij, aby polecieć
		</h4>
		{#if collectiblePlaceCount > 0}
			<div class="mb-1 flex flex-wrap items-center justify-between gap-2">
				<p class="text-sm tabular-nums" role="status">
					Zebrano {collectedPlaceCount} z {collectiblePlaceCount} miejsc
				</p>
				<button
					class="button-quiet"
					onclick={() =>
						geoportal.setCollectedStateOfAllPlacesOfSelectedItem(
							collectedPlaceCount < collectiblePlaceCount
						)}
				>
					{collectedPlaceCount < collectiblePlaceCount ? 'Zbierz wszystkie' : 'Odznacz wszystkie'}
				</button>
			</div>
		{/if}
		<ul class="tabular-nums">
			{#each entry.places as place (place.index)}
				<li
					class="flex items-center border-t border-border/60 {collectedPlaceKeys.has(place.key)
						? 'opacity-60'
						: ''}"
				>
					{#if place.isCollectible}
						<input
							type="checkbox"
							class="mx-2 size-5 shrink-0 accent-primary"
							aria-label="Zebrane: {place.description}"
							checked={collectedPlaceKeys.has(place.key)}
							onchange={() => geoportal.toggleCollectedStateOfPlaceOfSelectedItem(place.key)}
						/>
					{/if}
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

	{#if appState.searchCategories.length > 1}
		<label class="mt-2 block">
			<span class="sr-only">Kategoria</span>
			<select
				class="field w-full"
				value={appState.searchCategoryFilter ?? ''}
				onchange={(event) => geoportal.filterSearchByCategory(event.currentTarget.value || null)}
			>
				<option value="">Wszystkie kategorie</option>
				{#each appState.searchCategories as category (category.label)}
					<option value={category.label}>{category.label} ({category.count})</option>
				{/each}
			</select>
		</label>
	{/if}

	{#if appState.searchTypeFilter === 'character'}
		<div class="mt-2 grid grid-cols-2 gap-2">
			<label class="text-sm">
				<span class="text-caption text-muted-foreground">Poziom od</span>
				<input
					type="number"
					min="0"
					inputmode="numeric"
					class="field w-full"
					value={appState.searchAttributeFilter.minimumLevel ?? ''}
					onchange={(event) =>
						geoportal.filterSearchByLevelRange(
							readLevelBound(event.currentTarget.value),
							appState.searchAttributeFilter.maximumLevel
						)}
				/>
			</label>
			<label class="text-sm">
				<span class="text-caption text-muted-foreground">Poziom do</span>
				<input
					type="number"
					min="0"
					inputmode="numeric"
					class="field w-full"
					value={appState.searchAttributeFilter.maximumLevel ?? ''}
					onchange={(event) =>
						geoportal.filterSearchByLevelRange(
							appState.searchAttributeFilter.minimumLevel,
							readLevelBound(event.currentTarget.value)
						)}
				/>
			</label>
		</div>
	{:else if appState.searchTypeFilter === 'quest' && appState.areChaptersAvailable}
		<label class="mt-2 block">
			<span class="sr-only">Rozdział questa</span>
			<select
				class="field w-full"
				value={appState.searchAttributeFilter.questChapter ?? ''}
				onchange={(event) => {
					const chapter = appState.chapterOptions.find(
						(option) => String(option.chapter) === event.currentTarget.value
					);
					geoportal.filterSearchByQuestChapter(chapter?.chapter ?? null);
				}}
			>
				<option value="">Wszystkie rozdziały</option>
				{#each appState.chapterOptions as option (option.chapter)}
					<option value={option.chapter}>Rozdział {option.label}</option>
				{/each}
			</select>
		</label>
	{/if}

	{#if appState.searchIndexStatus === 'loading'}
		<div class="mt-4" role="status" aria-label="Wczytywanie przedmiotów i postaci świata">
			{#each [0, 1, 2] as row (row)}
				<span class="skeleton mt-3 w-full"></span>
			{/each}
		</div>
	{:else if appState.searchResults.length === 0}
		<div class="mt-4 text-sm" role="status">
			{#if hasQuery}
				<p>Brak wyników dla „{appState.searchQuery.trim()}”.</p>
			{:else}
				<p>Brak wyników do wyświetlenia.</p>
			{/if}
			{#if isAttributeFilterActive}
				<p class="mt-1 text-muted-foreground">Żaden wpis nie spełnia wybranych filtrów.</p>
				<button class="button-quiet mt-3" onclick={clearAttributeFilters}>Wyczyść filtry</button>
			{:else if appState.searchTypeFilter !== 'all'}
				<p class="mt-1 text-muted-foreground">Wyszukiwanie obejmuje jeden rodzaj wyników.</p>
				<button class="button-quiet mt-3" onclick={() => geoportal.filterSearchByType('all')}>
					Szukaj we wszystkich rodzajach
				</button>
			{:else if appState.searchCategoryFilter !== null}
				<button class="button-quiet mt-3" onclick={() => geoportal.filterSearchByCategory(null)}>
					Pokaż wszystkie kategorie
				</button>
			{:else if hasQuery}
				<p class="mt-1 text-muted-foreground">
					Wpisz krótszą nazwę lub początek słowa, np. „miecz” zamiast „mieczyk”.
				</p>
			{/if}
		</div>
	{:else}
		{#if !hasQuery}
			<p class="mt-3 text-sm text-muted-foreground">
				Lista wszystkich wpisów w kolejności alfabetycznej (A–Z). Aby ją zawęzić, wpisz nazwę w polu
				wyszukiwania, np. „ziele”, „Harad” albo „Bennet”.
				{#if appState.indexCounts}
					Przedmioty: {appState.indexCounts.items}, unikatowe postacie: {appState.indexCounts
						.characters}, questy: {appState.indexCounts.quests}.
				{/if}
			</p>
		{/if}
		<p class="mt-3 mb-1 text-sm text-muted-foreground">
			{hasQuery ? 'Wyniki' : 'Wszystko'}: {appState.searchResults.length}
		</p>
		<ul>
			{#each visibleResults as result (result.id)}
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
		{#if appState.searchResults.length > visibleResultsCount}
			<button
				class="button-quiet mt-2 w-full"
				onclick={() => (visibleResultsCount += RESULTS_PAGE_SIZE)}
			>
				Pokaż więcej ({appState.searchResults.length - visibleResultsCount} pozostało)
			</button>
		{/if}
	{/if}
{/if}
