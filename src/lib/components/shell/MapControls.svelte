<script lang="ts">
	import BoxIcon from '@lucide/svelte/icons/box';
	import GamepadIcon from '@lucide/svelte/icons/gamepad-2';
	import HouseIcon from '@lucide/svelte/icons/house';
	import MapIcon from '@lucide/svelte/icons/map';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import CameraSettingsPopover from '#lib/components/shell/CameraSettingsPopover.svelte';
	import { appState, flightControls, geoportal } from '#lib/composition-root.js';

	let isCameraSettingsOpen = $state(false);
	let cameraSettingsButton = $state<HTMLButtonElement>();

	const controlButton =
		'map-control-button grid size-11 place-items-center text-foreground hover:bg-hover-surface hover:text-hover';

	function closeCameraSettingsOnOutsideClick(event: MouseEvent): void {
		if (!isCameraSettingsOpen) return;
		const isInsideSettings =
			event.target instanceof Element && event.target.closest('[data-camera-settings]') !== null;
		if (!isInsideSettings) isCameraSettingsOpen = false;
	}

	function closeCameraSettingsOnEscape(event: KeyboardEvent): void {
		if (!isCameraSettingsOpen || event.key !== 'Escape') return;
		event.stopPropagation();
		isCameraSettingsOpen = false;
		cameraSettingsButton?.focus();
	}
</script>

<svelte:window
	onclick={closeCameraSettingsOnOutsideClick}
	onkeydown={closeCameraSettingsOnEscape}
/>

<div
	class="fixed top-[calc(var(--top-bar-height)+var(--gutter))] right-(--gutter) z-10 flex flex-col items-center gap-2.5 md:right-3.5"
>
	<button
		class="map-compass grid size-13 place-items-center rounded-full md:size-16"
		class:invisible={appState.viewMode === 'view-2d'}
		inert={appState.viewMode === 'view-2d'}
		title="Obróć mapę na północ"
		aria-label="Obróć mapę na północ"
		onclick={() => geoportal.turnMapToNorth()}
	>
		<svg
			class="size-10 md:size-12"
			viewBox="0 0 54 54"
			aria-hidden="true"
			style:transform="rotate({-appState.headingDegrees}deg)"
		>
			<circle
				cx="27"
				cy="27"
				r="23"
				fill="none"
				stroke="var(--ochre)"
				stroke-opacity="0.4"
				stroke-dasharray="2 3"
			/>
			<path d="M5 27 27 23 24 27 27 31Z" fill="var(--stone)" opacity="0.7" />
			<path d="M49 27 27 23 30 27 27 31Z" fill="var(--stone)" opacity="0.7" />
			<path d="M27 49 31 27 27 30 23 27Z" fill="var(--iron-light)" />
			<path d="M27 4 31 27 27 24 23 27Z" fill="var(--ochre)" />
			<text
				x="27"
				y="16"
				text-anchor="middle"
				font-family="Grenze Gotisch, serif"
				font-size="9"
				font-weight="600"
				fill="var(--pitch)">N</text
			>
		</svg>
	</button>
	<div class="material-leather flex flex-col overflow-hidden rounded-md">
		<button
			class={controlButton}
			aria-label="Przybliż"
			title="Przybliż"
			onclick={() => geoportal.zoomIn()}
		>
			<PlusIcon class="size-5" />
		</button>
		<button
			class={controlButton}
			aria-label="Oddal"
			title="Oddal"
			onclick={() => geoportal.zoomOut()}
		>
			<MinusIcon class="size-5" />
		</button>
		<button
			class={controlButton}
			aria-label="Pokaż cały świat"
			title="Pokaż cały świat"
			onclick={() => geoportal.showWholeWorld()}
		>
			<HouseIcon class="size-5" />
		</button>
		<button
			class="{controlButton} aria-pressed:bg-active-surface aria-pressed:text-active"
			aria-label="Joysticki lotu kamerą"
			aria-pressed={flightControls.areSticksShown}
			title="Joysticki lotu kamerą (klawiatura: WASD, strzałki, Q/E)"
			onclick={() => flightControls.toggleSticks()}
		>
			<GamepadIcon class="size-5" />
		</button>
		<button
			bind:this={cameraSettingsButton}
			class="{controlButton} aria-pressed:bg-active-surface aria-pressed:text-active"
			aria-label="Rzut kamery"
			aria-pressed={appState.cameraProjection.kind === 'orthographic'}
			aria-expanded={isCameraSettingsOpen}
			title="Rzut kamery (klawisz P)"
			data-camera-settings
			onclick={() => (isCameraSettingsOpen = !isCameraSettingsOpen)}
		>
			<BoxIcon class="size-5" />
		</button>
		<button
			class="{controlButton} aria-pressed:bg-active-surface aria-pressed:text-active"
			aria-label="Widok 2D"
			aria-pressed={appState.viewMode === 'view-2d'}
			title="Widok 2D: płaska mapa z góry"
			onclick={() =>
				geoportal.selectViewMode(appState.viewMode === 'view-2d' ? 'view-3d' : 'view-2d')}
		>
			<MapIcon class="size-5" />
		</button>
	</div>
	{#if isCameraSettingsOpen}
		<CameraSettingsPopover onClose={() => (isCameraSettingsOpen = false)} />
	{/if}
</div>
