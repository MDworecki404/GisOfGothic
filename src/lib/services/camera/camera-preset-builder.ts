export type CameraPreset = 'top' | 'oblique';

export interface CameraPresetOrientation {
	headingRadians: number;
	pitchRadians: number;
}

const NORTH_HEADING_RADIANS = 0;
const NEARLY_VERTICAL_PITCH_RADIANS = (-89.99 * Math.PI) / 180;
const OBLIQUE_PITCH_RADIANS = (-50 * Math.PI) / 180;

/**
 * Składa kierunek i nachylenie gotowych widoków. Widok z góry nie jest dokładnie pionowy,
 * bo spojrzenie prosto w dół jest osobliwością dla `lookAt` w Cesium.
 */
export class CameraPresetBuilder {
	build(preset: CameraPreset, currentHeadingRadians: number): CameraPresetOrientation {
		if (preset === 'top') {
			return { headingRadians: NORTH_HEADING_RADIANS, pitchRadians: NEARLY_VERTICAL_PITCH_RADIANS };
		}
		return { headingRadians: currentHeadingRadians, pitchRadians: OBLIQUE_PITCH_RADIANS };
	}
}
