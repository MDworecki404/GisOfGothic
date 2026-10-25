import { isRecord } from '#lib/data/parsers.js';

export type CameraProjectionSetting =
	{ kind: 'perspective'; fovDegrees: number } | { kind: 'orthographic' };

export const MINIMUM_FIELD_OF_VIEW_DEGREES = 30;
export const MAXIMUM_FIELD_OF_VIEW_DEGREES = 100;
export const DEFAULT_FIELD_OF_VIEW_DEGREES = 60;

export const DEFAULT_CAMERA_PROJECTION: CameraProjectionSetting = {
	kind: 'perspective',
	fovDegrees: DEFAULT_FIELD_OF_VIEW_DEGREES
};

export function clampFieldOfViewDegrees(degrees: number): number {
	const clamped = Math.min(
		Math.max(degrees, MINIMUM_FIELD_OF_VIEW_DEGREES),
		MAXIMUM_FIELD_OF_VIEW_DEGREES
	);
	return Math.round(clamped);
}

export function isFieldOfViewInRange(degrees: number): boolean {
	return (
		Number.isFinite(degrees) &&
		degrees >= MINIMUM_FIELD_OF_VIEW_DEGREES &&
		degrees <= MAXIMUM_FIELD_OF_VIEW_DEGREES
	);
}

export function isDefaultCameraProjection(setting: CameraProjectionSetting): boolean {
	return setting.kind === 'perspective' && setting.fovDegrees === DEFAULT_FIELD_OF_VIEW_DEGREES;
}

export function isCameraProjectionSetting(value: unknown): value is CameraProjectionSetting {
	if (!isRecord(value)) return false;
	if (value.kind === 'orthographic') return true;
	return (
		value.kind === 'perspective' &&
		typeof value.fovDegrees === 'number' &&
		isFieldOfViewInRange(value.fovDegrees)
	);
}
