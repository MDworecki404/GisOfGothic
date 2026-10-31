import { Cartesian3, Matrix3, Matrix4, type CustomShader, type Scene } from 'cesium';
import type { WorldFrame } from '#lib/services/geodesy/world-frame.js';

/**
 * Co klatkę podaje shaderowi nakładek, jak przejść ze współrzędnych oka (`positionEC`) do układu świata
 * (wschód, północ, góra w metrach od kotwicy): obrót oko → świat (`u_ecToEnu`) i pozycję kamery w tym
 * układzie (`u_cameraEnu`). Obie wartości liczone są podwójną precyzją na CPU, a w shaderze dodają się do
 * małych współrzędnych oka, więc linie nie drżą (pozycja ECEF w float32 miałaby błąd rzędu pół metra).
 * Nie polegamy na osiach modelu, które w kaflach z ion bywają różne.
 */
export class OverlayCameraUniformsUpdater {
	private readonly ecefToWorld: Matrix4;
	private readonly ecefToWorldRotation: Matrix3;
	private readonly eyeToEcefRotation = new Matrix3();
	private readonly eyeToWorldRotation = new Matrix3();
	private readonly cameraInWorld = new Cartesian3();
	private removeListener: (() => void) | null = null;

	constructor(
		private readonly scene: Scene,
		frame: WorldFrame
	) {
		this.ecefToWorld = frame.ecefToAnchor;
		this.ecefToWorldRotation = Matrix4.getMatrix3(frame.ecefToAnchor, new Matrix3());
	}

	attachTo(shader: CustomShader): void {
		this.detach();
		this.removeListener = this.scene.preRender.addEventListener(() =>
			this.updateUniformsOf(shader)
		);
	}

	detach(): void {
		this.removeListener?.();
		this.removeListener = null;
	}

	private updateUniformsOf(shader: CustomShader): void {
		const camera = this.scene.camera;
		Matrix4.getMatrix3(camera.inverseViewMatrix, this.eyeToEcefRotation);
		Matrix3.multiply(this.ecefToWorldRotation, this.eyeToEcefRotation, this.eyeToWorldRotation);
		Matrix4.multiplyByPoint(this.ecefToWorld, camera.positionWC, this.cameraInWorld);
		shader.setUniform('u_ecToEnu', this.eyeToWorldRotation);
		shader.setUniform('u_cameraEnu', this.cameraInWorld);
	}
}
