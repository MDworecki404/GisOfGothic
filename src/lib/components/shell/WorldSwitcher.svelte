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
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { resolve } from '$app/paths';

	interface Props {
		games: readonly WorldSwitcherGame[];
		currentGameId: string;
		currentWorldId: string;
	}

	const FLYOUT_MEDIA_QUERY = '(min-width: 768px)';

	let { games, currentGameId, currentWorldId }: Props = $props();
	let isOpen = $state(false);
	let openGameId = $state<string | null>(null);
	let switcher: HTMLDivElement;

	const currentGame = $derived(games.find((game) => game.id === currentGameId));
	const currentWorld = $derived(currentGame?.worlds.find((world) => world.id === currentWorldId));
	const hasChoice = $derived(games.reduce((count, game) => count + game.worlds.length, 0) > 1);

	function toggleMenu(): void {
		isOpen = !isOpen;
		const isFlyoutLayout = window.matchMedia(FLYOUT_MEDIA_QUERY).matches;
		openGameId = isOpen && !isFlyoutLayout ? currentGameId : null;
	}

	function closeMenu(): void {
		isOpen = false;
		openGameId = null;
	}

	function closeOnOutsideClick(event: MouseEvent): void {
		if (isOpen && event.target instanceof Node && !switcher.contains(event.target)) closeMenu();
	}

	function closeOnEscape(event: KeyboardEvent): void {
		if (isOpen && event.key === 'Escape') {
			event.stopPropagation();
			closeMenu();
		}
	}

	function showWorldsOnHover(event: PointerEvent, gameId: string): void {
		if (event.pointerType === 'mouse') openGameId = gameId;
	}

	function toggleWorldsOfGame(gameId: string): void {
		openGameId = openGameId === gameId ? null : gameId;
	}

	function openWorldsFromKeyboard(event: KeyboardEvent, gameId: string): void {
		if (event.key !== 'ArrowRight') return;
		event.preventDefault();
		openGameId = gameId;
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
			onclick={toggleMenu}
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
			<p class="px-3 pt-1.5 pb-1 text-caption text-muted-foreground">Gry</p>
			<ul>
				{#each games as game (game.id)}
					{@const isOpenGame = openGameId === game.id}
					<li class="relative" onpointerenter={(event) => showWorldsOnHover(event, game.id)}>
						<button
							class="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left hover:bg-hover-surface {game.id ===
							currentGameId
								? 'text-active'
								: ''}"
							aria-haspopup="true"
							aria-expanded={isOpenGame}
							onclick={() => toggleWorldsOfGame(game.id)}
							onkeydown={(event) => {
								closeOnEscape(event);
								openWorldsFromKeyboard(event, game.id);
							}}
						>
							{game.name}
							<ChevronRightIcon class="size-4 text-muted-foreground max-md:hidden" />
							<ChevronDownIcon
								class="size-4 text-muted-foreground transition-transform md:hidden {isOpenGame
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if isOpenGame}
							<ul
								class="material-leather max-md:border-t max-md:border-border/60 max-md:bg-black/20 md:absolute md:top-0 md:left-full md:-ml-px md:min-w-52 md:rounded-sm md:py-1.5"
								aria-label="Światy gry {game.name}"
							>
								{#each game.worlds as world (world.id)}
									{@const isCurrent = game.id === currentGameId && world.id === currentWorldId}
									<li>
										<a
											class="flex min-h-11 items-center justify-between gap-3 px-3 hover:bg-hover-surface max-md:pl-6 {isCurrent
												? 'text-active'
												: ''}"
											href={resolve('/[gameId]/[worldId]', {
												gameId: game.id,
												worldId: world.id
											})}
											aria-current={isCurrent ? 'page' : undefined}
											onclick={closeMenu}
											onkeydown={closeOnEscape}
										>
											{world.name}
											{#if isCurrent}<CheckIcon class="size-4" />{/if}
										</a>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/each}
			</ul>
		</nav>
	{/if}
</div>
