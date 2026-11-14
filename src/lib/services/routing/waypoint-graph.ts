import type { WaypointNetwork } from '#lib/data/types.js';
import type { LocalProjector } from '#lib/services/analysis/local-projector.js';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';

export interface GraphNeighbour {
	index: number;
	lengthMetres: number;
}

export interface NearestNode {
	index: number;
	distanceMetres: number;
}

function measureHorizontalDistance(first: LocalPoint, second: LocalPoint): number {
	return Math.hypot(first.east - second.east, first.north - second.north);
}

/**
 * Sieć dróg świata w lokalnych metrach. Punkty pod wodą wypadają z grafu, a krawędź waży tyle,
 * ile wynosi jej odległość w poziomie (tak liczymy też czas przejścia). Punkty wyszukiwane
 * z zewnątrz są przyciągane tylko do największej spójnej części sieci, żeby trasa nigdy nie
 * kończyła się na odciętej wyspie dróg.
 */
export class WaypointGraph {
	private readonly points: LocalPoint[] = [];
	private readonly neighbours: GraphNeighbour[][] = [];
	private readonly isInLargestComponent: boolean[];

	constructor(network: WaypointNetwork, projector: LocalProjector) {
		const indexByName = new Map<string, number>();
		for (const node of network.nodes) {
			if (node.isUnderwater) continue;
			indexByName.set(node.name, this.points.length);
			this.points.push(projector.projectToLocalPoint(node.lon, node.lat, node.height));
			this.neighbours.push([]);
		}
		for (const edge of network.edges) {
			const from = indexByName.get(edge.from);
			const to = indexByName.get(edge.to);
			if (from === undefined || to === undefined || from === to) continue;
			const lengthMetres = measureHorizontalDistance(this.points[from], this.points[to]);
			this.neighbours[from].push({ index: to, lengthMetres });
			this.neighbours[to].push({ index: from, lengthMetres });
		}
		this.isInLargestComponent = this.markLargestComponent();
	}

	get nodeCount(): number {
		return this.points.length;
	}

	readNode(index: number): LocalPoint {
		return this.points[index];
	}

	listNeighbours(index: number): readonly GraphNeighbour[] {
		return this.neighbours[index];
	}

	findNearestNode(point: LocalPoint): NearestNode | null {
		let nearest: NearestNode | null = null;
		for (let index = 0; index < this.points.length; index++) {
			if (!this.isInLargestComponent[index]) continue;
			const distanceMetres = measureHorizontalDistance(point, this.points[index]);
			if (nearest === null || distanceMetres < nearest.distanceMetres) {
				nearest = { index, distanceMetres };
			}
		}
		return nearest;
	}

	private markLargestComponent(): boolean[] {
		const componentOfNode: number[] = new Array<number>(this.points.length).fill(-1);
		const componentSizes: number[] = [];
		for (let start = 0; start < this.points.length; start++) {
			if (componentOfNode[start] !== -1) continue;
			const component = componentSizes.length;
			let size = 0;
			const pending = [start];
			componentOfNode[start] = component;
			while (pending.length > 0) {
				const current = pending.pop() ?? start;
				size++;
				for (const neighbour of this.neighbours[current]) {
					if (componentOfNode[neighbour.index] !== -1) continue;
					componentOfNode[neighbour.index] = component;
					pending.push(neighbour.index);
				}
			}
			componentSizes.push(size);
		}
		const largest = componentSizes.indexOf(Math.max(...componentSizes, 0));
		return componentOfNode.map((component) => component === largest);
	}
}
