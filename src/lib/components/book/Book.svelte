<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { appState, geoportal } from '#lib/composition-root.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import BookEntry from './BookEntry.svelte';
	import BookSearch from './BookSearch.svelte';

	const isOpen = $derived(appState.activeToolId === 'search');
	let isPalette = $state(appState.selectedEntry === null);

	/** Okno zmienia układ tylko przy otwartym oknie, żeby wybór wpisu w palecie nie przebudował go w trakcie zamykania. */
	$effect(() => {
		if (isOpen) isPalette = appState.selectedEntry === null;
	});

	function changeOpenState(shouldBeOpen: boolean): void {
		if (shouldBeOpen !== isOpen) geoportal.selectTool('search');
	}
</script>

<Dialog.Root open={isOpen} onOpenChange={changeOpenState}>
	<Dialog.Content
		showCloseButton={false}
		class="material-leather gap-0 p-0 ring-0 sm:max-w-none {isPalette
			? 'top-[9dvh] h-[min(40rem,82dvh)] w-[min(40rem,calc(100vw-2rem))] max-w-none translate-y-0 max-md:top-0 max-md:left-0 max-md:h-dvh max-md:w-screen max-md:translate-x-0'
			: 'h-[min(48rem,calc(100dvh-3rem))] w-[min(72rem,calc(100vw-3rem))] max-w-none max-md:top-0 max-md:left-0 max-md:h-dvh max-md:w-screen max-md:translate-x-0 max-md:translate-y-0'}"
	>
		<Dialog.Title class="sr-only">Wyszukiwarka</Dialog.Title>
		<Dialog.Description class="sr-only">
			Przeszukaj przedmioty, postacie i questy świata i obejrzyj kartę wybranego wpisu.
		</Dialog.Description>
		{#if isPalette}
			<div class="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
				<BookSearch mode="palette" />
				<p
					class="hidden items-center gap-4 border-t border-border px-5 py-2 text-caption text-muted-foreground md:flex"
					aria-hidden="true"
				>
					<span><kbd class="kbd">↑</kbd> <kbd class="kbd">↓</kbd> wybierz</span>
					<span><kbd class="kbd">Enter</kbd> pokaż na mapie</span>
					<span><kbd class="kbd">Esc</kbd> zamknij</span>
				</p>
			</div>
		{:else}
			<div class="grid h-full min-h-0 grid-cols-1 md:grid-cols-[26rem_minmax(0,1fr)]">
				<BookSearch />
				<BookEntry />
			</div>
		{/if}
		<button
			class="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-sm text-muted-foreground hover:bg-hover-surface hover:text-hover"
			aria-label="Zamknij Księgę"
			onclick={() => geoportal.selectTool('search')}
		>
			<XIcon class="size-5" />
		</button>
	</Dialog.Content>
</Dialog.Root>
