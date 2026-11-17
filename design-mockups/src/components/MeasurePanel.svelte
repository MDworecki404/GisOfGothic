<script lang="ts">
	import RulerIcon from '@lucide/svelte/icons/ruler';
	import { METERS_PER_WORLD_UNIT } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';

	const PROFILE_WIDTH = 300;
	const PROFILE_HEIGHT = 96;

	const totalMeters = $derived.by(() => {
		const points = mockupState.measurePoints;
		let total = 0;
		for (let index = 1; index < points.length; index += 1) {
			total += Math.hypot(
				points[index].x - points[index - 1].x,
				points[index].y - points[index - 1].y
			);
		}
		return total * METERS_PER_WORLD_UNIT;
	});

	const walkingMinutes = $derived(Math.round((totalMeters / 1000 / 5) * 60));

	const profile = $derived.by(() => {
		const points = mockupState.measurePoints;
		if (points.length < 2) {
			return [];
		}
		const samples = 24;
		return Array.from({ length: samples + 1 }, (_, index) => {
			const ratio = index / samples;
			const seed = points[0].x * 0.013 + points[points.length - 1].y * 0.017;
			const elevation =
				60 + Math.sin(ratio * 6 + seed) * 38 + Math.sin(ratio * 15 + seed * 2) * 12 + ratio * 20;
			return { x: ratio * PROFILE_WIDTH, elevation };
		});
	});

	const profilePath = $derived(
		profile
			.map(
				(sample, index) =>
					`${index === 0 ? 'M' : 'L'}${sample.x},${PROFILE_HEIGHT - sample.elevation * 0.7}`
			)
			.join(' ')
	);
	const elevations = $derived(profile.map((sample) => sample.elevation));
	const elevationGain = $derived(
		profile.reduce(
			(total, sample, index) =>
				index > 0 ? total + Math.max(0, sample.elevation - profile[index - 1].elevation) : total,
			0
		)
	);
</script>

<div class="stack">
	{#if mockupState.measurePoints.length < 2}
		<div class="empty">
			<RulerIcon size={28} strokeWidth={1.4} aria-hidden="true" />
			<h3>Wyznacz trasę</h3>
			<p>
				Kliknij na mapie pierwszy punkt, a potem kolejne. Panel policzy długość, czas marszu i
				profil wysokości.
			</p>
			<p class="count tabular">Postawione punkty: {mockupState.measurePoints.length}</p>
		</div>
	{:else}
		<dl class="stats">
			<div>
				<dt>Długość</dt>
				<dd class="tabular">
					{(totalMeters / 1000).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} km
				</dd>
			</div>
			<div>
				<dt>Marsz</dt>
				<dd class="tabular">{walkingMinutes} min</dd>
			</div>
			<div>
				<dt>Przewyższenie</dt>
				<dd class="tabular">{Math.round(elevationGain)} m</dd>
			</div>
		</dl>

		<figure>
			<figcaption>Profil wysokości</figcaption>
			<svg
				viewBox={`0 0 ${PROFILE_WIDTH} ${PROFILE_HEIGHT}`}
				role="img"
				aria-label={`Profil wysokości trasy, od ${Math.round(Math.min(...elevations))} do ${Math.round(Math.max(...elevations))} metrów`}
			>
				<path d={`${profilePath} V${PROFILE_HEIGHT} H0 Z`} fill="var(--oliwka-tlo)" />
				<path d={profilePath} fill="none" stroke="var(--oliwka)" stroke-width="2" />
				<path d={`M0 ${PROFILE_HEIGHT - 1} H${PROFILE_WIDTH}`} stroke="var(--linia-mocna)" />
			</svg>
			<div class="axis tabular">
				<span>0 km</span><span
					>{(totalMeters / 1000).toLocaleString('pl-PL', { maximumFractionDigits: 1 })} km</span
				>
			</div>
		</figure>
	{/if}

	<div class="actions">
		<button
			type="button"
			class="btn"
			disabled={mockupState.measurePoints.length === 0}
			onclick={() => (mockupState.measurePoints = mockupState.measurePoints.slice(0, -1))}
			>Cofnij punkt</button
		>
		<button
			type="button"
			class="btn ghost"
			disabled={mockupState.measurePoints.length === 0}
			onclick={() => (mockupState.measurePoints = [])}>Wyczyść</button
		>
	</div>
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-2);
		padding: var(--s-4) var(--s-2);
		text-align: center;
		color: var(--tekst-2);
	}

	.empty h3 {
		font-size: var(--tx-xl);
		color: var(--tekst);
	}

	.count {
		font-size: var(--tx-xs);
		color: var(--tekst-3);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		margin: 0;
		border: 1px solid var(--linia);
		border-radius: var(--r-ostry);
		background: var(--linia);
		overflow: hidden;
	}

	.stats div {
		padding: var(--s-3);
		background: var(--kamien-1);
	}

	dt {
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	dd {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 600;
	}

	figure {
		margin: 0;
	}

	figcaption {
		margin-bottom: var(--s-2);
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--mosiadz-jasny);
	}

	svg {
		display: block;
		width: 100%;
	}

	.axis {
		display: flex;
		justify-content: space-between;
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	.actions {
		display: flex;
		gap: var(--s-2);
	}
</style>
