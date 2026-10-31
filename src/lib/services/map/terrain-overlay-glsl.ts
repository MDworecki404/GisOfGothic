/**
 * Kod GLSL nakładek rysowanych na modelu świata (poziomice i siatka). Funkcje dostają pozycję fragmentu
 * w układzie świata (x wschód, y północ, z wysokość, metry od kotwicy), którą shader liczy z `positionEC`
 * i uniformów `u_ecToEnu` oraz `u_cameraEnu` (patrz `OverlayCameraUniformsUpdater`).
 */
export const CONTOUR_INTERVAL_METRES = 5;
export const GRID_INTERVAL_METRES = 100;
export const MAJOR_LINE_EVERY_NTH_LINE = 5;
export const GRID_MINIMUM_LINE_SPACING_PIXELS = 14;
export const CONTOUR_MINIMUM_PLAN_SPACING_PIXELS = 5;

/**
 * Funkcja `computeLineMasks` zwraca krycie linii zwykłych (x) i głównych (y) dla jednej współrzędnej.
 * Odstęp linii rośnie pięciokrotnie, dopóki `interval` byłby mniejszy niż `minimumSpacingPixels` pikseli
 * poziomej skali widoku (`planMetresPerPixel`), więc przy oddaleniu kamery linie nie zlewają się w plamę,
 * a przy zbliżeniu wracają do gęstszych. Skala jest pozioma, nie zależy od nachylenia terenu, dzięki czemu
 * poziomice nie znikają na stromych zboczach. Grubość linii liczona jest w pikselach ekranu (`fwidth`),
 * a linie, które na ekranie leżałyby bliżej siebie niż ich grubość (pionowe ściany), zanikają.
 * Powierzchnia o stałej współrzędnej (np. morze) nie dostaje linii, bo nie ma na niej gradientu.
 */
export const OVERLAY_LINE_FUNCTION_GLSL = `
	vec2 computeLineMasks(
		float coordinate,
		float baseInterval,
		float lineWidthPixels,
		float planMetresPerPixel,
		float minimumSpacingPixels
	) {
		float metresPerPixel = fwidth(coordinate);
		if (metresPerPixel < 0.00001 || planMetresPerPixel < 0.00001) return vec2(0.0);
		float interval = baseInterval;
		for (int level = 0; level < 6; level++) {
			if (interval / planMetresPerPixel >= minimumSpacingPixels) break;
			interval *= ${MAJOR_LINE_EVERY_NTH_LINE.toFixed(1)};
		}
		float majorInterval = interval * ${MAJOR_LINE_EVERY_NTH_LINE.toFixed(1)};
		float minorDistancePixels = abs(fract(coordinate / interval - 0.5) - 0.5) * interval / metresPerPixel;
		float majorDistancePixels = abs(fract(coordinate / majorInterval - 0.5) - 0.5) * majorInterval / metresPerPixel;
		float minorMask = 1.0 - smoothstep(lineWidthPixels * 0.5 - 0.5, lineWidthPixels * 0.5 + 0.5, minorDistancePixels);
		float majorMask = 1.0 - smoothstep(lineWidthPixels * 0.9 - 0.5, lineWidthPixels * 0.9 + 0.5, majorDistancePixels);
		float minorFade = smoothstep(lineWidthPixels * 1.5, lineWidthPixels * 3.0, interval / metresPerPixel);
		float majorFade = smoothstep(lineWidthPixels * 1.5, lineWidthPixels * 3.0, majorInterval / metresPerPixel);
		return vec2(minorMask * minorFade, majorMask * majorFade);
	}
`;

export const OVERLAY_COMPOSITION_GLSL = `
	vec3 applyOverlays(vec3 baseColor, vec3 worldPosition) {
		vec3 colorWithOverlays = baseColor;
		float planMetresPerPixel = max(fwidth(worldPosition.x), fwidth(worldPosition.y));
		if (u_gridEnabled > 0.5) {
			vec2 eastLines = computeLineMasks(worldPosition.x, ${GRID_INTERVAL_METRES.toFixed(1)}, 1.6, planMetresPerPixel, ${GRID_MINIMUM_LINE_SPACING_PIXELS.toFixed(1)});
			vec2 northLines = computeLineMasks(worldPosition.y, ${GRID_INTERVAL_METRES.toFixed(1)}, 1.6, planMetresPerPixel, ${GRID_MINIMUM_LINE_SPACING_PIXELS.toFixed(1)});
			float gridStrength = max(max(eastLines.x, northLines.x) * 0.4, max(eastLines.y, northLines.y) * 0.8);
			colorWithOverlays = mix(colorWithOverlays, vec3(0.42, 0.76, 0.91), gridStrength);
		}
		if (u_contoursEnabled > 0.5) {
			vec2 heightLines = computeLineMasks(worldPosition.z, ${CONTOUR_INTERVAL_METRES.toFixed(1)}, 1.9, planMetresPerPixel, ${CONTOUR_MINIMUM_PLAN_SPACING_PIXELS.toFixed(1)});
			float contourStrength = max(heightLines.x * 0.6, heightLines.y * 0.95);
			colorWithOverlays = mix(colorWithOverlays, vec3(1.0, 0.78, 0.36), contourStrength);
		}
		return colorWithOverlays;
	}
`;
