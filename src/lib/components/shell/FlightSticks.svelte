<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import { appState, flightControls, geoportal } from '#lib/composition-root.js';
	import FlightStick from './FlightStick.svelte';

	const riseButton =
		'panel-stone pointer-events-auto grid size-12 touch-none place-items-center rounded-full text-foreground select-none active:bg-secondary';
	const verticalPlacement = $derived(
		appState.activeToolId
			? 'bottom-[calc(3.75rem+52dvh+14px)] md:bottom-[calc(2.25rem+16px)]'
			: 'bottom-[calc(3.75rem+14px)] md:bottom-[calc(2.25rem+16px)]'
	);
	const moveStickPlacement = $derived(
		appState.activeToolId
			? 'left-3 md:left-[calc(4rem+23rem+26px)]'
			: 'left-3 md:left-[calc(4rem+16px)]'
	);
</script>

{#if flightControls.areSticksShown}
	<div class="pointer-events-none fixed z-10 {verticalPlacement} {moveStickPlacement}">
		<FlightStick
			label="Joystick ruchu: do przodu, do tyłu i w bok"
			onDeflect={(x, y, radius) => geoportal.deflectFlightStick('move', x, y, radius)}
			onRelease={() => geoportal.releaseFlightStick('move')}
		/>
	</div>
	<div class="pointer-events-none fixed right-3 z-10 flex items-end gap-3 {verticalPlacement}">
		<div class="flex flex-col gap-2">
			<button
				class={riseButton}
				aria-label="Wznieś kamerę"
				onpointerdown={() => geoportal.pressFlightRiseButton(1)}
				onpointerup={() => geoportal.pressFlightRiseButton(0)}
				onpointercancel={() => geoportal.pressFlightRiseButton(0)}
				onpointerleave={() => geoportal.pressFlightRiseButton(0)}
				oncontextmenu={(event) => event.preventDefault()}
			>
				<ChevronUpIcon class="size-6" />
			</button>
			<button
				class={riseButton}
				aria-label="Obniż kamerę"
				onpointerdown={() => geoportal.pressFlightRiseButton(-1)}
				onpointerup={() => geoportal.pressFlightRiseButton(0)}
				onpointercancel={() => geoportal.pressFlightRiseButton(0)}
				onpointerleave={() => geoportal.pressFlightRiseButton(0)}
				oncontextmenu={(event) => event.preventDefault()}
			>
				<ChevronDownIcon class="size-6" />
			</button>
		</div>
		<FlightStick
			label="Joystick rozglądania: obrót i pochylenie kamery"
			onDeflect={(x, y, radius) => geoportal.deflectFlightStick('look', x, y, radius)}
			onRelease={() => geoportal.releaseFlightStick('look')}
		/>
	</div>
{/if}
