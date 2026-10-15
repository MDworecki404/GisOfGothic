<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { worldCatalog } from '#lib/composition-root.js';

	const defaultWorld = worldCatalog.getDefaultWorld();
	const message = $derived(
		page.status === 404 ? 'Nie ma takiego świata.' : (page.error?.message ?? 'Coś poszło nie tak.')
	);
</script>

<svelte:head>
	<title>{page.status} — GIS of Gothic</title>
</svelte:head>

<main class="grid h-dvh place-items-center bg-background p-4">
	<section class="panel-stone w-full max-w-md rounded-sm p-6 text-center">
		<h1 class="text-2xl font-semibold text-primary">{page.status}</h1>
		<p class="mt-2 text-muted-foreground">{message}</p>
		<a
			class="mt-5 inline-block rounded-sm border border-border px-4 py-2 text-foreground hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			href={resolve('/[gameId]/[worldId]', {
				gameId: defaultWorld.gameId,
				worldId: defaultWorld.id
			})}
		>
			Otwórz {defaultWorld.name}
		</a>
	</section>
</main>
