<script lang="ts" module>
	export interface WorldSwitcherWorld {
		id: string;
		name: string;
	}

	export interface WorldSwitcherGame {
		id: string;
		name: string;
		worlds: readonly WorldSwitcherWorld[];
	}
</script>

<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { resolve } from '$app/paths';

	interface Props {
		games: readonly WorldSwitcherGame[];
		currentGameId: string;
		currentWorldId: string;
	}

	let { games, currentGameId, currentWorldId }: Props = $props();
	let isOpen = $state(false);
	let switcher: HTMLDivElement;

	const currentGame = $derived(games.find((game) => game.id === currentGameId));
	const currentWorld = $derived(currentGame?.worlds.find((world) => world.id === currentWorldId));
	const hasChoice = $derived(games.reduce((count, game) => count + game.worlds.length, 0) > 1);

	function closeOnOutsideClick(event: MouseEvent): void {
		if (isOpen && event.target instanceof Node && !switcher.contains(event.target)) isOpen = false;
	}

	function closeOnEscape(event: KeyboardEvent): void {
		if (isOpen && event.key === 'Escape') {
			event.stopPropagation();
			isOpen = false;
		}
	}
</script>

<svelte:window onclick={closeOnOutsideClick} />

<div class="relative shrink-0" bind:this={switcher}>
	{#if hasChoice}
		<button
			class="flex min-h-11 items-center gap-1.5 rounded-sm px-2 font-medium whitespace-nowrap hover:bg-hover-surface md:border md:border-border md:px-3 md:hover:border-torch/60"
			aria-haspopup="true"
			aria-expanded={isOpen}
			title="Zmień świat"
			onclick={() => (isOpen = !isOpen)}
			onkeydown={closeOnEscape}
		>
			<span class="hidden text-muted-foreground md:inline">{currentGame?.name} ›</span>
			<span>{currentWorld?.name}</span>
			<ChevronDownIcon class="size-4 text-muted-foreground" />
		</button>
	{:else}
		<div class="flex min-h-11 items-center gap-1.5 px-2 font-medium whitespace-nowrap md:px-3">
			<span class="hidden text-muted-foreground md:inline">{currentGame?.name} ›</span>
			<span>{currentWorld?.name}</span>
		</div>
	{/if}

	{#if isOpen}
		<nav
			class="material-leather absolute top-[calc(100%+6px)] left-0 z-40 min-w-60 rounded-sm py-1.5"
			aria-label="Światy"
		>
			{#each games as game (game.id)}
				<p class="px-3 pt-1.5 pb-1 text-caption text-muted-foreground">{game.name}</p>
				<ul>
					{#each game.worlds as world (world.id)}
						{@const isCurrent = game.id === currentGameId && world.id === currentWorldId}
						<li>
							<a
								class="flex min-h-11 items-center justify-between gap-3 px-3 hover:bg-hover-surface {isCurrent
									? 'text-active'
									: ''}"
								href={resolve('/[gameId]/[worldId]', { gameId: game.id, worldId: world.id })}
								aria-current={isCurrent ? 'page' : undefined}
								onclick={() => (isOpen = false)}
								onkeydown={closeOnEscape}
							>
								{world.name}
								{#if isCurrent}<CheckIcon class="size-4" />{/if}
							</a>
						</li>
					{/each}
				</ul>
			{/each}
		</nav>
	{/if}
</div>
