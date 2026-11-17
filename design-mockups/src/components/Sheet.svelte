<script lang="ts">
	import type { Snippet } from 'svelte';
	import XIcon from '@lucide/svelte/icons/x';
	import { mockupState, type SheetDetent } from '../state/mockup-state.svelte.js';

	interface Props {
		title: string;
		onclose: () => void;
		children: Snippet;
	}

	let { title, onclose, children }: Props = $props();

	const DETENT_HEIGHTS: Record<SheetDetent, string> = {
		peek: '84px',
		half: '46dvh',
		full: 'calc(100dvh - 130px)'
	};
	const DETENT_ORDER: readonly SheetDetent[] = ['peek', 'half', 'full'];

	let gripButton = $state<HTMLButtonElement | null>(null);
	let dragStartY = 0;
	let dragStartIndex = 0;

	function cycleDetent(): void {
		const index = DETENT_ORDER.indexOf(mockupState.sheetDetent);
		mockupState.sheetDetent = DETENT_ORDER[(index + 1) % DETENT_ORDER.length];
	}

	function handlePointerDown(event: PointerEvent): void {
		dragStartY = event.clientY;
		dragStartIndex = DETENT_ORDER.indexOf(mockupState.sheetDetent);
		gripButton?.setPointerCapture(event.pointerId);
	}

	function handlePointerUp(event: PointerEvent): void {
		const delta = event.clientY - dragStartY;
		if (Math.abs(delta) < 8) {
			cycleDetent();
			return;
		}
		const nextIndex = Math.min(2, Math.max(0, dragStartIndex + (delta < 0 ? 1 : -1)));
		mockupState.sheetDetent = DETENT_ORDER[nextIndex];
	}
</script>

<section class="sheet" aria-label={title} style:height={DETENT_HEIGHTS[mockupState.sheetDetent]}>
	<div class="grip-row">
		<button
			type="button"
			class="grip"
			bind:this={gripButton}
			aria-label={`Rozmiar panelu ${title}: przeciągnij lub naciśnij, aby zmienić`}
			onpointerdown={handlePointerDown}
			onpointerup={handlePointerUp}
			onkeydown={(event) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					cycleDetent();
				}
			}}
		>
			<span></span>
		</button>
		<button type="button" class="btn icon ghost close" aria-label="Zamknij panel" onclick={onclose}>
			<XIcon size={18} />
		</button>
	</div>
	<div class="body scroll">
		{@render children()}
	</div>
</section>

<style>
	.sheet {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 40;
		display: flex;
		flex-direction: column;
		background: var(--kamien-1);
		border-top: 1px solid var(--mosiadz-ciemny);
		border-radius: var(--r-duzy) var(--r-duzy) 0 0;
		box-shadow: 0 -14px 32px rgb(0 0 0 / 0.5);
		transition: height var(--czas-sredni) var(--ruch);
		overflow: hidden;
	}

	.grip-row {
		position: relative;
		display: flex;
		justify-content: center;
		flex: none;
	}

	.grip {
		display: grid;
		place-items: center;
		width: 160px;
		height: 28px;
		border: 0;
		background: none;
		touch-action: none;
	}

	.grip span {
		width: 40px;
		height: 4px;
		border-radius: 2px;
		background: var(--linia-mocna);
	}

	.close {
		position: absolute;
		right: 4px;
		top: -4px;
	}

	.body {
		flex: 1;
		min-height: 0;
		padding: 0 var(--s-4) var(--s-5);
	}
</style>
