<script lang="ts">
	import { geoportal } from '#lib/composition-root.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import type { KeyboardShortcutHelpEntry } from '#lib/services/input/keyboard-shortcut-catalog.js';

	const entries = geoportal.listKeyboardShortcutHelp();
	const groupTitles = [...new Set(entries.map((entry) => entry.group))];

	function listEntriesOfGroup(groupTitle: string): readonly KeyboardShortcutHelpEntry[] {
		return entries.filter((entry) => entry.group === groupTitle);
	}

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

			{#each groupTitles as groupTitle (groupTitle)}
				<h3 class="mt-6 text-label text-muted-foreground">{groupTitle}</h3>
				<dl class="mt-2 divide-y divide-border border-y border-border">
					{#each listEntriesOfGroup(groupTitle) as shortcut, index (index)}
						<div class="flex min-h-11 items-center justify-between gap-4 py-2">
							<dt class="text-foreground/90">{shortcut.description}</dt>
							<dd>
								<kbd
									class="rounded-sm border border-border px-1.5 py-0.5 font-sans text-caption whitespace-nowrap"
									>{shortcut.keyLabel}</kbd
								>
							</dd>
						</div>
					{/each}
				</dl>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
