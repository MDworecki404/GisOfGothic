<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';

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
<p class="text-[34px] leading-tight text-primary tabular-nums">{appState.timeOfDayLabel}</p>

<input
	type="range"
	class="mt-2 w-full accent-[var(--primary)]"
	min="0"
	max={24 * 60 - 5}
	step="5"
	value={appState.minuteOfDay}
	aria-label="Godzina w grze"
	aria-valuetext={appState.timeOfDayLabel}
	oninput={(event) => geoportal.setTimeOfDay(Number(event.currentTarget.value))}
/>
<div class="mt-2 flex flex-wrap gap-1.5">
	{#each PRESETS as preset (preset.label)}
		<button
			class="rounded-full border border-border px-2.5 py-0.5 text-[13px] text-muted-foreground hover:text-foreground"
			onclick={() => geoportal.setTimeOfDay(preset.minuteOfDay)}
		>
			{preset.label}
		</button>
	{/each}
</div>

<label class="mt-5 flex cursor-pointer items-start gap-2.5 border-t border-border/60 pt-3">
	<input
		type="checkbox"
		class="mt-1 size-4 accent-[var(--primary)]"
		checked={isLayerOn}
		disabled={appState.routineLayerStatus === 'loading'}
		onchange={() => geoportal.toggleCharactersAtTimeOfDay()}
	/>
	<span>
		Pokaż, gdzie są postacie o tej godzinie
		<span class="block text-[13px] text-muted-foreground">
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

<h3 class="mt-5 mb-1 text-sm font-medium text-muted-foreground">Światło</h3>
<label class="flex cursor-pointer items-start gap-2.5 border-t border-border/60 pt-3">
	<input
		type="checkbox"
		class="mt-1 size-4 accent-[var(--primary)]"
		checked={appState.shadows.areEnabled}
		onchange={(event) =>
			geoportal.setShadows({ ...appState.shadows, areEnabled: event.currentTarget.checked })}
	/>
	<span>
		Cienie
		<span class="block text-[13px] text-muted-foreground">
			Budynki i skały rzucają cień zgodny z porą dnia. Obciąża kartę graficzną.
		</span>
	</span>
</label>
<label
	class="mt-2 flex items-start gap-2.5 pl-6.5 {appState.shadows.areEnabled
		? 'cursor-pointer'
		: 'opacity-50'}"
>
	<input
		type="checkbox"
		class="mt-1 size-4 accent-[var(--primary)]"
		checked={appState.shadows.areSoft}
		disabled={!appState.shadows.areEnabled}
		onchange={(event) =>
			geoportal.setShadows({ ...appState.shadows, areSoft: event.currentTarget.checked })}
	/>
	<span>
		Gładkie cienie
		<span class="block text-[13px] text-muted-foreground"
			>Miękkie krawędzie, większa mapa cieni.</span
		>
	</span>
</label>

<p class="mt-5 text-[13px] text-muted-foreground">
	Światło mapy podąża za porą dnia. Wybór rozdziału — wkrótce.
</p>
