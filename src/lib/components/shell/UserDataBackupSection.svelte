<script lang="ts">
	import { geoportal } from '#lib/composition-root.js';

	let fileInput: HTMLInputElement;
	let result = $state<{ isSuccess: boolean; message: string } | null>(null);

	function downloadBackup(): void {
		const { fileName, text } = geoportal.exportUserData();
		const address = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
		const link = document.createElement('a');
		link.href = address;
		link.download = fileName;
		link.click();
		URL.revokeObjectURL(address);
		result = { isSuccess: true, message: 'Zapisano plik z kopią zapasową.' };
	}

	async function importChosenFile(event: Event): Promise<void> {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement)) return;
		const file = input.files?.item(0);
		if (!file) return;
		result = geoportal.importUserData(await file.text());
		input.value = '';
	}
</script>

<h3 class="group-label mt-5 mb-1">Kopia zapasowa</h3>
<p class="text-sm text-muted-foreground">
	Zakładki, pinezki i lista „co zebrałem” ze wszystkich światów w jednym pliku. Wczytaj go na innym
	urządzeniu, żeby przenieść notatnik.
</p>
<div class="mt-2 flex gap-2">
	<button class="button-quiet" onclick={downloadBackup}>Zapisz do pliku</button>
	<button class="button-quiet" onclick={() => fileInput.click()}>Wczytaj z pliku</button>
	<input
		bind:this={fileInput}
		type="file"
		accept="application/json,.json"
		class="sr-only"
		tabindex="-1"
		aria-label="Plik z kopią zapasową"
		onchange={importChosenFile}
	/>
</div>
{#if result}
	<p
		class="mt-2 text-sm {result.isSuccess ? 'text-muted-foreground' : 'text-destructive'}"
		role={result.isSuccess ? 'status' : 'alert'}
	>
		{result.message}
	</p>
{/if}
