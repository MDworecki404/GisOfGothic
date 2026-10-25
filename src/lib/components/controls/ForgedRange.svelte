<script lang="ts">
	interface Props {
		value: number;
		min: number;
		max: number;
		step: number;
		label: string;
		valueText?: string;
		onValueChange: (value: number) => void;
	}

	let { value, min, max, step, label, valueText, onValueChange }: Props = $props();

	const filledPercent = $derived(((value - min) / (max - min)) * 100);
</script>

<input
	type="range"
	class="range-forged"
	{min}
	{max}
	{step}
	{value}
	aria-label={label}
	aria-valuetext={valueText}
	style:--range-fill="{filledPercent}%"
	oninput={(event) => onValueChange(Number(event.currentTarget.value))}
/>
