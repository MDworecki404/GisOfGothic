<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import MaximizeIcon from '@lucide/svelte/icons/maximize';
	import MinimizeIcon from '@lucide/svelte/icons/minimize';
	import OrbitIcon from '@lucide/svelte/icons/orbit';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import ZoomInIcon from '@lucide/svelte/icons/zoom-in';
	import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
	import type { Attachment } from 'svelte/attachments';
	import type { ModelPreviewSession } from '#lib/services/map/model-preview-session.js';

	interface Props {
		label: string;
		openPreview: (container: HTMLElement) => ModelPreviewSession;
		heightClass: string;
		class?: string;
		isCompact?: boolean;
	}

	let {
		label,
		openPreview,
		heightClass,
		class: className = '',
		isCompact = false
	}: Props = $props();

	let session = $state.raw<ModelPreviewSession | null>(null);
	let frame = $state<HTMLElement>();
	let toolbar = $state<HTMLElement>();
	let isUsingNativeFullscreen = false;

	const isFullscreen = $derived(session?.controls.isFullscreen ?? false);
	const isAutoRotating = $derived(session?.controls.isAutoRotating ?? false);

	const buttonClass =
		'material-iron grid size-11 place-items-center rounded-md text-foreground hover:bg-hover-surface hover:text-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

	const attachPreview: Attachment<HTMLElement> = (container) => {
		const opened = openPreview(container);
		session = opened;
		return () => {
			opened.destroy();
			session = null;
		};
	};

	async function enterFullscreen(): Promise<void> {
		session?.setFullscreen(true);
		if (frame && document.fullscreenEnabled) {
			try {
				await frame.requestFullscreen();
				isUsingNativeFullscreen = true;
			} catch {
				isUsingNativeFullscreen = false;
			}
		}
	}

	async function exitFullscreen(): Promise<void> {
		session?.setFullscreen(false);
		if (isUsingNativeFullscreen && document.fullscreenElement === frame) {
			isUsingNativeFullscreen = false;
			await document.exitFullscreen();
		}
	}

	function toggleFullscreen(): void {
		if (isFullscreen) void exitFullscreen();
		else void enterFullscreen();
	}

	function syncFullscreenAfterBrowserExit(): void {
		if (isUsingNativeFullscreen && document.fullscreenElement !== frame) {
			isUsingNativeFullscreen = false;
			session?.setFullscreen(false);
		}
	}

	function closeFullscreenOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape' && isFullscreen && !isUsingNativeFullscreen) {
			event.stopPropagation();
			session?.setFullscreen(false);
		}
	}

	function moveFocusBetweenButtons(event: KeyboardEvent): void {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		const buttons = [...(toolbar?.querySelectorAll('button') ?? [])];
		const index = buttons.findIndex((button) => button === document.activeElement);
		if (index < 0) return;
		const step = event.key === 'ArrowRight' ? 1 : -1;
		buttons[(index + step + buttons.length) % buttons.length]?.focus();
		event.preventDefault();
	}
</script>

<svelte:document onfullscreenchange={syncFullscreenAfterBrowserExit} />
<svelte:window onkeydowncapture={closeFullscreenOnEscape} />

<div
	bind:this={frame}
	class="relative overflow-hidden border border-edge bg-background shadow-well {isFullscreen
		? 'fixed inset-0 z-100 h-dvh'
		: `rounded-md ${heightClass} ${className}`}"
>
	<div class="size-full" aria-label={label} role="img" {@attach attachPreview}></div>

	{#if session}
		{@const controlled = session}
		<div
			bind:this={toolbar}
			role="toolbar"
			tabindex="-1"
			aria-label="Sterowanie podglądem 3D"
			class="absolute right-1.5 bottom-1.5 left-1.5 flex flex-wrap justify-end gap-1.5"
			onkeydown={moveFocusBetweenButtons}
		>
			{#if !isCompact}
				<button
					type="button"
					class={buttonClass}
					aria-label="Przechyl model w górę"
					title="Przechyl w górę"
					onclick={() => controlled.tiltUp()}
				>
					<ChevronUpIcon class="size-5" />
				</button>
				<button
					type="button"
					class={buttonClass}
					aria-label="Przechyl model w dół"
					title="Przechyl w dół"
					onclick={() => controlled.tiltDown()}
				>
					<ChevronDownIcon class="size-5" />
				</button>
				<button
					type="button"
					class={buttonClass}
					aria-label="Przybliż model"
					title="Przybliż"
					onclick={() => controlled.zoomIn()}
				>
					<ZoomInIcon class="size-5" />
				</button>
				<button
					type="button"
					class={buttonClass}
					aria-label="Oddal model"
					title="Oddal"
					onclick={() => controlled.zoomOut()}
				>
					<ZoomOutIcon class="size-5" />
				</button>
			{/if}
			<button
				type="button"
				class="{buttonClass} {isAutoRotating ? 'plate-selected' : ''}"
				aria-label="Obracaj model automatycznie"
				aria-pressed={isAutoRotating}
				title="Obrót automatyczny"
				onclick={() => controlled.toggleAutoRotation()}
			>
				<OrbitIcon class="size-5" />
			</button>
			<button
				type="button"
				class={buttonClass}
				aria-label="Przywróć domyślny widok"
				title="Przywróć widok"
				onclick={() => controlled.resetView()}
			>
				<RotateCcwIcon class="size-5" />
			</button>
			<button
				type="button"
				class={buttonClass}
				aria-label={isFullscreen ? 'Zamknij pełny ekran' : 'Pokaż na pełnym ekranie'}
				title={isFullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'}
				onclick={toggleFullscreen}
			>
				{#if isFullscreen}
					<MinimizeIcon class="size-5" />
				{:else}
					<MaximizeIcon class="size-5" />
				{/if}
			</button>
		</div>
	{/if}
</div>
