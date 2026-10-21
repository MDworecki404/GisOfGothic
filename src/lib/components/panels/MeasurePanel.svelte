<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';
	import ProfileChart from './ProfileChart.svelte';

	const MODES = [
		{ value: 'distance', label: 'Odległość', hint: 'łamana po kliknięciach' },
		{ value: 'area', label: 'Pole', hint: 'wielokąt, pole i obwód' },
		{ value: 'point', label: 'Współrzędne', hint: 'punkt i komenda Marvina' }
	] as const;

	const mode = $derived(appState.measurement?.mode ?? 'distance');
	const pointCount = $derived(appState.measurement?.pointCount ?? 0);
	let copiedCommand = $state<string | null>(null);

	async function copyMarvinCommand(command: string): Promise<void> {
		await navigator.clipboard.writeText(command);
		copiedCommand = command;
	}
</script>

<div class="grid grid-cols-3 gap-2" role="group" aria-label="Rodzaj pomiaru">
	{#each MODES as option (option.value)}
		<button
			class="flex flex-col rounded-sm border p-2 text-left {mode === option.value
				? 'border-primary bg-secondary'
				: 'border-border hover:border-primary/50'}"
			aria-pressed={mode === option.value}
			onclick={() => geoportal.switchMeasurementMode(option.value)}
		>
			<span class="text-[14px] font-medium">{option.label}</span>
			<span class="text-[11.5px] leading-tight text-muted-foreground">{option.hint}</span>
		</button>
	{/each}
</div>

{#if mode === 'area'}
	{#if pointCount < 3}
		<p class="mt-4 text-sm text-muted-foreground">
			{pointCount === 0
				? 'Klikaj kolejne wierzchołki wielokąta na mapie. Od trzeciego policzymy pole i obwód.'
				: 'Kliknij kolejne wierzchołki — wielokąt potrzebuje co najmniej trzech.'}
		</p>
	{:else}
		<div class="mt-4 border-l-2 border-primary bg-background/50 px-3.5 py-3 tabular-nums">
			<p class="text-sm text-muted-foreground">Pole (w rzucie poziomym)</p>
			<p class="text-[26px] leading-tight text-primary">{appState.areaHeadline}</p>
			<dl class="mt-2 text-sm">
				{#each appState.areaReadings as reading (reading.label)}
					<div class="flex justify-between py-0.5">
						<dt class="text-muted-foreground">{reading.label}</dt>
						<dd>{reading.value}</dd>
					</div>
				{/each}
			</dl>
		</div>
	{/if}

	{#if pointCount > 0}
		<div class="mt-3 flex gap-2">
			<button
				class="rounded-sm border border-border px-3 py-1.5 text-sm hover:border-primary/60"
				onclick={() => geoportal.removeLastMeasurementPoint()}
			>
				Cofnij punkt
			</button>
			<button
				class="rounded-sm border border-border px-3 py-1.5 text-sm hover:border-primary/60"
				onclick={() => geoportal.clearMeasurement()}
			>
				Wyczyść pomiar
			</button>
		</div>
	{/if}
{:else if mode === 'distance'}
	{#if pointCount < 2}
		<p class="mt-4 text-sm text-muted-foreground">
			{pointCount === 0
				? 'Klikaj kolejne punkty na mapie. Odległość policzymy po terenie, razem z profilem wysokości.'
				: 'Kliknij następny punkt.'}
		</p>
	{:else}
		<div class="mt-4 border-l-2 border-primary bg-background/50 px-3.5 py-3 tabular-nums">
			<p class="text-sm text-muted-foreground">
				{appState.measurement?.profile ? 'Odległość po terenie' : 'Odległość w linii prostej'}
			</p>
			<p class="text-[26px] leading-tight text-primary">{appState.distanceHeadline}</p>
			<dl class="mt-2 text-sm">
				{#each appState.distanceReadings as reading (reading.label)}
					<div class="flex justify-between py-0.5">
						<dt class="text-muted-foreground">{reading.label}</dt>
						<dd>{reading.value}</dd>
					</div>
				{/each}
			</dl>
			{#if appState.measurement?.isProfileLoading}
				<p class="mt-1 text-xs text-muted-foreground">Liczę profil terenu…</p>
			{/if}
		</div>

		{#if appState.travelTimeReadings.length > 0}
			<h3 class="mt-4 mb-1 text-sm font-medium text-muted-foreground">Czas przejścia</h3>
			<dl class="text-sm tabular-nums">
				{#each appState.travelTimeReadings as reading (reading.label)}
					<div class="flex justify-between gap-3 border-t border-border/60 py-1">
						<dt class="text-muted-foreground">{reading.label}</dt>
						<dd class="text-right">{reading.value}</dd>
					</div>
				{/each}
			</dl>
			<p class="mt-1 text-xs text-muted-foreground">
				Dla odległości w poziomie, prędkości bohatera z animacji gry. 4 s rzeczywiste to minuta w
				grze.
			</p>
		{/if}

		{#if appState.measurement?.profile}
			{@const profile = appState.measurement.profile}
			<h3 class="mt-4 mb-1 text-sm font-medium text-muted-foreground">Profil terenu</h3>
			<ProfileChart
				samples={profile.samples}
				minimumHeight={profile.minimumHeight}
				maximumHeight={profile.maximumHeight}
			/>
		{/if}
	{/if}

	{#if pointCount > 0}
		<div class="mt-3 flex gap-2">
			<button
				class="rounded-sm border border-border px-3 py-1.5 text-sm hover:border-primary/60"
				onclick={() => geoportal.removeLastMeasurementPoint()}
			>
				Cofnij punkt
			</button>
			<button
				class="rounded-sm border border-border px-3 py-1.5 text-sm hover:border-primary/60"
				onclick={() => geoportal.clearMeasurement()}
			>
				Wyczyść pomiar
			</button>
		</div>
	{/if}
{:else if appState.measuredPointReadings.length === 0}
	<p class="mt-4 text-sm text-muted-foreground">
		Kliknij punkt na mapie, żeby odczytać jego współrzędne we wszystkich układach.
	</p>
{:else}
	<div class="mt-4 space-y-3 tabular-nums">
		{#each appState.measuredPointReadings as system (system.systemName)}
			<div>
				<h3 class="text-sm font-medium text-muted-foreground">{system.systemName}</h3>
				<dl class="mt-0.5 grid grid-cols-3 gap-2 text-sm">
					{#each system.readings as reading (reading.axis)}
						<div>
							<dt class="text-xs text-muted-foreground">{reading.axis}</dt>
							<dd>{reading.value}</dd>
						</div>
					{/each}
				</dl>
			</div>
		{/each}
	</div>

	{#if appState.measuredPointMarvinCommand}
		{@const command = appState.measuredPointMarvinCommand}
		<div
			class="mt-4 flex items-center justify-between gap-2 rounded-sm border border-dashed border-border px-3 py-2 text-sm"
		>
			<span>
				<span class="block text-xs text-muted-foreground">Teleport w grze (tryb Marvina)</span>
				<code class="font-sans">{command}</code>
			</span>
			<button
				class="shrink-0 rounded-sm border border-border px-3 py-1.5 hover:border-primary/60"
				onclick={() => copyMarvinCommand(command)}
			>
				{copiedCommand === command ? 'Skopiowano' : 'Kopiuj'}
			</button>
		</div>
	{/if}
{/if}
