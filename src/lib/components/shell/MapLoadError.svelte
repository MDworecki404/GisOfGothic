<script lang="ts">
	import { appState } from '#lib/composition-root.js';

	const failure = $derived.by(() => {
		if (appState.worldStatus === 'error') {
			return {
				title: 'Nie udało się wczytać modelu świata',
				details: appState.worldErrorMessage
			};
		}
		if (appState.searchIndexStatus === 'error') {
			return {
				title: 'Nie udało się wczytać przedmiotów i postaci',
				details: appState.searchIndexErrorMessage
			};
		}
		return null;
	});

	function reloadPage(): void {
		window.location.reload();
	}
</script>

{#if failure}
	<div
		class="material-leather material-leather-riveted fixed top-1/2 left-1/2 z-30 w-[min(24rem,calc(100vw-2*var(--gutter)))] -translate-x-1/2 -translate-y-1/2 rounded-md px-6 py-5"
		role="alert"
	>
		<h2 class="text-title text-destructive">{failure.title}</h2>
		<p class="mt-2 text-muted-foreground">
			Sprawdź połączenie z internetem i wczytaj stronę ponownie. Jeśli to nie pomoże, spróbuj za
			kilka minut.
		</p>
		{#if failure.details}
			<p class="mt-2 text-caption break-words text-muted-foreground">
				Szczegóły: {failure.details}
			</p>
		{/if}
		<button class="button-ochre mt-4" onclick={reloadPage}>Wczytaj ponownie</button>
	</div>
{/if}
