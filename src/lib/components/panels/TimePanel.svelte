<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';
	import ForgedRange from '#lib/components/controls/ForgedRange.svelte';

	const PRESETS = [
		{ label: 'Świt', minuteOfDay: 6 * 60 },
		{ label: 'Południe', minuteOfDay: 12 * 60 },
		{ label: 'Zmierzch', minuteOfDay: 18 * 60 },
		{ label: 'Północ', minuteOfDay: 0 }
	] as const;

	const isLayerOn = $derived(
		appState.routineLayerStatus === 'visible' || appState.routineLayerStatus === 'loading'
	);
</script>

<p class="text-sm text-muted-foreground">Pora dnia w świecie gry</p>
<p class="font-heading text-hero text-primary tabular-nums">{appState.timeOfDayLabel}</p>

<ForgedRange
	min={0}
	max={24 * 60 - 5}
	step={5}
	value={appState.minuteOfDay}
	label="Godzina w grze"
	valueText={appState.timeOfDayLabel}
	onValueChange={(minuteOfDay) => geoportal.setTimeOfDay(minuteOfDay)}
/>
<div class="mt-2 flex flex-wrap gap-1.5">
	{#each PRESETS as preset (preset.label)}
		<button class="chip" onclick={() => geoportal.setTimeOfDay(preset.minuteOfDay)}>
			{preset.label}
		</button>
	{/each}
</div>

<h3 class="group-label mt-5 mb-1">Rozdział</h3>
<div class="flex flex-wrap gap-1.5" role="group" aria-label="Rozdział gry">
	<button
		class="chip tabular-nums"
		aria-pressed={appState.selectedChapter === null}
		onclick={() => geoportal.selectChapter(null)}
	>
		Wszystkie
	</button>
	{#each appState.chapterOptions as option (option.chapter)}
		<button
			class="chip tabular-nums"
			aria-pressed={appState.selectedChapter === option.chapter}
			onclick={() => geoportal.selectChapter(option.chapter)}
		>
			{option.label}
		</button>
	{/each}
</div>
<p class="mt-1 text-caption text-muted-foreground">
	Wybrany rozdział pokazuje postacie, które do niego pojawiły się w świecie (warstwy postaci i
	„postacie o tej godzinie”).
</p>

<label class="mt-5 flex cursor-pointer items-start gap-2.5 border-t border-border/60 pt-3">
	<input
		type="checkbox"
		class="check-forged mt-0.5"
		checked={isLayerOn}
		disabled={appState.routineLayerStatus === 'loading'}
		onchange={() => geoportal.toggleCharactersAtTimeOfDay()}
	/>
	<span>
		Pokaż, gdzie są postacie o tej godzinie
		<span class="block text-caption text-muted-foreground">
			{#if appState.routineLayerStatus === 'loading'}
				Wczytywanie rutyn dnia…
			{:else if appState.charactersAtTimeOfDay !== null}
				Postaci na mapie: {appState.charactersAtTimeOfDay}. Kliknij punkt, żeby zobaczyć kto i co
				robi.
			{:else}
				Według codziennych rutyn unikatowych postaci.
			{/if}
		</span>
	</span>
</label>

{#if appState.dataLayerErrorMessage}
	<p class="mt-2 text-sm text-destructive" role="alert">{appState.dataLayerErrorMessage}</p>
{/if}

<h3 class="group-label mt-5 mb-1">Światło</h3>
<label class="flex cursor-pointer items-start gap-2.5 border-t border-border/60 pt-3">
	<input
		type="checkbox"
		class="check-forged mt-0.5"
		checked={appState.shadows.areEnabled}
		onchange={(event) =>
			geoportal.setShadows({ ...appState.shadows, areEnabled: event.currentTarget.checked })}
	/>
	<span>
		Cienie
		<span class="block text-caption text-muted-foreground">
			Budynki i skały rzucają cień zgodny z porą dnia. Obciąża kartę graficzną.
		</span>
		{#if appState.cameraProjection.kind === 'orthographic'}
			<span class="block text-caption text-muted-foreground">
				W rzucie ortogonalnym cienie są wyłączone.
			</span>
		{/if}
	</span>
</label>
<label
	class="mt-2 flex items-start gap-2.5 pl-6.5 {appState.shadows.areEnabled
		? 'cursor-pointer'
		: 'opacity-50'}"
>
	<input
		type="checkbox"
		class="check-forged mt-0.5"
		checked={appState.shadows.areSoft}
		disabled={!appState.shadows.areEnabled}
		onchange={(event) =>
			geoportal.setShadows({ ...appState.shadows, areSoft: event.currentTarget.checked })}
	/>
	<span>
		Gładkie cienie
		<span class="block text-caption text-muted-foreground"
			>Miękkie krawędzie, większa mapa cieni.</span
		>
	</span>
</label>

<p class="mt-5 text-caption text-muted-foreground">Światło mapy podąża za porą dnia.</p>
