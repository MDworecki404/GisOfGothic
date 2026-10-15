<script lang="ts">
	import { resolve } from '$app/paths';
	import { appState, geoportal } from '#lib/composition-root.js';

	let bookmarkName = $state('');
	let copiedBookmarkId = $state<string | null>(null);

	function saveCurrentView(): void {
		geoportal.saveBookmark(bookmarkName);
		bookmarkName = '';
	}

	async function copyLink(bookmark: (typeof appState.bookmarks)[number]): Promise<void> {
		const path = resolve('/[gameId]/[worldId]', {
			gameId: bookmark.gameId,
			worldId: bookmark.worldId
		});
		await navigator.clipboard.writeText(`${window.location.origin}${path}${bookmark.linkQuery}`);
		copiedBookmarkId = bookmark.id;
	}
</script>

<p class="text-sm text-muted-foreground">
	Zapisz bieżący widok: położenie kamery, wybrany wpis i otwarte narzędzie.
</p>

<form
	class="mt-3 flex gap-2"
	onsubmit={(event) => {
		event.preventDefault();
		saveCurrentView();
	}}
>
	<input
		type="text"
		class="min-w-0 flex-1 rounded-sm border border-input bg-background px-3 py-2 text-sm"
		placeholder="Nazwa zakładki"
		aria-label="Nazwa zakładki"
		maxlength="60"
		bind:value={bookmarkName}
	/>
	<button
		type="submit"
		class="shrink-0 rounded-sm border border-primary bg-secondary px-3 py-2 text-sm hover:bg-primary hover:text-primary-foreground"
	>
		Zapisz widok
	</button>
</form>

{#if appState.bookmarkStorageFailed}
	<p class="mt-2 text-sm text-destructive" role="alert">
		Nie udało się zapisać zakładek w przeglądarce (pamięć witryny jest zablokowana). Zostaną do
		zamknięcia karty.
	</p>
{/if}

<h3 class="mt-5 mb-1 text-sm font-medium text-muted-foreground">Zapisane widoki</h3>
{#if appState.bookmarks.length === 0}
	<p class="text-sm text-muted-foreground">
		Nic jeszcze nie zapisano. Ustaw mapę tak, jak chcesz do niej wrócić, i kliknij „Zapisz widok”.
	</p>
{:else}
	<ul class="space-y-2" aria-label="Zapisane widoki">
		{#each appState.bookmarks as bookmark (bookmark.id)}
			<li class="rounded-sm border border-border p-2.5">
				<button
					class="block w-full text-left"
					aria-label="Przywróć widok „{bookmark.name}”"
					onclick={() => geoportal.restoreBookmark(bookmark.id)}
				>
					<span class="block font-serif text-[17px]">{bookmark.name}</span>
					<span class="block text-xs text-muted-foreground">{bookmark.details}</span>
					<span class="block text-xs text-muted-foreground tabular-nums">
						{bookmark.savedAtLabel}
					</span>
				</button>
				<div class="mt-2 flex gap-2">
					<button
						class="rounded-sm border border-border px-2.5 py-1 text-sm hover:border-primary/60"
						onclick={() => copyLink(bookmark)}
					>
						{copiedBookmarkId === bookmark.id ? 'Skopiowano' : 'Kopiuj link'}
					</button>
					<button
						class="rounded-sm border border-border px-2.5 py-1 text-sm hover:border-primary/60"
						aria-label="Usuń zakładkę „{bookmark.name}”"
						onclick={() => geoportal.deleteBookmark(bookmark.id)}
					>
						Usuń
					</button>
				</div>
			</li>
		{/each}
	</ul>
{/if}
