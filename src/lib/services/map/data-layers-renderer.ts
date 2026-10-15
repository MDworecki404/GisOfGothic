import { Cartesian3, Color, NearFarScalar, PointPrimitiveCollection, type Viewer } from 'cesium';

export interface DataLayerPoint {
	lon: number;
	lat: number;
	h: number;
}

export interface FeaturePick {
	layerId: string;
	featureIndex: number;
}

const POINT_PIXEL_SIZE = 8;
const POINT_OUTLINE_COLOR = Color.fromCssColorString('#14110d');
const SCALE_BY_DISTANCE = new NearFarScalar(50, 1.4, 3000, 0.75);

export function isFeaturePick(value: unknown): value is FeaturePick {
	return (
		typeof value === 'object' &&
		value !== null &&
		'layerId' in value &&
		typeof value.layerId === 'string' &&
		'featureIndex' in value &&
		typeof value.featureIndex === 'number'
	);
}

/**
 * Warstwy danych jako osobne kolekcje punktów. Identyfikator każdego punktu to `FeaturePick`,
 * dzięki czemu kliknięty punkt da się wskazać w danych bez dodatkowych map.
 */
export class DataLayersRenderer {
	private readonly collections = new Map<string, PointPrimitiveCollection>();

	constructor(private readonly viewer: Viewer) {}

	showLayer(layerId: string, points: readonly DataLayerPoint[], cssColor: string): void {
		this.hideLayer(layerId);
		const collection = new PointPrimitiveCollection();
		const color = Color.fromCssColorString(cssColor);
		points.forEach((point, featureIndex) => {
			const id: FeaturePick = { layerId, featureIndex };
			collection.add({
				id,
				position: Cartesian3.fromDegrees(point.lon, point.lat, point.h),
				color,
				pixelSize: POINT_PIXEL_SIZE,
				outlineColor: POINT_OUTLINE_COLOR,
				outlineWidth: 1.5,
				scaleByDistance: SCALE_BY_DISTANCE
			});
		});
		this.viewer.scene.primitives.add(collection);
		this.collections.set(layerId, collection);
	}

	hideLayer(layerId: string): void {
		const collection = this.collections.get(layerId);
		if (!collection) return;
		this.viewer.scene.primitives.remove(collection);
		this.collections.delete(layerId);
	}

	hideAllLayers(): void {
		for (const layerId of [...this.collections.keys()]) this.hideLayer(layerId);
	}
}
