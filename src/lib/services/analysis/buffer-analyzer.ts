import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';

export interface BufferCandidate extends LocalPoint {
	groupId: string;
	label: string;
	quantity: number;
}

export interface BufferGroupLine {
	label: string;
	quantity: number;
}

export interface BufferGroup {
	groupId: string;
	total: number;
	lines: BufferGroupLine[];
}

const RING_SEGMENTS = 96;

/** Analiza zasięgu: co leży w kole o zadanym promieniu wokół punktu (w poziomie). */
export class BufferAnalyzer {
	/**
	 * Zwraca grupy w kolejności `groupOrder` (także puste), a w grupie linie o tej samej etykiecie
	 * zsumowane i ułożone od najliczniejszej.
	 */
	groupWithinRadius(
		origin: LocalPoint,
		radiusMetres: number,
		candidates: readonly BufferCandidate[],
		groupOrder: readonly string[]
	): BufferGroup[] {
		const quantitiesByGroup = new Map<string, Map<string, number>>(
			groupOrder.map((groupId) => [groupId, new Map<string, number>()])
		);
		for (const candidate of candidates) {
			const distance = Math.hypot(candidate.east - origin.east, candidate.north - origin.north);
			if (distance > radiusMetres) continue;
			const quantities = quantitiesByGroup.get(candidate.groupId);
			if (!quantities) continue;
			quantities.set(candidate.label, (quantities.get(candidate.label) ?? 0) + candidate.quantity);
		}
		return groupOrder.map((groupId) => {
			const lines = [...(quantitiesByGroup.get(groupId) ?? [])]
				.map(([label, quantity]) => ({ label, quantity }))
				.sort((a, b) => b.quantity - a.quantity || a.label.localeCompare(b.label, 'pl'));
			return { groupId, total: lines.reduce((sum, line) => sum + line.quantity, 0), lines };
		});
	}

	buildRing(centre: LocalPoint, radiusMetres: number): LocalPoint[] {
		return Array.from({ length: RING_SEGMENTS + 1 }, (_, step) => {
			const angle = (step / RING_SEGMENTS) * 2 * Math.PI;
			return {
				east: centre.east + radiusMetres * Math.cos(angle),
				north: centre.north + radiusMetres * Math.sin(angle),
				height: centre.height
			};
		});
	}
}
