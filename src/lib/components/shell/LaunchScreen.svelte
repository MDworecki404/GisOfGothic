<script lang="ts">
	import { appState } from '#lib/composition-root.js';

	const LEAVING_DURATION_MILLISECONDS = 450;

	let isRemoved = $state(false);

	const steps = $derived([
		{ label: 'Model świata', status: appState.worldStatus },
		{ label: 'Przedmioty i postacie', status: appState.searchIndexStatus }
	]);

	$effect(() => {
		if (!appState.isLaunchFinished) return;
		const timer = setTimeout(() => (isRemoved = true), LEAVING_DURATION_MILLISECONDS);
		return () => clearTimeout(timer);
	});
</script>

{#if !isRemoved}
	<div
		class="launch-screen"
		class:launch-screen-leaving={appState.isLaunchFinished}
		inert={appState.isLaunchFinished}
		data-testid="launch-screen"
		role="status"
		aria-live="polite"
		aria-label="Wczytywanie aplikacji"
	>
		<div class="material-leather material-leather-riveted launch-screen-card">
			<img class="size-16" src="/favicon.svg" alt="" width="64" height="64" />
			<h1 class="font-heading text-hero text-primary">GIS of Gothic</h1>
			<p class="font-serif text-muted-foreground italic">
				{appState.openedWorldName ? `Otwieram: ${appState.openedWorldName}` : 'Przygotowuję mapę'}
			</p>
			<ul class="mt-4 w-full text-left">
				{#each steps as step (step.label)}
					<li class="flex items-center justify-between gap-3 border-t border-border/60 py-1.5">
						<span>{step.label}</span>
						{#if step.status === 'loading'}
							<span class="tile-loader-ring" aria-hidden="true"></span>
							<span class="sr-only">wczytuję</span>
						{:else if step.status === 'ready'}
							<span class="text-primary" aria-hidden="true">✓</span>
							<span class="sr-only">gotowe</span>
						{:else}
							<span class="text-destructive" aria-hidden="true">!</span>
							<span class="sr-only">błąd</span>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
