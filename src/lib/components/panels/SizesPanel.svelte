<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import { page } from '$app/state';
	import { appState, geoportal, worldCatalog } from '#lib/composition-root.js';
	import ForgedRange from '#lib/components/controls/ForgedRange.svelte';
	import type { WorldArrangement } from '#lib/services/comparison/world-arrangement-calculator.js';
	import type { SizeWorldView } from '#lib/services/comparison/world-size-coordinator.js';
	import type { SizeWorldPlacement } from '#lib/services/map/world-placement-calculator.js';

	const REFERENCE_KEY = 'reference';

	const sizes = $derived(appState.worldSizes);
	const games = $derived(
		worldCatalog.listGames().map((game) => ({
			...game,
			worlds: game.worlds.filter(
				(world) => !(game.id === page.params.gameId && world.id === page.params.worldId)
			)
		}))
	);
	const selectedByKey = $derived(new Map(sizes.worlds.map((world) => [world.key, world])));

	function buildKey(gameId: string, worldId: string): string {
		return `${gameId}/${worldId}`;
	}

	function describeSize(widthMetres: number, depthMetres: number): string {
		return `${appState.formatLength(widthMetres)} × ${appState.formatLength(depthMetres)}`;
	}

	function readNumber(text: string): number | null {
		const value = Number(text.replace(',', '.'));
		return text.trim() !== '' && Number.isFinite(value) ? value : null;
	}

	function changeCentre(world: SizeWorldView, axis: 'east' | 'north' | 'up', text: string): void {
		const value = readNumber(text);
		if (value === null || !world.nativeCenter) return;
		geoportal.setSizeWorldPlacement(world.key, { [axis]: value - world.nativeCenter[axis] });
	}

	function changeHeading(world: SizeWorldView, text: string): void {
		const value = readNumber(text);
		if (value !== null) geoportal.setSizeWorldPlacement(world.key, { headingDegrees: value });
	}

	function roundForField(value: number): number {
		return Math.round(value * 10) / 10;
	}

	const arrangements: readonly { value: WorldArrangement; label: string; hint: string }[] = [
		{ value: 'concentric', label: 'Współśrodkowo', hint: 'środki obrysów w jednym miejscu' },
		{
			value: 'southwest-corner',
			label: 'Od narożnika',
			hint: 'wspólny południowo-zachodni narożnik, widać, który świat wystaje'
		},
		{ value: 'row', label: 'W rzędzie', hint: 'światy obok siebie na wschód od otwartego' }
	];

	const readyWorldCount = $derived(sizes.worlds.filter((world) => world.status === 'ready').length);
	const areAllVisible = $derived(
		(sizes.reference?.isVisible ?? true) && sizes.worlds.every((world) => world.isVisible)
	);

	const ratioFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

	function describeRatio(world: SizeWorldView): string | null {
		const reference = sizes.reference;
		if (!reference || world.widthMetres === null || world.depthMetres === null) return null;
		const areaRatio =
			(world.widthMetres * world.depthMetres) / (reference.widthMetres * reference.depthMetres);
		if (areaRatio >= 1) return `${ratioFormat.format(areaRatio)}× większy obszar niż otwarty świat`;
		return `${ratioFormat.format(1 / areaRatio)}× mniejszy obszar niż otwarty świat`;
	}

	const centreFields: readonly {
		axis: keyof Pick<SizeWorldPlacement, 'east' | 'north' | 'up'>;
		label: string;
	}[] = [
		{ axis: 'east', label: 'Środek: wschód (m)' },
		{ axis: 'north', label: 'Środek: północ (m)' },
		{ axis: 'up', label: 'Środek: wysokość (m)' }
	];
</script>

<p class="text-sm text-muted-foreground">
	Zaznacz światy, które mają się pokazać obok otwartego, i porównaj ich wielkość. Wybrany świat ma
	na mapie gizmo: przeciągnij <span class="text-[#ff4545]">czerwoną</span> strzałkę na wschód,
	<span class="text-[#45ff70]">zieloną</span> na północ,
	<span class="text-[#4596ff]">niebieską</span>
	w górę, a biały pierścień, żeby obrócić. Kamerę ruszasz, przeciągając tło.
