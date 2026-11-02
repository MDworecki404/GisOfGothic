import { Cartesian3 } from 'cesium';

const PARALLEL_TOLERANCE = 1e-9;

/**
 * Parametr punktu prostej (`linePoint + parametr * lineDirection`) najbliższego promieniowi z kamery. Dzięki temu ruch
 * myszy da się zamienić na przesunięcie wzdłuż osi gizma: promień rzadko przecina oś, więc bierzemy punkty największego
 * zbliżenia obu prostych. `null`, gdy promień jest (prawie) równoległy do osi i parametr nie jest wyznaczony.
 */
export function findClosestParameterOnLine(
	rayOrigin: Cartesian3,
	rayDirection: Cartesian3,
	linePoint: Cartesian3,
	lineDirection: Cartesian3
): number | null {
	const offset = Cartesian3.subtract(linePoint, rayOrigin, new Cartesian3());
	const lineAlongRay = Cartesian3.dot(lineDirection, rayDirection);
	const lineAlongOffset = Cartesian3.dot(lineDirection, offset);
	const rayAlongOffset = Cartesian3.dot(rayDirection, offset);
	const lineLength = Cartesian3.dot(lineDirection, lineDirection);
	const rayLength = Cartesian3.dot(rayDirection, rayDirection);
	const denominator = lineLength * rayLength - lineAlongRay * lineAlongRay;
	if (Math.abs(denominator) < PARALLEL_TOLERANCE * lineLength * rayLength) return null;
	return (lineAlongRay * rayAlongOffset - rayLength * lineAlongOffset) / denominator;
}

/** Kąt kierunku (wschód, północ) liczony od północy zgodnie z ruchem wskazówek zegara, w stopniach. */
export function measureClockwiseAngleDegrees(east: number, north: number): number {
	return (Math.atan2(east, north) * 180) / Math.PI;
}

/** Sprowadza kąt do przedziału (−180°, 180°], czyli do najkrótszego obrotu. */
export function wrapToShortestTurnDegrees(degrees: number): number {
	const wrapped = ((((degrees + 180) % 360) + 360) % 360) - 180;
	return wrapped === -180 ? 180 : wrapped;
}
