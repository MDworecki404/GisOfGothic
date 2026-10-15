import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';

export type GridShape = 'hex' | 'square';

export interface WeightedPoint extends LocalPoint {
	weight: number;
}

export interface GridVertex {
	east: number;
	north: number;
}

export interface DensityCell {
	count: number;
	meanHeight: number;
	vertices: GridVertex[];
	color: string;
}

export interface DensityLegendStep {
	from: number;
	to: number;
	color: string;
}

export interface DensityGrid {
	cells: DensityCell[];
	totalCount: number;
	maximumCount: number;
	legend: DensityLegendStep[];
}

/** Ciepła skala motywu: rdza → żar → mosiądz → jasny żar. */
const HEAT_PALETTE_STOPS = ['#8b3a2b', '#e0662f', '#c9a24a', '#ffd27a'];
const MAXIMUM_LEGEND_STEPS = 5;
const SINGLE_STEP_PALETTE_POSITION = 0.7;
const HEX_VERTEX_COUNT = 6;

interface CellAccumulator {
	count: number;
	heightSum: number;
	vertices: GridVertex[];
}

function parseHexColor(color: string): [number, number, number] {
	return [
		parseInt(color.slice(1, 3), 16),
		parseInt(color.slice(3, 5), 16),
		parseInt(color.slice(5, 7), 16)
	];
}

function interpolatePalette(position: number): string {
	const scaled = Math.min(Math.max(position, 0), 1) * (HEAT_PALETTE_STOPS.length - 1);
	const lowerIndex = Math.min(Math.floor(scaled), HEAT_PALETTE_STOPS.length - 2);
	const fraction = scaled - lowerIndex;
	const lower = parseHexColor(HEAT_PALETTE_STOPS[lowerIndex]);
	const upper = parseHexColor(HEAT_PALETTE_STOPS[lowerIndex + 1]);
	const channels = lower.map((channel, index) =>
		Math.round(channel + (upper[index] - channel) * fraction)
			.toString(16)
			.padStart(2, '0')
	);
	return `#${channels.join('')}`;
}

/**
 * Mapa zagęszczenia: dzieli płaszczyznę na siatkę sześciokątną (`size` = odległość między
 * równoległymi bokami) albo kwadratową (`size` = bok) i zlicza w komórkach ważone punkty.
 * Zwraca tylko niepuste komórki, więc koszt zależy od liczby punktów, nie od rozmiaru świata.
 */
export class DensityGridBuilder {
	build(points: readonly WeightedPoint[], shape: GridShape, sizeMetres: number): DensityGrid {
		const accumulators = new Map<string, CellAccumulator>();
		for (const point of points) {
			const cell =
				shape === 'hex'
					? this.locateHexCell(point, sizeMetres)
					: this.locateSquareCell(point, sizeMetres);
			const accumulator = accumulators.get(cell.key) ?? {
				count: 0,
				heightSum: 0,
				vertices: cell.vertices
			};
			accumulator.count += point.weight;
			accumulator.heightSum += point.height * point.weight;
			accumulators.set(cell.key, accumulator);
		}
		const filled = [...accumulators.values()];
		const maximumCount = Math.max(0, ...filled.map((cell) => cell.count));
		const legend = this.buildLegend(maximumCount);
		return {
			cells: filled.map((cell) => ({
				count: cell.count,
				meanHeight: cell.heightSum / cell.count,
				vertices: cell.vertices,
				color: this.pickLegendStep(legend, cell.count).color
			})),
			totalCount: filled.reduce((sum, cell) => sum + cell.count, 0),
			maximumCount,
			legend
		};
	}

	/** Równe przedziały od 1 do maksimum, najwyżej pięć; liczby całkowite, bo liczymy sztuki. */
	buildLegend(maximumCount: number): DensityLegendStep[] {
		if (maximumCount < 1) return [];
		const stepCount = Math.min(MAXIMUM_LEGEND_STEPS, Math.ceil(maximumCount));
		return Array.from({ length: stepCount }, (_, index) => {
			const upper = Math.ceil((maximumCount * (index + 1)) / stepCount);
			const previousUpper = index === 0 ? 0 : Math.ceil((maximumCount * index) / stepCount);
			return {
				from: previousUpper + 1,
				to: upper,
				color: interpolatePalette(
					stepCount === 1 ? SINGLE_STEP_PALETTE_POSITION : index / (stepCount - 1)
				)
			};
		});
	}

	private pickLegendStep(legend: readonly DensityLegendStep[], count: number): DensityLegendStep {
		return legend.find((step) => count <= step.to) ?? legend[legend.length - 1];
	}

	private locateSquareCell(
		point: LocalPoint,
		sizeMetres: number
	): { key: string; vertices: GridVertex[] } {
		const column = Math.floor(point.east / sizeMetres);
		const row = Math.floor(point.north / sizeMetres);
		const west = column * sizeMetres;
		const south = row * sizeMetres;
		return {
			key: `${column}:${row}`,
			vertices: [
				{ east: west, north: south },
				{ east: west + sizeMetres, north: south },
				{ east: west + sizeMetres, north: south + sizeMetres },
				{ east: west, north: south + sizeMetres }
			]
		};
	}

	/** Sześciokąt „pointy-top” we współrzędnych osiowych (q, r) z zaokrągleniem sześciennym. */
	private locateHexCell(
		point: LocalPoint,
		widthMetres: number
	): { key: string; vertices: GridVertex[] } {
		const radius = widthMetres / Math.sqrt(3);
		const fractionalQ = ((Math.sqrt(3) / 3) * point.east - point.north / 3) / radius;
		const fractionalR = ((2 / 3) * point.north) / radius;
		const { q, r } = this.roundToNearestHex(fractionalQ, fractionalR);
		const centreEast = radius * Math.sqrt(3) * (q + r / 2);
		const centreNorth = radius * 1.5 * r;
		return {
			key: `${q}:${r}`,
			vertices: Array.from({ length: HEX_VERTEX_COUNT }, (_, corner) => {
				const angle = (Math.PI / 180) * (60 * corner + 30);
				return {
					east: centreEast + radius * Math.cos(angle),
					north: centreNorth + radius * Math.sin(angle)
				};
			})
		};
	}

	private roundToNearestHex(fractionalQ: number, fractionalR: number): { q: number; r: number } {
		const fractionalS = -fractionalQ - fractionalR;
		let q = Math.round(fractionalQ);
		let r = Math.round(fractionalR);
		const s = Math.round(fractionalS);
		const deltaQ = Math.abs(q - fractionalQ);
		const deltaR = Math.abs(r - fractionalR);
		const deltaS = Math.abs(s - fractionalS);
		if (deltaQ > deltaR && deltaQ > deltaS) q = -r - s;
		else if (deltaR > deltaS) r = -q - s;
		return { q, r };
	}
}
