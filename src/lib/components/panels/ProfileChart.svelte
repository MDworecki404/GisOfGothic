<script lang="ts">
	interface ProfilePoint {
		distanceMetres: number;
		height: number;
	}

	interface Props {
		samples: readonly ProfilePoint[];
		minimumHeight: number;
		maximumHeight: number;
	}

	let { samples, minimumHeight, maximumHeight }: Props = $props();

	const WIDTH = 320;
	const HEIGHT = 110;
	const PADDING_TOP = 8;
	const PADDING_BOTTOM = 18;

	const totalDistance = $derived(samples.at(-1)?.distanceMetres ?? 0);
	const heightRange = $derived(Math.max(maximumHeight - minimumHeight, 1));

	function toX(distanceMetres: number): number {
		return totalDistance === 0 ? 0 : (distanceMetres / totalDistance) * WIDTH;
	}

	function toY(height: number): number {
		const usableHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
		return PADDING_TOP + usableHeight * (1 - (height - minimumHeight) / heightRange);
	}

	const linePath = $derived(
		samples
			.map(
				(sample, index) =>
					`${index === 0 ? 'M' : 'L'}${toX(sample.distanceMetres)} ${toY(sample.height)}`
			)
			.join(' ')
	);
	const areaPath = $derived(
		`${linePath} L${WIDTH} ${HEIGHT - PADDING_BOTTOM} L0 ${HEIGHT - PADDING_BOTTOM} Z`
	);
	const formatMetres = (value: number) => `${Math.round(value)} m`;
</script>

<svg
	viewBox="0 0 {WIDTH} {HEIGHT}"
	class="w-full"
	role="img"
	aria-label="Profil terenu: od {formatMetres(minimumHeight)} do {formatMetres(
		maximumHeight
	)} wysokości na {formatMetres(totalDistance)}"
>
	<path d={areaPath} fill="var(--input)" />
	<path d={linePath} fill="none" stroke="var(--primary)" stroke-width="1.6" />
	<line
		x1="0"
		y1={HEIGHT - PADDING_BOTTOM}
		x2={WIDTH}
		y2={HEIGHT - PADDING_BOTTOM}
		stroke="var(--border)"
	/>
	<text x="2" y={HEIGHT - 4} font-size="10" fill="var(--muted-foreground)">0 m</text>
	<text
		x={WIDTH - 2}
		y={HEIGHT - 4}
		font-size="10"
		fill="var(--muted-foreground)"
		text-anchor="end"
	>
		{formatMetres(totalDistance)}
	</text>
	<text x="2" y={PADDING_TOP + 8} font-size="10" fill="var(--muted-foreground)">
		{formatMetres(maximumHeight)}
	</text>
</svg>
