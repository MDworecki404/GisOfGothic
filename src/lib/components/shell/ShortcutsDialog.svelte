<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';

	interface ShortcutGroup {
		title: string;
		shortcuts: readonly { keys: string; description: string }[];
	}

	const groups: readonly ShortcutGroup[] = [
		{
			title: 'Ogólne',
			shortcuts: [
				{ keys: 'Ctrl K', description: 'Otwórz Księgę i wyszukiwarkę' },
				{ keys: 'Esc', description: 'Zamknij okno, menu albo panel narzędzia' },
				{ keys: '?', description: 'Pokaż tę ściągę' }
			]
		},
		{
			title: 'Lot kamerą',
			shortcuts: [
				{ keys: 'W A S D', description: 'Przód, lewo, tył, prawo' },
				{ keys: 'Q E', description: 'W dół i w górę' },
				{ keys: '← →', description: 'Obrót' },
				{ keys: '↑ ↓', description: 'Pochylenie spojrzenia' },
				{ keys: 'Shift', description: 'Przyspieszenie' }
			]
		}
	];

	interface Props {
		open?: boolean;
	}

	let { open: isOpen = $bindable(false) }: Props = $props();
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Content
		class="material-leather max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-md p-0 ring-0 sm:max-w-md"
	>
		<div class="px-6 pt-8 pb-6 sm:px-9">
			<Dialog.Title class="text-display text-primary">Skróty klawiszowe</Dialog.Title>
			<Dialog.Description class="mt-0.5 text-muted-foreground">
				Skróty nie działają, gdy piszesz w polu tekstowym.
			</Dialog.Description>

			{#each groups as group (group.title)}
				<h3 class="mt-6 text-label text-muted-foreground">{group.title}</h3>
				<dl class="mt-2 divide-y divide-border border-y border-border">
					{#each group.shortcuts as shortcut (shortcut.keys)}
						<div class="flex min-h-11 items-center justify-between gap-4 py-2">
							<dt class="text-foreground/90">{shortcut.description}</dt>
							<dd>
								<kbd
									class="rounded-sm border border-border px-1.5 py-0.5 font-sans text-caption whitespace-nowrap"
									>{shortcut.keys}</kbd
								>
							</dd>
						</div>
					{/each}
				</dl>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