</p>

<h3 class="group-label mt-4 mb-1">Wygląd</h3>
<label class="list-row grid cursor-pointer grid-cols-[2.5rem_1fr] items-start gap-3 px-1 py-2.5">
	<input
		type="checkbox"
		class="switch-forged mt-0.5"
		checked={sizes.areColorsNatural}
		onchange={(event) => geoportal.setSizeWorldsNaturalColors(event.currentTarget.checked)}
	/>
	<span class="min-w-0">
		Prawdziwe kolory
		<span class="block text-caption text-muted-foreground">
			modele w kolorach z gry zamiast barw rozróżniających światy; światy odróżnia wtedy kolejność i
			ukrywanie
		</span>
	</span>
</label>
<div class="px-1 py-2">
	<div class="mb-1 flex justify-between text-sm">
		<span>Nieprzezroczystość</span>
		<span class="text-muted-foreground tabular-nums">{Math.round(sizes.opacity * 100)}%</span>
	</div>
	<ForgedRange
		value={sizes.opacity}
		min={0.1}
		max={1}
		step={0.05}
		label="Nieprzezroczystość światów"
		valueText="{Math.round(sizes.opacity * 100)}%"
		onValueChange={(value) => geoportal.setSizeWorldsOpacity(value)}
	/>
</div>

