<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';
	import UserDataBackupSection from '#lib/components/shell/UserDataBackupSection.svelte';

	const notebook = $derived(appState.notebook);

	function readPercent(collected: number, total: number | null): number {
		return total ? Math.min(100, (collected / total) * 100) : 0;
	}
</script>

<p class="text-sm text-muted-foreground">
	Własne pinezki na mapie i lista tego, co już masz. Notatnik zapisuje się w tej przeglądarce, bez
	konta.
</p>

{#if notebook?.hasStorageError}
	<p class="mt-2 text-sm text-destructive" role="alert">
		Nie zapisano notatnika w przeglądarce, bo pamięć witryny jest zablokowana. Zapisz kopię zapasową
		do pliku, żeby nie stracić zmian.
	</p>
{/if}

<h3 class="group-label mt-4 mb-1">Pinezki</h3>
{#if notebook?.isPlacingPin}
	<p class="text-sm" role="status">Kliknij mapę w miejscu, gdzie ma stanąć pinezka.</p>
	<button class="button-quiet mt-2" onclick={() => geoportal.cancelPlacingPin()}>Anuluj</button>
{:else}
	<button class="button-ochre" onclick={() => geoportal.startPlacingPin()}>
		Postaw pinezkę na mapie
	</button>
{/if}

{#if !notebook || notebook.pins.length === 0}
	<p class="mt-3 text-sm text-muted-foreground">Brak pinezek w tym świecie.</p>
{:else}
	<ul class="mt-3 space-y-2" aria-label="Pinezki">
		{#each notebook.pins as pin (pin.id)}
			<li class="rounded-md border border-border bg-black/15 p-2.5">
				<input
					type="text"
					class="field w-full font-serif"
					aria-label="Nazwa pinezki"
					maxlength="60"
					value={pin.name}
					onchange={(event) => geoportal.renamePin(pin.id, event.currentTarget.value)}
				/>
				<textarea
					class="field mt-2 w-full"
					rows="2"
					maxlength="500"
					placeholder="Notatka"
					aria-label="Notatka do pinezki „{pin.name}”"
					value={pin.note}
					onchange={(event) => geoportal.changePinNote(pin.id, event.currentTarget.value)}
				></textarea>
				<div class="mt-2 flex gap-2">
					<button class="button-quiet" onclick={() => geoportal.flyToPin(pin.id)}>
						Pokaż na mapie
					</button>
					<button
						class="button-quiet"
						aria-label="Usuń pinezkę „{pin.name}”"
						onclick={() => geoportal.deletePin(pin.id)}
					>
						Usuń
					</button>
				</div>
			</li>
		{/each}
	</ul>
{/if}

<h3 class="group-label mt-5 mb-1">Co zebrałem</h3>
<p class="text-sm text-muted-foreground">
	W karcie przedmiotu odhaczasz każde miejsce osobno, a w karcie questa cały quest.
</p>
{#if notebook}
	<ul class="mt-2 space-y-2" aria-label="Postęp zbierania">
		{#each notebook.progress as progress (progress.kind)}
			<li>
				<div class="flex items-baseline justify-between text-sm">
					<span>{progress.label}</span>
					<span class="text-caption text-muted-foreground tabular-nums">
						{progress.collected}{progress.total === null
							? ''
							: ` z ${progress.total}`}{progress.percentLabel ? ` · ${progress.percentLabel}` : ''}
					</span>
				</div>
				<div class="mt-1 h-1.5 overflow-hidden rounded-full bg-black/30" aria-hidden="true">
					<div
						class="h-full rounded-full bg-primary"
						style:width="{readPercent(progress.collected, progress.total)}%"
					></div>
				</div>
			</li>
		{/each}
	</ul>

	{#snippet collectedList(
		label: string,
		rows: readonly { id: string; name: string; description: string }[],
		remove: (id: string) => void
	)}
		<ul class="mt-3 text-sm" aria-label={label}>
			{#each rows as row (row.id)}
				<li class="flex items-center justify-between gap-2 border-t border-border/60">
					<button
						class="list-row flex min-w-0 flex-1 items-center justify-between gap-3 px-1 text-left"
						onclick={() => {
							geoportal.selectTool('search');
							geoportal.selectSearchEntry(row.id);
						}}
					>
						<span class="truncate text-primary">{row.name}</span>
						<span class="text-caption text-muted-foreground">{row.description}</span>
					</button>
					<button
						class="button-quiet shrink-0"
						aria-label="Usuń z listy: {row.name}"
						onclick={() => remove(row.id)}
					>
						Usuń
					</button>
				</li>
			{/each}
		</ul>
	{/snippet}

	{#if notebook.collectedItems.length > 0}
		{@render collectedList(
			'Zebrane przedmioty',
			notebook.collectedItems.map((item) => ({
				id: item.entryId,
				name: item.name,
				description: `${item.placeCount} ${item.placeCount === 1 ? 'miejsce' : 'miejsc'}`
			})),
			(entryId) => geoportal.removeCollectedItem(entryId)
		)}
	{/if}
	{#if notebook.collectedQuests.length > 0}
		{@render collectedList(
			'Wykonane questy',
			notebook.collectedQuests.map((quest) => ({
				id: quest.questId,
				name: quest.name,
				description: 'quest'
			})),
			(questId) => geoportal.removeCollectedQuest(questId)
		)}
	{/if}
{/if}

<UserDataBackupSection />
