<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';

	const MODES = [
		{ value: 'nearest', label: 'Najbliższe', hint: 'pięć najbliższych miejsc' },
		{ value: 'buffer', label: 'Zasięg', hint: 'co leży w promieniu' },
		{ value: 'density', label: 'Zagęszczenie', hint: 'mapa komórek' }
	] as const;

	const CELL_SHAPES = [
		{ value: 'hex', label: 'Sześciokąty' },
		{ value: 'square', label: 'Kwadraty' }
	] as const;

	const analysis = $derived(appState.analysis);
</script>

{#snippet subjectPicker()}
	<h3 class="mt-4 mb-1 text-sm font-medium text-muted-foreground">Czego szukamy</h3>
	{#if analysis?.subject}
		<div
			class="flex items-center justify-between gap-2 rounded-sm border border-primary bg-secondary px-3 py-2"
		>
			<span>
				<span class="font-serif text-[17px]">{analysis.subject.name}</span>
				<span class="block text-xs text-muted-foreground">
					{analysis.subject.placeCount} miejsc w świecie
				</span>
			</span>
			<button
				class="shrink-0 rounded-sm border border-border px-2.5 py-1 text-sm hover:border-primary/60"
				onclick={() => geoportal.clearAnalysisSubject()}
			>
				Zmień
			</button>
		</div>
	{:else if analysis}
		<input
			type="search"
			class="w-full rounded-sm border border-input bg-background px-3 py-2 text-sm"
			placeholder="Szukaj przedmiotu lub postaci…"
			aria-label="Temat analizy"
			value={analysis.subjectQuery}
			oninput={(event) => geoportal.setAnalysisSubjectQuery(event.currentTarget.value)}
		/>
		{#if analysis.subjectQuery.trim() && analysis.subjectSuggestions.length === 0}
			<p class="mt-2 text-sm text-muted-foreground">
				Nic nie znaleziono. Spróbuj krótszej nazwy albo innej kategorii.
			</p>
		{/if}
		<ul class="mt-1">
			{#each analysis.subjectSuggestions as suggestion (suggestion.id)}
				<li>
					<button
						class="flex w-full items-baseline justify-between gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-secondary"
						onclick={() => geoportal.selectAnalysisSubject(suggestion.id)}
					>
						<span>
							{suggestion.name}
							<span class="text-xs text-muted-foreground">{suggestion.categoryLabel}</span>
						</span>
						<span class="shrink-0 text-xs text-muted-foreground tabular-nums">
							{suggestion.summary}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#snippet originReading()}
	<h3 class="mt-4 mb-1 text-sm font-medium text-muted-foreground">Punkt odniesienia</h3>
	{#if analysis?.origin}
		<p class="text-sm tabular-nums">
			E {appState.formatLength(analysis.origin.east)} · N {appState.formatLength(
				analysis.origin.north
			)}
		</p>
	{:else}
		<p class="text-sm text-muted-foreground">Kliknij punkt na mapie.</p>
	{/if}
{/snippet}

{#if analysis}
	<div class="grid grid-cols-3 gap-2" role="group" aria-label="Rodzaj analizy">
		{#each MODES as option (option.value)}
			<button
				class="flex flex-col rounded-sm border p-2 text-left {analysis.mode === option.value
					? 'border-primary bg-secondary'
					: 'border-border hover:border-primary/50'}"
				aria-pressed={analysis.mode === option.value}
				onclick={() => geoportal.switchAnalysisMode(option.value)}
			>
				<span class="text-[14px] font-medium">{option.label}</span>
				<span class="text-[11.5px] leading-tight text-muted-foreground">{option.hint}</span>
			</button>
		{/each}
	</div>

	{#if analysis.mode === 'nearest'}
		<p class="mt-3 text-[13px] text-muted-foreground">
			Wybierz przedmiot albo postać i wskaż punkt na mapie — pokażemy pięć najbliższych miejsc.
		</p>
		{@render subjectPicker()}
		{@render originReading()}

		{#if analysis.subject && analysis.origin}
			<h3 class="mt-4 mb-1 text-sm font-medium text-muted-foreground">Najbliższe miejsca</h3>
			<ol class="space-y-1">
				{#each analysis.nearestPlaces as place (place.index)}
					<li>
						<button
							class="flex w-full items-center gap-3 rounded-sm border border-border px-2.5 py-2 text-left hover:border-primary/60"
							onclick={() => geoportal.flyToNearestPlace(place.index)}
						>
							<span
								class="grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium text-background"
								style:background-color={place.color}
							>
								{place.index + 1}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate">{place.description}</span>
								{#if place.kindLabel}
									<span class="block text-xs text-muted-foreground">{place.kindLabel}</span>
								{/if}
							</span>
							<span class="shrink-0 text-right tabular-nums">
								<span class="block text-primary">{appState.formatLength(place.straightMetres)}</span
								>
								<span class="block text-xs text-muted-foreground">
									w poziomie {appState.formatLength(place.horizontalMetres)}
								</span>
							</span>
						</button>
					</li>
				{/each}
			</ol>
		{/if}
	{:else if analysis.mode === 'buffer'}
		<p class="mt-3 text-[13px] text-muted-foreground">
			Wskaż punkt na mapie i ustaw promień — wypiszemy przedmioty, skrzynie i postacie w środku.
		</p>
		<label class="mt-4 block">
			<span class="flex items-baseline justify-between text-sm font-medium text-muted-foreground">
				Promień
				<span class="text-base text-primary tabular-nums">{analysis.radiusMetres} m</span>
			</span>
			<input
				type="range"
				class="mt-1 w-full accent-[var(--primary)]"
				min="10"
				max="300"
				step="10"
				value={analysis.radiusMetres}
				aria-label="Promień zasięgu w metrach"
				oninput={(event) => geoportal.setAnalysisRadius(Number(event.currentTarget.value))}
			/>
		</label>
		{@render originReading()}

		{#if analysis.origin}
			<h3 class="mt-4 mb-1 text-sm font-medium text-muted-foreground">
				W promieniu {analysis.radiusMetres} m
			</h3>
			{#if analysis.isLoading}
				<p class="text-sm text-muted-foreground">Wczytuję przedmioty, skrzynie i postacie…</p>
			{/if}
			{#each analysis.bufferGroups as group (group.id)}
				<section class="mb-3 border-t border-border/60 pt-2" aria-label={group.name}>
					<h4 class="flex items-baseline justify-between text-sm">
						<span class="flex items-center gap-2">
							<span class="size-2.5 rounded-full" style:background-color={group.color}></span>
							{group.name}
						</span>
						<span class="text-primary tabular-nums">{group.total}</span>
					</h4>
					{#if group.lines.length === 0}
						<p class="mt-1 text-[13px] text-muted-foreground">Nic w tym zasięgu.</p>
					{:else}
						<ul class="mt-1 text-sm">
							{#each group.lines as line (line.label)}
								<li class="flex justify-between gap-2 py-0.5">
									<span class="min-w-0 truncate">{line.label}</span>
									<span class="shrink-0 text-muted-foreground tabular-nums">×{line.quantity}</span>
								</li>
							{/each}
						</ul>
						{#if group.hiddenLineCount > 0}
							<p class="mt-1 text-xs text-muted-foreground">
								…i {group.hiddenLineCount} innych pozycji.
							</p>
						{/if}
					{/if}
				</section>
			{/each}
		{/if}
	{:else}
		<p class="mt-3 text-[13px] text-muted-foreground">
			Wybierz przedmiot albo postać — pokolorujemy komórki siatki według liczby sztuk w każdej.
		</p>
		{@render subjectPicker()}

		<h3 class="mt-4 mb-1 text-sm font-medium text-muted-foreground">Siatka</h3>
		<div class="grid grid-cols-2 gap-2" role="group" aria-label="Kształt komórki">
			{#each CELL_SHAPES as shape (shape.value)}
				<button
					class="rounded-sm border px-2.5 py-1.5 text-sm {analysis.cellShape === shape.value
						? 'border-primary bg-secondary'
						: 'border-border hover:border-primary/50'}"
					aria-pressed={analysis.cellShape === shape.value}
					onclick={() => geoportal.setAnalysisCellShape(shape.value)}
				>
					{shape.label}
				</button>
			{/each}
		</div>
		<label class="mt-3 block">
			<span class="flex items-baseline justify-between text-sm font-medium text-muted-foreground">
				Rozmiar komórki
				<span class="text-base text-primary tabular-nums">{analysis.cellSizeMetres} m</span>
			</span>
			<input
				type="range"
				class="mt-1 w-full accent-[var(--primary)]"
				min="10"
				max="100"
				step="5"
				value={analysis.cellSizeMetres}
				aria-label="Rozmiar komórki w metrach"
				oninput={(event) => geoportal.setAnalysisCellSize(Number(event.currentTarget.value))}
			/>
		</label>

		{#if analysis.subject && analysis.density}
			<h3 class="mt-4 mb-1 text-sm font-medium text-muted-foreground">Legenda</h3>
			<ul
				class="flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums"
				aria-label="Legenda zagęszczenia"
			>
				{#each analysis.density.legend as step (step.label)}
					<li class="flex items-center gap-1.5">
						<span class="size-3.5 rounded-sm" style:background-color={step.color}></span>
						{step.label} szt.
					</li>
				{/each}
			</ul>
			<p class="mt-2 text-[13px] text-muted-foreground tabular-nums">
				Komórek z wynikiem: {analysis.density.cellCount} · sztuk razem: {analysis.density
					.totalCount} · najwięcej w jednej: {analysis.density.maximumCount}
			</p>
		{/if}
	{/if}
{/if}