<h3 class="group-label mt-4 mb-1">Układ</h3>
<div class="flex flex-wrap gap-1.5" role="group" aria-label="Ułóż wczytane światy">
	{#each arrangements as arrangement (arrangement.value)}
		<button
			class="chip"
			title={arrangement.hint}
			disabled={readyWorldCount === 0}
			onclick={() => geoportal.arrangeSizeWorlds(arrangement.value)}
		>
			{arrangement.label}
		</button>
	{/each}
</div>

{#if sizes.reference}
	{@const reference = sizes.reference}
	<div
		class="mt-3 rounded-md border bg-muted/50 p-2.5 {reference.isHighlighted
			? 'border-primary'
			: 'border-border'}"
		role="status"
		onpointerenter={() => geoportal.highlightSizeWorld(REFERENCE_KEY)}
		onpointerleave={() => geoportal.highlightSizeWorld(null)}
	>
		<span class="block text-caption text-muted-foreground">Otwarty świat (odniesienie)</span>
		<span class="flex items-center gap-2 font-serif text-lead">
			<span
				class="size-3 shrink-0 rounded-full"
				style:background-color={reference.color}
				aria-hidden="true"
			></span>
			{reference.label}
		</span>
		<span class="block text-sm tabular-nums">
			{describeSize(reference.widthMetres, reference.depthMetres)}
		</span>
		<button
			class="button-quiet mt-1.5 min-h-9 px-3 text-sm"
			aria-pressed={reference.isVisible}
			onclick={() => geoportal.toggleSizeWorldVisibility(REFERENCE_KEY)}
		>
			{#if reference.isVisible}<EyeIcon class="size-4" />Ukryj otwarty świat{:else}<EyeOffIcon
					class="size-4"
				/>Pokaż otwarty świat{/if}
		</button>
	</div>
{/if}

{#if sizes.worlds.length > 0}
	<button
		class="button-quiet mt-3 w-full"
		onclick={() => geoportal.toggleAllSizeWorldsVisibility()}
	>
		{areAllVisible ? 'Pokaż tylko otwarty świat' : 'Pokaż wszystkie światy'}
	</button>
{/if}

{#if sizes.isLimitReached}
	<p class="mt-2 text-sm text-muted-foreground" role="status">
		Na mapie jest już najwięcej światów naraz. Odznacz któryś, żeby dodać inny.
	</p>
{/if}

{#each games as game (game.id)}
	{#if game.worlds.length > 0}
		<h3 class="group-label mt-4 mb-1">{game.name}</h3>
		<ul>
			{#each game.worlds as world (world.id)}
				{@const key = buildKey(game.id, world.id)}
				{@const selected = selectedByKey.get(key)}
				{@const isChosen = selected !== undefined && sizes.selectedKey === key}
				<li class="border-t border-border/60 {isChosen ? 'bg-active-surface' : ''}">
					<div
						class="flex min-h-11 items-center gap-2.5 px-1"
						role="group"
						aria-label={world.name}
						onpointerenter={() => selected && geoportal.highlightSizeWorld(key)}
						onpointerleave={() => selected && geoportal.highlightSizeWorld(null)}
					>
						<input
							type="checkbox"
							class="size-5 shrink-0 accent-primary"
							checked={selected !== undefined}
							disabled={selected === undefined && sizes.isLimitReached}
							aria-label="Pokaż świat {world.name} ({game.name})"
							onchange={() => geoportal.toggleSizeWorld(world, `${game.name} — ${world.name}`)}
						/>
						{#if selected}
							<span
								class="size-3 shrink-0 rounded-full"
								style:background-color={selected.color}
								aria-hidden="true"
							></span>
						{/if}
						{#if selected}
							<button
								class="min-h-11 min-w-0 flex-1 truncate text-left"
								aria-pressed={isChosen}
								aria-label="Wybierz świat {world.name}: pokaż jego gizmo"
								onclick={() => geoportal.selectSizeWorld(key)}
							>
								{world.name}
							</button>
						{:else}
							<span class="min-w-0 flex-1 truncate">{world.name}</span>
						{/if}
						{#if selected?.status === 'ready'}
							<button
								class="grid size-9 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-hover-surface hover:text-hover"
								aria-pressed={selected.isVisible}
								aria-label="{selected.isVisible ? 'Ukryj' : 'Pokaż'} świat {world.name}"
								onclick={() => geoportal.toggleSizeWorldVisibility(key)}
							>
								{#if selected.isVisible}<EyeIcon class="size-4" />{:else}<EyeOffIcon
										class="size-4"
									/>{/if}
							</button>
						{/if}
						{#if selected?.status === 'loading'}
							<span class="text-caption text-muted-foreground">wczytywanie…</span>
						{:else if selected?.status === 'error'}
							<span class="text-caption text-destructive">błąd</span>
						{:else if selected?.widthMetres != null && selected.depthMetres != null}
							<span class="text-caption text-muted-foreground tabular-nums">
								{describeSize(selected.widthMetres, selected.depthMetres)}
							</span>
						{/if}
					</div>

					{#if selected?.status === 'error'}
						<p class="px-1 pb-2 text-sm text-destructive" role="alert">
							Nie udało się wczytać świata: {selected.errorMessage}
						</p>
					{:else if selected?.status === 'ready' && selected.nativeCenter && isChosen}
						{@const nativeCenter = selected.nativeCenter}
						{@const ratio = describeRatio(selected)}
						{#if ratio}
							<p class="px-1 pb-1.5 text-caption text-muted-foreground">{ratio}</p>
						{/if}
						<div class="mb-2 grid grid-cols-2 gap-2 px-1">
							{#each centreFields as field (field.axis)}
								<label class="text-sm">
									<span class="text-caption text-muted-foreground">{field.label}</span>
									<input
										type="number"
										class="field w-full"
										step={field.axis === 'up' ? 5 : 10}
										value={roundForField(nativeCenter[field.axis] + selected.placement[field.axis])}
										onfocus={() => geoportal.selectSizeWorld(key)}
										onchange={(event) =>
											changeCentre(selected, field.axis, event.currentTarget.value)}
									/>
								</label>
							{/each}
							<label class="text-sm">
								<span class="text-caption text-muted-foreground">Obrót (°)</span>
								<input
									type="number"
									class="field w-full"
									step="5"
									value={roundForField(selected.placement.headingDegrees)}
									onfocus={() => geoportal.selectSizeWorld(key)}
									onchange={(event) => changeHeading(selected, event.currentTarget.value)}
								/>
							</label>
							<button
								class="button-quiet col-span-2"
								onclick={() => geoportal.resetSizeWorldPlacement(key)}
							>
								Zresetuj pozycję
							</button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
{/each}
