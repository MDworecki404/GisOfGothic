import type { WaypointGraph } from './waypoint-graph.js';

interface QueueEntry {
	nodeIndex: number;
	priority: number;
}

/** Kolejka priorytetowa (kopiec binarny): najpierw wychodzi wpis o najmniejszym priorytecie. */
class MinimumPriorityQueue {
	private readonly entries: QueueEntry[] = [];

	get isEmpty(): boolean {
		return this.entries.length === 0;
	}

	push(entry: QueueEntry): void {
		this.entries.push(entry);
		this.moveUp(this.entries.length - 1);
	}

	pop(): QueueEntry | undefined {
		const top = this.entries[0];
		const last = this.entries.pop();
		if (top === undefined || last === undefined) return undefined;
		if (this.entries.length > 0) {
			this.entries[0] = last;
			this.moveDown(0);
		}
		return top;
	}

	private moveUp(start: number): void {
		let child = start;
		while (child > 0) {
			const parent = (child - 1) >> 1;
			if (this.entries[parent].priority <= this.entries[child].priority) return;
			this.swap(parent, child);
			child = parent;
		}
	}

	private moveDown(start: number): void {
		let parent = start;
		for (;;) {
			const left = parent * 2 + 1;
			const right = left + 1;
			let smallest = parent;
			if (
				left < this.entries.length &&
				this.entries[left].priority < this.entries[smallest].priority
			)
				smallest = left;
			if (
				right < this.entries.length &&
				this.entries[right].priority < this.entries[smallest].priority
			)
				smallest = right;
			if (smallest === parent) return;
			this.swap(parent, smallest);
			parent = smallest;
		}
	}

	private swap(first: number, second: number): void {
		[this.entries[first], this.entries[second]] = [this.entries[second], this.entries[first]];
	}
}

/**
 * Najkrótsza droga po grafie algorytmem A*. Heurystyką jest odległość w linii prostej w poziomie;
 * nigdy nie przekracza ona wagi krawędzi (waga to odległość w poziomie), więc wynik jest optymalny.
 */
export class RouteFinder {
	findShortestPath(graph: WaypointGraph, startIndex: number, endIndex: number): number[] | null {
		const end = graph.readNode(endIndex);
		const estimateRemaining = (nodeIndex: number): number => {
			const point = graph.readNode(nodeIndex);
			return Math.hypot(point.east - end.east, point.north - end.north);
		};
		const costFromStart = new Map<number, number>([[startIndex, 0]]);
		const previousNode = new Map<number, number>();
		const queue = new MinimumPriorityQueue();
		queue.push({ nodeIndex: startIndex, priority: estimateRemaining(startIndex) });

		while (!queue.isEmpty) {
			const current = queue.pop();
			if (current === undefined) break;
			if (current.nodeIndex === endIndex) return this.rebuildPath(previousNode, endIndex);
			const currentCost = costFromStart.get(current.nodeIndex) ?? Number.POSITIVE_INFINITY;
			for (const neighbour of graph.listNeighbours(current.nodeIndex)) {
				const cost = currentCost + neighbour.lengthMetres;
				if (cost >= (costFromStart.get(neighbour.index) ?? Number.POSITIVE_INFINITY)) continue;
				costFromStart.set(neighbour.index, cost);
				previousNode.set(neighbour.index, current.nodeIndex);
				queue.push({
					nodeIndex: neighbour.index,
					priority: cost + estimateRemaining(neighbour.index)
				});
			}
		}
		return null;
	}

	private rebuildPath(previousNode: ReadonlyMap<number, number>, endIndex: number): number[] {
		const path = [endIndex];
		let current = endIndex;
		for (;;) {
			const previous = previousNode.get(current);
			if (previous === undefined) return path.reverse();
			path.push(previous);
			current = previous;
		}
	}
}
