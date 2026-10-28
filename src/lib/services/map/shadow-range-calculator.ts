const DEFAULT_RANGE_METRES = 5000;
const MINIMUM_RANGE_METRES = 400;
const MAXIMUM_RANGE_METRES = 15000;
const RANGE_IN_VIEW_DISTANCES = 3;

/**
 * Zasięg cieni (`ShadowMap.maximumDistance`) zależny od tego, na co patrzy kamera. Cesium rozkłada
 * mapę cieni na cały zasięg, więc stały zasięg 5 km daje rozmyte cienie z bliska, a z dużej wysokości
 * obcina je zbyt blisko. Zasięg to kilkukrotność odległości do punktu pod środkiem ekranu, w granicach
 * od 400 m do 15 km; bez znanej odległości (np. niewczytane kafle) zostaje domyślne 5 km.
 */
export class ShadowRangeCalculator {
	calculateRangeMetres(viewDistanceMetres: number | null): number {
		if (viewDistanceMetres === null || !Number.isFinite(viewDistanceMetres)) {
			return DEFAULT_RANGE_METRES;
		}
		const range = viewDistanceMetres * RANGE_IN_VIEW_DISTANCES;
		return Math.min(MAXIMUM_RANGE_METRES, Math.max(MINIMUM_RANGE_METRES, range));
	}
}
