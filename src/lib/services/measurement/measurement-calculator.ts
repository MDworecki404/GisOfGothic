export interface LocalPoint {
	east: number;
	north: number;
	height: number;
}

export interface PathSummary {
	horizontalMetres: number;
	straightMetres: number;
	heightDifferenceMetres: number;
}

export interface ProfileSample {
	distanceMetres: number;
	height: number;
}

export interface TerrainProfile {
	terrainMetres: number;
	ascentMetres: number;
	descentMetres: number;
	minimumHeight: number;
	maximumHeight: number;
	samples: ProfileSample[];
}

function measureHorizontalDistance(from: LocalPoint, to: LocalPoint): number {
	return Math.hypot(to.east - from.east, to.north - from.north);
}

function measureSpatialDistance(from: LocalPoint, to: LocalPoint): number {
	return Math.hypot(to.east - from.east, to.north - from.north, to.height - from.height);
}

function pairConsecutive<T>(items: readonly T[]): [T, T][] {
	return items.slice(1).map((item, index) => [items[index], item]);
}

export class MeasurementCalculator {
	summarizePath(points: readonly LocalPoint[]): PathSummary {
		const segments = pairConsecutive(points);
		const first = points.at(0);
		const last = points.at(-1);
		return {
			horizontalMetres: segments.reduce((sum, [a, b]) => sum + measureHorizontalDistance(a, b), 0),
			straightMetres: segments.reduce((sum, [a, b]) => sum + measureSpatialDistance(a, b), 0),
			heightDifferenceMetres: first && last ? last.height - first.height : 0
		};
	}

	/**
	 * Rozkłada łamaną na punkty co `spacingMetres` w poziomie (z wierzchołkami włącznie),
	 * żeby potem odczytać wysokość terenu pod każdym z nich.
	 */
	interpolateAlongPath(points: readonly LocalPoint[], spacingMetres: number): LocalPoint[] {
		const first = points.at(0);
		if (!first) return [];
		const samples: LocalPoint[] = [first];
		for (const [from, to] of pairConsecutive(points)) {
			const length = measureHorizontalDistance(from, to);
			const steps = Math.max(1, Math.ceil(length / spacingMetres));
			for (let step = 1; step <= steps; step++) {
				const fraction = step / steps;
				samples.push({
					east: from.east + (to.east - from.east) * fraction,
					north: from.north + (to.north - from.north) * fraction,
					height: from.height + (to.height - from.height) * fraction
				});
			}
		}
		return samples;
	}

	/**
	 * Model świata zawiera drzewa i dachy, więc rzut na powierzchnię daje wąskie „szpilki”.
	 * Mediana wysokości w oknie `windowSize` próbek usuwa przeszkody węższe niż pół okna,
	 * a zostawia prawdziwe zbocza.
	 */
	removeNarrowObstacles(points: readonly LocalPoint[], windowSize: number): LocalPoint[] {
		const halfWindow = Math.floor(windowSize / 2);
		return points.map((point, index) => {
			const neighbourHeights = points
				.slice(Math.max(0, index - halfWindow), index + halfWindow + 1)
				.map((neighbour) => neighbour.height)
				.sort((a, b) => a - b);
			return { ...point, height: neighbourHeights[Math.floor(neighbourHeights.length / 2)] };
		});
	}

	summarizeProfile(terrainPoints: readonly LocalPoint[]): TerrainProfile | null {
		const first = terrainPoints.at(0);
		if (!first || terrainPoints.length < 2) return null;
		let distanceMetres = 0;
		let terrainMetres = 0;
		let ascentMetres = 0;
		let descentMetres = 0;
		const samples: ProfileSample[] = [{ distanceMetres: 0, height: first.height }];
		for (const [from, to] of pairConsecutive(terrainPoints)) {
			distanceMetres += measureHorizontalDistance(from, to);
			terrainMetres += measureSpatialDistance(from, to);
			const climb = to.height - from.height;
			if (climb > 0) ascentMetres += climb;
			else descentMetres -= climb;
			samples.push({ distanceMetres, height: to.height });
		}
		const heights = samples.map((sample) => sample.height);
		return {
			terrainMetres,
			ascentMetres,
			descentMetres,
			minimumHeight: Math.min(...heights),
			maximumHeight: Math.max(...heights),
			samples
		};
	}
}
