<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';

	const TYPE_FILTERS = [
		{ value: 'all', label: 'Wszystko' },
		{ value: 'item', label: 'Przedmioty' },
		{ value: 'character', label: 'Postacie' },
		{ value: 'quest', label: 'Questy' }
	] as const;

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

	function selectFirstResultOnEnter(event: KeyboardEvent): void {
		const firstResult = appState.searchResults.at(0);
		if (event.key === 'Enter' && firstResult) geoportal.selectSearchEntry(firstResult.id);
	}
</script>

<div
	class="flex h-full min-h-0 flex-col border-border px-5 pt-6 pb-4 max-md:px-4 md:border-r {appState.selectedEntry
		? 'max-md:hidden'
		: ''}"
>
	<label class="block">
		<span class="sr-only">Szukaj przedmiotu lub postaci</span>
		<input
			class="field"
			type="search"
			placeholder="Szukaj przedmiotu lub postaci…"
			aria-label="Szukaj przedmiotu lub postaci"
			value={appState.searchQuery}
			oninput={(event) => geoportal.search(event.currentTarget.value)}
			onkeydown={selectFirstResultOnEnter}
		/>
	</label>
	<div class="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
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
					Lista wszystkich wpisów w kolejności alfabetycznej (A–Z). Aby ją zawęzić, wpisz nazwę w
					polu wyszukiwania, np. „ziele”, „Harad” albo „Bennet”.
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
							<span class="size-2.5 rounded-full" style:background-color={result.markerColor}
							></span>
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
	</div>
</div>
