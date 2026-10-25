<script lang="ts">
	interface Props {
		label: string;
		onDeflect: (offsetXPixels: number, offsetYPixels: number, radiusPixels: number) => void;
		onRelease: () => void;
	}

	let { label, onDeflect, onRelease }: Props = $props();

	let base: HTMLDivElement;
	let activePointerId: number | null = null;
	let thumbX = $state(0);
	let thumbY = $state(0);

	function moveStickTo(event: PointerEvent): void {
		const bounds = base.getBoundingClientRect();
		const radius = bounds.width / 2;
		const offsetX = event.clientX - (bounds.left + radius);
		const offsetY = event.clientY - (bounds.top + radius);
		const length = Math.hypot(offsetX, offsetY);
		const scale = length > radius ? radius / length : 1;
		thumbX = offsetX * scale;
		thumbY = offsetY * scale;
		onDeflect(offsetX, offsetY, radius);
	}

	function startDragging(event: PointerEvent): void {
		if (activePointerId !== null) return;
		activePointerId = event.pointerId;
		base.setPointerCapture(event.pointerId);
		moveStickTo(event);
	}

	function keepDragging(event: PointerEvent): void {
		if (event.pointerId === activePointerId) moveStickTo(event);
	}

	function stopDragging(event: PointerEvent): void {
		if (event.pointerId !== activePointerId) return;
		activePointerId = null;
		thumbX = 0;
		thumbY = 0;
		onRelease();
	}
</script>

<div
	bind:this={base}
	class="material-leather pointer-events-auto relative size-28 touch-none rounded-full select-none md:size-32"
	role="application"
	aria-label={label}
	onpointerdown={startDragging}
	onpointermove={keepDragging}
	onpointerup={stopDragging}
	onpointercancel={stopDragging}
>
	<div
		class="pointer-events-none absolute top-1/2 left-1/2 size-12 rounded-full border border-[var(--iron)] bg-primary/80 shadow-md md:size-14"
		style:transform="translate(calc(-50% + {thumbX}px), calc(-50% + {thumbY}px))"
	></div>
</div>
