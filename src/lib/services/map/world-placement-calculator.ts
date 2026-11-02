import { Cartesian3, Matrix3, Matrix4, Math as CesiumMath } from 'cesium';

/** Przesunięcie świata względem jego pozycji w układzie gry (metry) i obrót wokół środka obrysu (stopnie zgodnie z ruchem wskazówek zegara). */
export interface SizeWorldPlacement {
	east: number;
	north: number;
	up: number;
	headingDegrees: number;
}

export interface PlacementPivot {
	centerEast: number;
	centerNorth: number;
}

export const NATIVE_PLACEMENT: SizeWorldPlacement = { east: 0, north: 0, up: 0, headingDegrees: 0 };

/**
 * Składa macierz modelu świata: najpierw obrót wokół środka obrysu, potem przesunięcie, wszystko w ramie
 * (Wschód, Północ, Góra) kotwicy świata. Dzięki obrotowi wokół środka świat „kręci się w miejscu”,
 * a nie krąży wokół początku układu gry.
 */
export class WorldPlacementCalculator {
	buildModelMatrix(
		anchorToEcef: Matrix4,
		pivot: PlacementPivot,
		placement: SizeWorldPlacement
	): Matrix4 {
		const toPivot = Matrix4.fromTranslation(new Cartesian3(pivot.centerEast, pivot.centerNorth, 0));
		const fromPivot = Matrix4.fromTranslation(
			new Cartesian3(-pivot.centerEast, -pivot.centerNorth, 0)
		);
		const rotation = Matrix4.fromRotation(
			Matrix3.fromRotationZ(-CesiumMath.toRadians(placement.headingDegrees))
		);
		const move = Matrix4.fromTranslation(
			new Cartesian3(placement.east, placement.north, placement.up)
		);
		const local = [move, toPivot, rotation, fromPivot].reduce((product, next) =>
			Matrix4.multiply(product, next, new Matrix4())
		);
		return Matrix4.multiply(anchorToEcef, local, new Matrix4());
	}
}
