import { Cartesian3, Ellipsoid, type Camera } from 'cesium';

const NEARLY_VERTICAL_LENGTH = 1e-3;

export interface CameraHorizontalBasis {
	up: Cartesian3;
	forward: Cartesian3;
	right: Cartesian3;
}

/** Wyznacza poziome kierunki „przód” i „prawo” kamery oraz pion powierzchni pod nią. */
export class CameraHorizontalBasisReader {
	read(camera: Camera): CameraHorizontalBasis {
		const up = Ellipsoid.WGS84.geodeticSurfaceNormal(camera.positionWC, new Cartesian3());
		const forward = this.findHorizontalForward(camera, up);
		const right = Cartesian3.normalize(
			Cartesian3.cross(forward, up, new Cartesian3()),
			new Cartesian3()
		);
		return { up, forward, right };
	}

	/** Kierunek patrzenia rzutowany na poziom; przy spojrzeniu prosto w dół używa góry ekranu. */
	private findHorizontalForward(camera: Camera, up: Cartesian3): Cartesian3 {
		const projected = this.projectOntoHorizontalPlane(camera.directionWC, up);
		if (Cartesian3.magnitude(projected) > NEARLY_VERTICAL_LENGTH) {
			return Cartesian3.normalize(projected, projected);
		}
		const fromScreenTop = this.projectOntoHorizontalPlane(camera.upWC, up);
		return Cartesian3.normalize(fromScreenTop, fromScreenTop);
	}

	private projectOntoHorizontalPlane(vector: Cartesian3, up: Cartesian3): Cartesian3 {
		const verticalPart = Cartesian3.multiplyByScalar(
			up,
			Cartesian3.dot(vector, up),
			new Cartesian3()
		);
		return Cartesian3.subtract(vector, verticalPart, new Cartesian3());
	}
}
