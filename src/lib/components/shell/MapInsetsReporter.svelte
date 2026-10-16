<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { appState, geoportal, mobileSheet } from '#lib/composition-root.js';

	const PHONE_PANEL_WIDTH_FRACTION = 0.6;
	const BREATHING_SPACE_PIXELS = 12;

	function reportCoveredMapEdges(): void {
		let leftPixels = 0;
		let bottomPixels = 0;
		for (const element of document.querySelectorAll('[data-map-obstacle]')) {
			const rect = element.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) continue;
			const isDockedToBottom = rect.width > window.innerWidth * PHONE_PANEL_WIDTH_FRACTION;
			if (isDockedToBottom) bottomPixels = Math.max(bottomPixels, window.innerHeight - rect.top);
			else leftPixels = Math.max(leftPixels, rect.right);
		}
		geoportal.reserveMapSpace({
			leftPixels: leftPixels > 0 ? leftPixels + BREATHING_SPACE_PIXELS : 0,
			bottomPixels: bottomPixels > 0 ? bottomPixels + BREATHING_SPACE_PIXELS : 0
		});
	}

	$effect(() => {
		void appState.activeToolId;
		void mobileSheet.detent;
		if (!mobileSheet.isDragging) void tick().then(reportCoveredMapEdges);
	});

	function reportCoveredMapEdgesAfterSheetTransition(event: TransitionEvent): void {
		if (event.propertyName === 'height') reportCoveredMapEdges();
	}

	onMount(() => {
		window.addEventListener('resize', reportCoveredMapEdges);
		window.addEventListener('transitionend', reportCoveredMapEdgesAfterSheetTransition);
		return () => {
			window.removeEventListener('resize', reportCoveredMapEdges);
			window.removeEventListener('transitionend', reportCoveredMapEdgesAfterSheetTransition);
		};
	});
</script>
