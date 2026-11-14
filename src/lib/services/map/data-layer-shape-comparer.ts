export interface DataLayerPointShape {
	iconId?: string;
	cssColor?: string;
}

/** Porównuje kształt dwóch list punktów warstwy: liczbę punktów oraz ikonę i kolor każdego, bez pozycji. */
export class DataLayerShapeComparer {
	isSameShape(
		previous: readonly DataLayerPointShape[],
		next: readonly DataLayerPointShape[]
	): boolean {
		return (
			previous.length === next.length &&
			previous.every(
				(point, index) =>
					point.iconId === next[index].iconId && point.cssColor === next[index].cssColor
			)
		);
	}
}
