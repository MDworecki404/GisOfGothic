import {
	BillboardCollection,
	Cartesian3,
	Color,
	NearFarScalar,
	PointPrimitiveCollection,
	type Viewer
} from 'cesium';
import { MAP_ICON_NODES } from '#lib/services/layers/map-icon-shapes.js';
import type { MapIconId, MapIconNode } from '#lib/services/layers/map-icons.js';

export interface DataLayerPoint {
	lon: number;
	lat: number;
	h: number;
	iconId?: MapIconId;
}

export interface FeaturePick {
	layerId: string;
	featureIndex: number;
}

const POINT_PIXEL_SIZE = 8;
const POINT_OUTLINE_COLOR = Color.fromCssColorString('#14110d');
const SCALE_BY_DISTANCE = new NearFarScalar(50, 1.4, 3000, 0.75);
const ICON_SIZE_PIXELS = 26;
const ICON_OUTLINE_COLOR = '#14110d';

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
	private readonly collections = new Map<string, PointPrimitiveCollection | BillboardCollection>();
	private readonly iconImages = new Map<string, string>();

	constructor(private readonly viewer: Viewer) {}

	showLayer(layerId: string, points: readonly DataLayerPoint[], cssColor: string): void {
		this.hideLayer(layerId);
		if (points.some((point) => point.iconId !== undefined)) {
			this.showIconLayer(layerId, points, cssColor);
			return;
		}
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

	/**
	 * Punkty warstwy jako ikony kategorii: jedna kolekcja billboardów, a obraz każdej pary
	 * ikona–kolor jest budowany raz (SVG z ciemną obwódką dla czytelności na terenie).
	 */
	private showIconLayer(
		layerId: string,
		points: readonly DataLayerPoint[],
		cssColor: string
	): void {
		const collection = new BillboardCollection();
		points.forEach((point, featureIndex) => {
			const id: FeaturePick = { layerId, featureIndex };
			collection.add({
				id,
				position: Cartesian3.fromDegrees(point.lon, point.lat, point.h),
				image: this.buildIconImage(point.iconId ?? 'misc', cssColor),
				width: ICON_SIZE_PIXELS,
				height: ICON_SIZE_PIXELS,
				scaleByDistance: SCALE_BY_DISTANCE
			});
		});
		this.viewer.scene.primitives.add(collection);
		this.collections.set(layerId, collection);
	}

	private renderNodes(nodes: readonly MapIconNode[]): string {
		return nodes
			.map(([tag, attributes]) => {
				const serialised = Object.entries(attributes)
					.map(([name, value]) => `${name}="${value}"`)
					.join(' ');
				return `<${tag} ${serialised}/>`;
			})
			.join('');
	}

	private buildIconImage(iconId: MapIconId, cssColor: string): string {
		const key = `${iconId}:${cssColor}`;
		const cached = this.iconImages.get(key);
		if (cached) return cached;
		const shape = this.renderNodes(MAP_ICON_NODES[iconId]);
		const svg =
			`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
			`<g stroke="${ICON_OUTLINE_COLOR}" stroke-width="5">${shape}</g>` +
			`<g stroke="${cssColor}" stroke-width="2.4">${shape}</g></svg>`;
		const image = `data:image/svg+xml;base64,${btoa(svg)}`;
		this.iconImages.set(key, image);
		return image;
	}

	hideAllLayers(): void {
		for (const layerId of [...this.collections.keys()]) this.hideLayer(layerId);
	}
}
