<script lang="ts">
	import { appState, geoportal, worldCatalog } from '#lib/composition-root.js';

	interface Props {
		currentGameId: string;
		currentWorldId: string;
		onClose: () => void;
	}

	let { currentGameId, currentWorldId, onClose }: Props = $props();

	const isComparing = $derived(appState.worldComparison.status !== 'inactive');
	const games = $derived(
		worldCatalog.listGames().map((game) => ({
			...game,
			worlds: game.worlds.filter(
				(world) => !(game.id === currentGameId && world.id === currentWorldId)
			)
		}))
	);
</script>

<div
	class="material-leather absolute top-0 right-full z-20 mr-2.5 max-h-[70dvh] w-[min(17rem,calc(100vw-5.5rem))] overflow-y-auto rounded-md p-3"
	role="group"
	aria-label="Porównanie światów"
	data-world-comparison
>
	<h3 class="group-label mb-1">Porównaj światy</h3>
	<p class="mb-2 text-caption text-muted-foreground">
		Po lewej stronie suwaka zostaje {appState.openedWorldName ?? 'otwarty świat'}, po prawej pojawia
		się wybrany. Światy nakładają się w układzie współrzędnych gry, więc porównanie ma sens, gdy
		mają wspólną geometrię.
	</p>

	{#if isComparing}
		<button
			class="button-quiet mb-2 w-full"
			onclick={() => {
				geoportal.stopWorldComparison();
				onClose();
			}}
		>
			Zakończ porównanie
		</button>
	{/if}

	{#each games as game (game.id)}
		{#if game.worlds.length > 0}
			<h4 class="group-label mt-2 mb-1">{game.name}</h4>
			<ul>
				{#each game.worlds as world (world.id)}
					<li>
						<button
							class="list-row flex w-full items-center justify-between gap-2 px-1 text-left"
							aria-pressed={appState.worldComparison.comparedWorldName ===
								`${game.name} — ${world.name}`}
							onclick={() => {
								geoportal.startWorldComparison(world, `${game.name} — ${world.name}`);
								onClose();
							}}
						>
							<span>{world.name}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
</div>
