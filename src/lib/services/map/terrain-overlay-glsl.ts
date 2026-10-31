/**
 * Kod GLSL nakładek rysowanych na modelu świata (poziomice i siatka). Funkcje dostają pozycję fragmentu
 * w układzie świata (x wschód, y północ, z wysokość, metry od kotwicy), którą shader liczy z `positionEC`
 * i uniformów `u_ecToEnu` oraz `u_cameraEnu` (patrz `OverlayCameraUniformsUpdater`).
 */
export const CONTOUR_INTERVAL_METRES = 5;
export const GRID_INTERVAL_METRES = 100;
export const MAJOR_LINE_EVERY_NTH_LINE = 5;
export const MINIMUM_LINE_SPACING_PIXELS = 14;

/**
 * Funkcja `computeLineMasks` zwraca krycie linii zwykłych (x) i głównych (y) dla jednej współrzędnej.
 * Odstęp linii rośnie pięciokrotnie, dopóki sąsiednie linie byłyby bliżej niż
 * `MINIMUM_LINE_SPACING_PIXELS` na ekranie, więc przy oddaleniu kamery linie nie zlewają się w plamę,
 * a przy zbliżeniu wracają do gęstszych. Grubość linii liczona jest w pikselach ekranu (`fwidth`).
 * Płaszczyzna o stałej współrzędnej (np. morze) nie dostaje linii, bo nie ma na niej gradientu.
 */
export const OVERLAY_LINE_FUNCTION_GLSL = `
	vec2 computeLineMasks(float coordinate, float baseInterval, float lineWidthPixels) {
		float metresPerPixel = fwidth(coordinate);
		if (metresPerPixel < 0.00001) return vec2(0.0);
		float interval = baseInterval;
		for (int level = 0; level < 6; level++) {
			if (interval / metresPerPixel >= ${MINIMUM_LINE_SPACING_PIXELS.toFixed(1)}) break;
			interval *= ${MAJOR_LINE_EVERY_NTH_LINE.toFixed(1)};
		}
		float majorInterval = interval * ${MAJOR_LINE_EVERY_NTH_LINE.toFixed(1)};
		float minorDistancePixels = abs(fract(coordinate / interval - 0.5) - 0.5) * interval / metresPerPixel;
		float majorDistancePixels = abs(fract(coordinate / majorInterval - 0.5) - 0.5) * majorInterval / metresPerPixel;
		float minorMask = 1.0 - smoothstep(lineWidthPixels * 0.5 - 0.5, lineWidthPixels * 0.5 + 0.5, minorDistancePixels);
		float majorMask = 1.0 - smoothstep(lineWidthPixels * 0.9 - 0.5, lineWidthPixels * 0.9 + 0.5, majorDistancePixels);
		return vec2(minorMask, majorMask);
	}
`;

export const OVERLAY_COMPOSITION_GLSL = `
	vec3 applyOverlays(vec3 baseColor, vec3 worldPosition) {
		vec3 colorWithOverlays = baseColor;
		if (u_gridEnabled > 0.5) {
			vec2 eastLines = computeLineMasks(worldPosition.x, ${GRID_INTERVAL_METRES.toFixed(1)}, 1.6);
			vec2 northLines = computeLineMasks(worldPosition.y, ${GRID_INTERVAL_METRES.toFixed(1)}, 1.6);
			float gridStrength = max(max(eastLines.x, northLines.x) * 0.4, max(eastLines.y, northLines.y) * 0.8);
			colorWithOverlays = mix(colorWithOverlays, vec3(0.42, 0.76, 0.91), gridStrength);
		}
		if (u_contoursEnabled > 0.5) {
			vec2 heightLines = computeLineMasks(worldPosition.z, ${CONTOUR_INTERVAL_METRES.toFixed(1)}, 1.8);
			float contourStrength = max(heightLines.x * 0.55, heightLines.y * 0.95);
			colorWithOverlays = mix(colorWithOverlays, vec3(0.09, 0.05, 0.02), contourStrength);
		}
		return colorWithOverlays;
	}
`;
