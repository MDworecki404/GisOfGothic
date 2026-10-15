import { describe, expect, it } from 'vitest';
import { DensityGridBuilder, type WeightedPoint } from './density-grid-builder.js';

const builder = new DensityGridBuilder();

function point(east: number, north: number, weight = 1, height = 0): WeightedPoint {
	return { east, north, height, weight };
}

describe('DensityGridBuilder', () => {
	it('kwadratowa siatka zlicza sztuki w komórkach, także ze znakiem ujemnym współrzędnych', () => {
		const grid = builder.build(
			[point(1, 1), point(24, 24, 2), point(26, 1), point(-1, -1)],
			'square',
			25
		);
		expect(grid.cells.map((cell) => cell.count).sort()).toEqual([1, 1, 3]);
		expect(grid.totalCount).toBe(5);
		expect(grid.maximumCount).toBe(3);
	});

	it('komórka kwadratowa ma cztery wierzchołki o boku równym rozmiarowi', () => {
		const [cell] = builder.build([point(30, 55)], 'square', 25).cells;
		expect(cell.vertices).toEqual([
			{ east: 25, north: 50 },
			{ east: 50, north: 50 },
			{ east: 50, north: 75 },
			{ east: 25, north: 75 }
		]);
	});

	it('sześciokąt ma sześć wierzchołków, a odległość między równoległymi bokami równa rozmiarowi', () => {
		const [cell] = builder.build([point(0, 0)], 'hex', 20).cells;
		expect(cell.vertices).toHaveLength(6);
		const eastExtent =
			Math.max(...cell.vertices.map((vertex) => vertex.east)) -
			Math.min(...cell.vertices.map((vertex) => vertex.east));
		expect(eastExtent).toBeCloseTo(20, 6);
	});

	it('punkty blisko siebie trafiają do jednego sześciokąta, a odległe do różnych', () => {
		const grid = builder.build([point(0, 0), point(1, 1), point(100, 0)], 'hex', 25);
		expect(grid.cells.map((cell) => cell.count).sort()).toEqual([1, 2]);
	});

	it('punkt leży wewnątrz swojego sześciokąta', () => {
		const target = point(47.3, -12.9);
		const [cell] = builder.build([target], 'hex', 25).cells;
		const centreEast = cell.vertices.reduce((sum, vertex) => sum + vertex.east, 0) / 6;
		const centreNorth = cell.vertices.reduce((sum, vertex) => sum + vertex.north, 0) / 6;
		expect(Math.hypot(target.east - centreEast, target.north - centreNorth)).toBeLessThanOrEqual(
			25 / Math.sqrt(3) + 1e-9
		);
	});

	it('liczy średnią wysokość ważoną ilością', () => {
		const [cell] = builder.build([point(1, 1, 1, 10), point(2, 2, 3, 20)], 'square', 25).cells;
		expect(cell.meanHeight).toBe(17.5);
	});

	it('buduje legendę z równych przedziałów, najwyżej pięciu, i koloruje komórki', () => {
		const legend = builder.buildLegend(10);
		expect(legend.map((step) => [step.from, step.to])).toEqual([
			[1, 2],
			[3, 4],
			[5, 6],
			[7, 8],
			[9, 10]
		]);
		expect(legend[0].color).toBe('#8b3a2b');
		expect(legend[4].color).toBe('#ffd27a');
	});

	it('przy małym maksimum legenda ma tyle kroków, ile sztuk', () => {
		expect(builder.buildLegend(3).map((step) => [step.from, step.to])).toEqual([
			[1, 1],
			[2, 2],
			[3, 3]
		]);
		expect(builder.buildLegend(0)).toEqual([]);
	});

	it('najgęstsza komórka ma kolor końca skali, najrzadsza początku', () => {
		const grid = builder.build([point(1, 1, 10), point(100, 100, 1)], 'square', 25);
		const colors = grid.cells.map((cell) => cell.color);
		expect(colors).toContain('#ffd27a');
		expect(colors).toContain('#8b3a2b');
	});

	it('pusta lista punktów daje pustą siatkę', () => {
		expect(builder.build([], 'hex', 25)).toEqual({
			cells: [],
			totalCount: 0,
			maximumCount: 0,
			legend: []
		});
	});
});
