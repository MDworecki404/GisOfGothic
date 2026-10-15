<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';

	const STATUS_LABELS = {
		hidden: '',
		loading: 'wczytywanie…',
		visible: '',
		error: 'błąd'
	} as const;
</script>

<h3 class="mb-1 text-sm font-medium text-muted-foreground">Dane</h3>
<p class="mb-2 text-[13px] text-muted-foreground">
	Kliknij punkt na mapie, żeby zobaczyć, co to jest.
</p>

<ul>
	{#each appState.dataLayers as layer (layer.id)}
		<li class="border-t border-border/60">
			<label class="grid cursor-pointer grid-cols-[18px_1fr_auto] items-center gap-2.5 py-2">
				<input
					type="checkbox"
					class="size-4 accent-[var(--primary)]"
					checked={layer.status === 'visible' || layer.status === 'loading'}
					disabled={layer.status === 'loading'}
					onchange={() => geoportal.toggleDataLayer(layer.id)}
				/>
				<span class="min-w-0">
					<span class="flex items-center gap-2">
						<span class="size-2.5 rounded-full" style:background-color={layer.color}></span>
						{layer.name}
					</span>
					<span class="block text-[13px] text-muted-foreground">{layer.description}</span>
				</span>
				<span
					class="text-[13px] tabular-nums {layer.status === 'error'
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

<h3 class="mt-5 mb-1 text-sm font-medium text-muted-foreground">Wkrótce</h3>
<p class="text-[13px] text-muted-foreground">
	Podkłady Poziomice i Pergamin, siatka, waypointy, questy.
</p>
