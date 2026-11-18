import type { WorldExtent } from '#lib/services/map/world-extent-reader.js';
import type { SizeWorldPlacement } from '#lib/services/map/world-placement-calculator.js';

export type WorldArrangement = 'concentric' | 'southwest-corner' | 'row';

const GAP_FRACTION_OF_REFERENCE_WIDTH = 0.06;

/**
 * Ustawia światy względem otwartego tak, żeby łatwo je porównać: współśrodkowo, od wspólnego południowo-zachodniego
 * narożnika (od razu widać, który wystaje na wschód i północ) albo w rzędzie na wschód od otwartego świata.
 * Pozycja to przesunięcie od położenia natywnego świata, więc liczymy ją z różnicy środków obrysów.
 */
export class WorldArrangementCalculator {
	arrange(
		arrangement: WorldArrangement,
		reference: WorldExtent,
		extents: readonly WorldExtent[]
	): SizeWorldPlacement[] {
		if (arrangement === 'row') return this.arrangeInRow(reference, extents);
		return extents.map((extent) =>
			this.placeCentreAt(
				extent,
				arrangement === 'concentric'
					? reference.centerEast
					: reference.centerEast - reference.widthMetres / 2 + extent.widthMetres / 2,
				arrangement === 'concentric'
					? reference.centerNorth
					: reference.centerNorth - reference.depthMetres / 2 + extent.depthMetres / 2,
				reference.centerUp
			)
		);
	}

	private arrangeInRow(
		reference: WorldExtent,
		extents: readonly WorldExtent[]
	): SizeWorldPlacement[] {
		const gap = reference.widthMetres * GAP_FRACTION_OF_REFERENCE_WIDTH;
		const southEdge = reference.centerNorth - reference.depthMetres / 2;
		let nextWestEdge = reference.centerEast + reference.widthMetres / 2 + gap;
		return extents.map((extent) => {
			const placement = this.placeCentreAt(
				extent,
				nextWestEdge + extent.widthMetres / 2,
				southEdge + extent.depthMetres / 2,
				reference.centerUp
			);
			nextWestEdge += extent.widthMetres + gap;
			return placement;
		});
	}

	private placeCentreAt(
		extent: WorldExtent,
		east: number,
		north: number,
		up: number
	): SizeWorldPlacement {
		return {
			east: east - extent.centerEast,
			north: north - extent.centerNorth,
			up: up - extent.centerUp,
			headingDegrees: 0
		};
	}
}
