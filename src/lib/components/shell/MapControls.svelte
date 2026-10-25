<script lang="ts">
	import GamepadIcon from '@lucide/svelte/icons/gamepad-2';
	import HouseIcon from '@lucide/svelte/icons/house';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { appState, flightControls, geoportal } from '#lib/composition-root.js';

	const controlButton =
		'grid size-9.5 place-items-center border-b border-border text-foreground last:border-b-0 hover:bg-secondary';
</script>

<div
	class="fixed top-[calc(var(--top-bar-height)+var(--gutter))] right-(--gutter) z-10 flex flex-col items-center gap-2.5 md:right-3.5"
>
	<button
		class="material-leather grid size-12 place-items-center rounded-full md:size-16"
		title="Obróć mapę na północ"
		aria-label="Obróć mapę na północ"
		onclick={() => geoportal.turnMapToNorth()}
	>
		<svg
			class="size-9 md:size-11"
			viewBox="0 0 44 44"
			aria-hidden="true"
			style:transform="rotate({-appState.headingDegrees}deg)"
		>
			<circle cx="22" cy="22" r="20" fill="none" stroke="var(--border)" />
			<path d="M22 4 L26 22 L22 20 L18 22 Z" fill="var(--primary)" />
			<path d="M22 40 L26 22 L22 24 L18 22 Z" fill="var(--iron)" />
			<text x="22" y="15" text-anchor="middle" font-size="7" fill="var(--background)">N</text>
		</svg>
	</button>
	<div class="material-leather flex flex-col overflow-hidden rounded-sm">
		<button class={controlButton} aria-label="Przybliż" onclick={() => geoportal.zoomIn()}>
			<PlusIcon class="size-4" />
		</button>
		<button class={controlButton} aria-label="Oddal" onclick={() => geoportal.zoomOut()}>
			<MinusIcon class="size-4" />
		</button>
		<button
			class={controlButton}
			aria-label="Pokaż cały świat"
			title="Pokaż cały świat"
			onclick={() => geoportal.showWholeWorld()}
		>
			<HouseIcon class="size-4" />
		</button>
		<button
			class="{controlButton} {flightControls.areSticksShown ? 'bg-secondary text-primary' : ''}"
			aria-label="Joysticki lotu kamerą"
			aria-pressed={flightControls.areSticksShown}
			title="Joysticki lotu kamerą (klawiatura: WASD, strzałki, Q/E)"
			onclick={() => flightControls.toggleSticks()}
		>
			<GamepadIcon class="size-4" />
		</button>
	</div>
</div>
