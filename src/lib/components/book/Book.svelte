<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { appState, geoportal } from '#lib/composition-root.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import BookEntry from './BookEntry.svelte';
	import BookSearch from './BookSearch.svelte';

	const isOpen = $derived(appState.activeToolId === 'search');

	function changeOpenState(shouldBeOpen: boolean): void {
		if (shouldBeOpen !== isOpen) geoportal.selectTool('search');
	}
</script>

<Dialog.Root open={isOpen} onOpenChange={changeOpenState}>
	<Dialog.Content
		showCloseButton={false}
		class="material-leather h-[min(48rem,calc(100dvh-3rem))] w-[min(72rem,calc(100vw-3rem))] max-w-none gap-0 p-0 ring-0 max-md:top-0 max-md:left-0 max-md:h-dvh max-md:w-screen max-md:translate-x-0 max-md:translate-y-0 sm:max-w-none"
	>
		<Dialog.Title class="sr-only">Wyszukiwarka</Dialog.Title>
		<Dialog.Description class="sr-only">
			Przeszukaj przedmioty, postacie i questy świata i obejrzyj kartę wybranego wpisu.
		</Dialog.Description>
		<div class="grid h-full min-h-0 grid-cols-1 md:grid-cols-[26rem_minmax(0,1fr)]">
			<BookSearch />
			<BookEntry />
		</div>
		<button
			class="absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-sm text-muted-foreground hover:bg-hover-surface hover:text-hover"
			aria-label="Zamknij Księgę"
			onclick={() => geoportal.selectTool('search')}
		>
			<XIcon class="size-5" />
		</button>
	</Dialog.Content>
</Dialog.Root>
