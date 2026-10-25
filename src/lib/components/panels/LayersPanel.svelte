<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';
	import TileLoader from '#lib/components/shell/TileLoader.svelte';

	const STATUS_LABELS = {
		hidden: '',
		loading: 'wczytywanie…',
		visible: '',
		error: 'błąd'
	} as const;
</script>

<h3 class="group-label mb-1">Świat</h3>
<label class="list-row grid cursor-pointer grid-cols-[22px_1fr_auto] items-start gap-3 px-1 py-2.5">
	<input
		type="checkbox"
		class="check-forged mt-px"
		checked={appState.staticObjectsStatus === 'visible' ||
			appState.staticObjectsStatus === 'loading'}
		disabled={appState.staticObjectsStatus === 'loading'}
		onchange={() => geoportal.toggleStaticObjects()}
	/>
	<span class="min-w-0">
		Obiekty świata
		<span class="block text-caption text-muted-foreground">
			wszystkie statyczne voby: drzewa, budynki, rekwizyty i przedmioty leżące na ziemi
		</span>
		{#if appState.staticObjectsErrorMessage}
			<span class="block text-caption text-destructive" role="alert">
				Nie udało się wczytać: {appState.staticObjectsErrorMessage}
			</span>
		{/if}
	</span>
	<span class="text-caption text-muted-foreground">
		{#if appState.staticObjectsStatus === 'loading' || (appState.staticObjectsStatus === 'visible' && appState.staticObjectsTilesPending > 0)}
			<TileLoader
				label="Wczytuję obiekty świata"
				count={appState.staticObjectsStatus === 'visible'
					? appState.staticObjectsTilesPending
					: null}
			/>
		{/if}
	</span>
</label>

<h3 class="group-label mb-1">Dane</h3>
<p class="mb-2 text-caption text-muted-foreground">
	Kliknij punkt na mapie, żeby zobaczyć, co to jest.
</p>

<ul>
	{#each appState.dataLayers as layer (layer.id)}
		<li class="border-t border-divider shadow-[inset_0_1px_0_var(--divider-highlight)]">
			<label
				class="list-row grid cursor-pointer grid-cols-[22px_1fr_auto] items-start gap-3 px-1 py-2.5"
			>
				<input
					type="checkbox"
					class="check-forged mt-px"
					checked={layer.status === 'visible' || layer.status === 'loading'}
					disabled={layer.status === 'loading'}
					onchange={() => geoportal.toggleDataLayer(layer.id)}
				/>
				<span class="min-w-0">
					<span class="flex items-center gap-2 font-medium">
						<span class="size-2.5 rounded-full" style:background-color={layer.color}></span>
						{layer.name}
					</span>
					<span class="block text-caption text-muted-foreground">{layer.description}</span>
					<span class="mt-1 flex flex-wrap gap-x-3 gap-y-1" aria-label="Ikony: {layer.name}">
						{#each layer.legend as entry (entry.label)}
							<span class="flex items-center gap-1 text-caption text-muted-foreground">
								<svg
									class="size-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke={layer.color}
									stroke-width="2.2"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									{#each entry.nodes as [tag, attributes], index (index)}
										<svelte:element this={tag} {...attributes} />
									{/each}
								</svg>
								{entry.label}
							</span>
						{/each}
					</span>
				</span>
				<span
					class="text-caption tabular-nums {layer.status === 'error'
						? 'text-destructive'
						: 'text-muted-foreground'}"
				>
					{STATUS_LABELS[layer.status] || (layer.featureCount ?? '')}
				</span>
			</label>
		</li>
	{/each}
</ul>

{#if appState.dataLayerErrorMessage}
	<p class="mt-2 text-sm text-destructive" role="alert">{appState.dataLayerErrorMessage}</p>
{/if}

<h3 class="group-label mt-5 mb-1">Wkrótce</h3>
<p class="text-caption text-muted-foreground">
	Podkłady Poziomice i Pergamin, siatka, waypointy, questy.
</p>
