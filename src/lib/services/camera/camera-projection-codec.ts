import {
	isDefaultCameraProjection,
	isFieldOfViewInRange,
	type CameraProjectionSetting
} from './camera-projection.js';

const ORTHOGRAPHIC_TEXT = 'o';
const PERSPECTIVE_PREFIX = 'p_';

/**
 * Zamienia rzut kamery na krótki tekst do adresu (`o` albo `p_<fov>`) i z powrotem. Ustawienie domyślne
 * (perspektywa 60°) nie ma zapisu, żeby adres był krótki. Odczyt odrzuca FOV spoza zakresu zamiast go przycinać.
 */
export class CameraProjectionCodec {
	serialize(setting: CameraProjectionSetting): string | null {
		if (setting.kind === 'orthographic') return ORTHOGRAPHIC_TEXT;
		if (isDefaultCameraProjection(setting)) return null;
		return `${PERSPECTIVE_PREFIX}${setting.fovDegrees}`;
	}

	parse(text: string): CameraProjectionSetting | null {
		if (text === ORTHOGRAPHIC_TEXT) return { kind: 'orthographic' };
		if (!text.startsWith(PERSPECTIVE_PREFIX)) return null;
		const fieldOfViewText = text.slice(PERSPECTIVE_PREFIX.length);
		if (fieldOfViewText.trim() === '') return null;
		const fovDegrees = Number(fieldOfViewText);
		return isFieldOfViewInRange(fovDegrees) ? { kind: 'perspective', fovDegrees } : null;
	}
}
