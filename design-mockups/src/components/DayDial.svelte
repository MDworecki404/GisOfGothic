<script lang="ts">
	interface Props {
		hour: number;
		onchange: (hour: number) => void;
	}

	let { hour, onchange }: Props = $props();

	const CENTER = 100;
	const RADIUS = 78;
	let dial = $state<SVGSVGElement | null>(null);
	let dragging = false;

	function pointOnDial(hourValue: number, radius: number): { x: number; y: number } {
		const angle = (hourValue / 24) * Math.PI * 2;
		return { x: CENTER + Math.sin(angle) * radius, y: CENTER + Math.cos(angle) * radius };
	}

	function buildArc(fromHour: number, toHour: number, radius: number): string {
		const start = pointOnDial(fromHour, radius);
		const end = pointOnDial(toHour, radius);
		const largeArc = toHour - fromHour > 12 ? 1 : 0;
		return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
	}

	function updateFromPointer(event: PointerEvent): void {
		if (!dial) {
			return;
		}
		const rect = dial.getBoundingClientRect();
		const deltaX = event.clientX - (rect.left + rect.width / 2);
		const deltaY = event.clientY - (rect.top + rect.height / 2);
		const angle = Math.atan2(deltaX, deltaY);
		const rawHour = ((angle / (Math.PI * 2)) * 24 + 24) % 24;
		onchange(Math.round(rawHour * 2) / 2);
	}

	function handleKeyDown(event: KeyboardEvent): void {
		const step = event.shiftKey ? 3 : 0.5;
		if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
			event.preventDefault();
			onchange((hour + step) % 24);
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
			event.preventDefault();
			onchange((hour - step + 24) % 24);
		}
	}

	const handle = $derived(pointOnDial(hour, RADIUS));
	const labelHours = [0, 6, 12, 18];
	const HOUR_TICKS = Array.from({ length: 24 }, (_, index) => index);
</script>

<svg
	bind:this={dial}
	class="dial"
	viewBox="0 0 200 200"
	role="slider"
	tabindex="0"
	aria-label="Godzina doby"
	aria-valuemin="0"
	aria-valuemax="24"
	aria-valuenow={hour}
	aria-valuetext={`${String(Math.floor(hour)).padStart(2, '0')}:${hour % 1 ? '30' : '00'}`}
	onpointerdown={(event) => {
		dragging = true;
		event.currentTarget.setPointerCapture(event.pointerId);
		updateFromPointer(event);
	}}
	onpointermove={(event) => dragging && updateFromPointer(event)}
	onpointerup={() => (dragging = false)}
	onkeydown={handleKeyDown}
>
	<circle cx={CENTER} cy={CENTER} r="92" fill="var(--grafit)" stroke="var(--linia)" />
	<circle
		cx={CENTER}
		cy={CENTER}
		r={RADIUS}
		fill="none"
		stroke="var(--kamien-3)"
		stroke-width="12"
	/>
	<path d={buildArc(6, 20, RADIUS)} fill="none" stroke="var(--mosiadz-ciemny)" stroke-width="12" />
	{#each HOUR_TICKS as tickHour (tickHour)}
		{@const outer = pointOnDial(tickHour, 90)}
		{@const inner = pointOnDial(tickHour, tickHour % 6 === 0 ? 84 : 87)}
		<line
			x1={outer.x}
			y1={outer.y}
			x2={inner.x}
			y2={inner.y}
			stroke="var(--linia-mocna)"
			stroke-width="1"
		/>
	{/each}
	{#each labelHours as labelHour (labelHour)}
		{@const position = pointOnDial(labelHour, 62)}
		<text
			x={position.x}
			y={position.y + 4}
			text-anchor="middle"
			font-size="11"
			fill="var(--tekst-2)"
			font-family="var(--font-ui)"
		>
			{String(labelHour).padStart(2, '0')}
		</text>
	{/each}
	<text
		x={CENTER}
		y={CENTER + 8}
		text-anchor="middle"
		font-size="26"
		fill="var(--tekst)"
		font-family="var(--font-display)"
		font-weight="600"
	>
		{String(Math.floor(hour)).padStart(2, '0')}:{hour % 1 ? '30' : '00'}
	</text>
	<circle
		cx={handle.x}
		cy={handle.y}
		r="9"
		fill="var(--mosiadz)"
		stroke="var(--grafit)"
		stroke-width="3"
	/>
</svg>

<style>
	.dial {
		display: block;
		width: 100%;
		max-width: 220px;
		margin: 0 auto;
		cursor: pointer;
		touch-action: none;
		border-radius: 50%;
	}
</style>
