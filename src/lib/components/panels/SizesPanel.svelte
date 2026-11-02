<script lang="ts">
	import { page } from '$app/state';
	import { appState, geoportal, worldCatalog } from '#lib/composition-root.js';
	import type { SizeWorldView } from '#lib/services/comparison/world-size-coordinator.js';
	import type { SizeWorldPlacement } from '#lib/services/map/world-placement-calculator.js';

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
	Zaznacz światy, które mają się pokazać obok otwartego. Widma są półprzezroczyste, a świat pod
	kursorem robi się wyraźny. Każdy świat staje środkiem na środku otwartego, a potem możesz go
	przesunąć, podnieść i obrócić.
</p>
<p class="mt-2 text-caption text-muted-foreground">
	Przeciągnij świat na mapie, żeby go przesunąć. Kamerę ruszasz, przeciągając tło poza światem.
</p>

{#if sizes.reference}
	<div class="mt-3 rounded-md border border-border bg-black/15 p-2.5" role="status">
		<span class="block text-caption text-muted-foreground">Otwarty świat (odniesienie)</span>
		<span class="block font-serif text-lead">{sizes.reference.label}</span>
		<span class="block text-sm tabular-nums">
			{describeSize(sizes.reference.widthMetres, sizes.reference.depthMetres)}
		</span>
	</div>
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
				<li class="border-t border-border/60">
					<label
						class="list-row flex min-h-11 cursor-pointer items-center gap-2.5 px-1"
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
						<span class="min-w-0 flex-1 truncate">{world.name}</span>
						{#if selected?.status === 'loading'}
							<span class="text-caption text-muted-foreground">wczytywanie…</span>
						{:else if selected?.status === 'error'}
							<span class="text-caption text-destructive">błąd</span>
						{:else if selected?.widthMetres != null && selected.depthMetres != null}
							<span class="text-caption text-muted-foreground tabular-nums">
								{describeSize(selected.widthMetres, selected.depthMetres)}
							</span>
						{/if}
					</label>

					{#if selected?.status === 'error'}
						<p class="px-1 pb-2 text-sm text-destructive" role="alert">
							Nie udało się wczytać świata: {selected.errorMessage}
						</p>
					{:else if selected?.status === 'ready' && selected.nativeCenter}
						{@const nativeCenter = selected.nativeCenter}
						<div class="mb-2 grid grid-cols-2 gap-2 px-1">
							{#each centreFields as field (field.axis)}
								<label class="text-sm">
									<span class="text-caption text-muted-foreground">{field.label}</span>
									<input
										type="number"
										class="field w-full"
										step={field.axis === 'up' ? 5 : 10}
										value={roundForField(nativeCenter[field.axis] + selected.placement[field.axis])}
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
