<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';
	import ForgedRange from '#lib/components/controls/ForgedRange.svelte';

	const MODES = [
		{ value: 'nearest', label: 'Najbliższe', hint: 'pięć najbliższych miejsc' },
		{ value: 'buffer', label: 'Zasięg', hint: 'co leży w promieniu' },
		{ value: 'density', label: 'Zagęszczenie', hint: 'mapa komórek' },
		{ value: 'visibility', label: 'Widoczność', hint: 'co widać z punktu' }
	] as const;

	const CELL_SHAPES = [
		{ value: 'hex', label: 'Sześciokąty' },
		{ value: 'square', label: 'Kwadraty' }
	] as const;

	const analysis = $derived(appState.analysis);
</script>

{#snippet subjectPicker()}
	<h3 class="group-label mt-4 mb-1">Czego szukamy</h3>
	{#if analysis?.subject}
		<div
			class="flex items-center justify-between gap-2 rounded-md border border-active bg-active-surface px-3 py-2"
		>
			<span>
				<span class="font-serif text-lead">{analysis.subject.name}</span>
				<span class="block text-caption text-muted-foreground">
					{analysis.subject.placeCount} miejsc w świecie
				</span>
			</span>
			<button class="button-quiet shrink-0" onclick={() => geoportal.clearAnalysisSubject()}>
				Zmień
			</button>
		</div>
	{:else if analysis}
		<input
			type="search"
			class="field"
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
						class="list-row flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left"
						onclick={() => geoportal.selectAnalysisSubject(suggestion.id)}
					>
						<span>
							{suggestion.name}
							<span class="text-caption text-muted-foreground">{suggestion.categoryLabel}</span>
						</span>
						<span class="shrink-0 text-caption text-muted-foreground tabular-nums">
							{suggestion.summary}
						</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

{#snippet originReading()}
	<h3 class="group-label mt-4 mb-1">Punkt odniesienia</h3>
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
	<div class="grid grid-cols-2 gap-2" role="group" aria-label="Rodzaj analizy">
		{#each MODES as option (option.value)}
			<button
				class="choice-card"
				aria-pressed={analysis.mode === option.value}
				onclick={() => geoportal.switchAnalysisMode(option.value)}
			>
				<span class="font-medium">{option.label}</span>
				<span class="text-caption leading-tight text-muted-foreground">{option.hint}</span>
			</button>
		{/each}
	</div>

	{#if analysis.mode === 'nearest'}
		<p class="mt-3 text-caption text-muted-foreground">
			Wybierz przedmiot albo postać i wskaż punkt na mapie — pokażemy pięć najbliższych miejsc.
		</p>
		{@render subjectPicker()}
		{@render originReading()}

		{#if analysis.subject && analysis.origin}
			<h3 class="group-label mt-4 mb-1">Najbliższe miejsca</h3>
			<ol class="space-y-1">
				{#each analysis.nearestPlaces as place (place.index)}
					<li>
						<button
							class="list-row flex w-full items-center gap-3 border border-border px-2.5 py-2 text-left"
							onclick={() => geoportal.flyToNearestPlace(place.index)}
						>
							<span
								class="grid size-6 shrink-0 place-items-center rounded-full text-caption font-medium text-background"
								style:background-color={place.color}
							>
								{place.index + 1}
							</span>
							<span class="min-w-0 flex-1">
								<span class="block truncate">{place.description}</span>
								{#if place.kindLabel}
									<span class="block text-caption text-muted-foreground">{place.kindLabel}</span>
								{/if}
							</span>
							<span class="shrink-0 text-right tabular-nums">
								<span class="block text-primary">{appState.formatLength(place.straightMetres)}</span
								>
								<span class="block text-caption text-muted-foreground">
									w poziomie {appState.formatLength(place.horizontalMetres)}
								</span>
							</span>
						</button>
					</li>
				{/each}
			</ol>
		{/if}
	{:else if analysis.mode === 'buffer'}
		<p class="mt-3 text-caption text-muted-foreground">
			Wskaż punkt na mapie i ustaw promień — wypiszemy przedmioty, skrzynie i postacie w środku.
		</p>
		<label class="mt-4 block">
			<span class="flex items-baseline justify-between text-sm font-medium text-muted-foreground">
				Promień
				<span class="text-base text-primary tabular-nums">{analysis.radiusMetres} m</span>
			</span>
			<ForgedRange
				min={10}
				max={300}
				step={10}
				value={analysis.radiusMetres}
				label="Promień zasięgu w metrach"
				onValueChange={(value) => geoportal.setAnalysisRadius(value)}
			/>
		</label>
		{@render originReading()}

		{#if analysis.origin}
			<h3 class="group-label mt-4 mb-1">
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
						<p class="mt-1 text-caption text-muted-foreground">Nic w tym zasięgu.</p>
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
							<p class="mt-1 text-caption text-muted-foreground">
								…i {group.hiddenLineCount} innych pozycji.
							</p>
						{/if}
					{/if}
				</section>
			{/each}
		{/if}
	{:else if analysis.mode === 'visibility'}
		<p class="mt-3 text-caption text-muted-foreground">
			Wskaż punkt na mapie — zaznaczymy teren, który widać z wysokości oczu stojącego człowieka.
		</p>
		<label class="mt-4 block">
			<span class="flex items-baseline justify-between text-sm font-medium text-muted-foreground">
				Promień widoczności
				<span class="text-base text-primary tabular-nums">{analysis.radiusMetres} m</span>
			</span>
			<ForgedRange
				min={30}
				max={300}
				step={10}
				value={analysis.radiusMetres}
				label="Promień widoczności w metrach"
				onValueChange={(value) => geoportal.setAnalysisRadius(value)}
			/>
		</label>
		{@render originReading()}

		{#if analysis.origin}
			<h3 class="group-label mt-4 mb-1">Wynik</h3>
			{#if analysis.isLoading}
				<p class="text-sm text-muted-foreground">Liczę widoczność…</p>
			{:else if analysis.viewshed && analysis.viewshed.hasCells}
				<p class="text-sm">
					Z tego miejsca widać
					<span class="text-primary tabular-nums">{analysis.viewshed.visiblePercent}%</span>
					terenu w promieniu {analysis.viewshed.radiusMetres} m (oczy na wysokości {analysis.viewshed.eyeHeightMetres
						.toString()
						.replace('.', ',')} m).
				</p>
				<ul class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm" aria-label="Legenda widoczności">
					<li class="flex items-center gap-1.5">
						<span class="size-3.5 rounded-sm bg-[#6fae5a]"></span>
						widać
					</li>
					<li class="flex items-center gap-1.5">
						<span class="size-3.5 rounded-sm bg-[#8b3a2b]"></span>
						zasłonięte
					</li>
				</ul>
				{#if analysis.viewshed.unknownCellCount > 0}
					<p class="mt-2 text-caption text-muted-foreground">
						Pominięto {analysis.viewshed.unknownCellCount} pól bez terenu albo jeszcze niewczytanych.
					</p>
				{/if}
			{:else if analysis.viewshed}
				<p class="text-sm text-muted-foreground">
					Nie udało się odczytać terenu wokół tego punktu. Przybliż mapę i spróbuj ponownie.
				</p>
			{/if}
		{/if}
	{:else}
		<p class="mt-3 text-caption text-muted-foreground">
			Wybierz przedmiot albo postać — pokolorujemy komórki siatki według liczby sztuk w każdej.
		</p>
		{@render subjectPicker()}

		<h3 class="group-label mt-4 mb-1">Siatka</h3>
		<div class="grid grid-cols-2 gap-2" role="group" aria-label="Kształt komórki">
			{#each CELL_SHAPES as shape (shape.value)}
				<button
					class="choice-card items-center justify-center"
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
			<ForgedRange
				min={10}
				max={100}
				step={5}
				value={analysis.cellSizeMetres}
				label="Rozmiar komórki w metrach"
				onValueChange={(value) => geoportal.setAnalysisCellSize(value)}
			/>
		</label>

		{#if analysis.subject && analysis.density}
			<h3 class="group-label mt-4 mb-1">Legenda</h3>
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
			<p class="mt-2 text-caption text-muted-foreground tabular-nums">
				Komórek z wynikiem: {analysis.density.cellCount} · sztuk razem: {analysis.density
					.totalCount} · najwięcej w jednej: {analysis.density.maximumCount}
			</p>
		{/if}
	{/if}
{/if}
