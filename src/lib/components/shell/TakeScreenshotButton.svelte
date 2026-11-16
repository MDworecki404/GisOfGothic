<script lang="ts">
	import CameraIcon from '@lucide/svelte/icons/camera';
	import { takeViewScreenshot } from '#lib/composition-root.js';

	interface Props {
		class?: string;
	}

	const FEEDBACK_MILLISECONDS = 2500;

	let { class: className = '' }: Props = $props();
	let status = $state<'idle' | 'working' | 'failed'>('idle');

	async function downloadScreenshot(): Promise<void> {
		if (status === 'working') return;
		status = 'working';
		try {
			const screenshot = await takeViewScreenshot();
			if (!screenshot) throw new Error('Mapa nie dała obrazu');
			const address = URL.createObjectURL(screenshot.blob);
			const link = document.createElement('a');
			link.href = address;
			link.download = screenshot.fileName;
			link.click();
			URL.revokeObjectURL(address);
			status = 'idle';
		} catch {
			status = 'failed';
			setTimeout(() => (status = 'idle'), FEEDBACK_MILLISECONDS);
		}
	}
</script>

<button
	class={className}
	aria-label={status === 'failed' ? 'Nie udało się zrobić zdjęcia' : 'Zrób zdjęcie widoku'}
	title={status === 'failed'
		? 'Nie udało się zrobić zdjęcia'
		: 'Zrób zdjęcie widoku (zapisuje obraz z podpisem)'}
	disabled={status === 'working'}
	onclick={downloadScreenshot}
>
	<CameraIcon class="size-5 {status === 'failed' ? 'text-destructive' : ''}" />
</button>
