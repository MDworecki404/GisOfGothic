/** Położenie i kierunek kamery w ramie świata: metry od kotwicy (E, N, H) oraz kąty w stopniach. */
export interface CameraView {
	east: number;
	north: number;
	height: number;
	headingDegrees: number;
	pitchDegrees: number;
}

const FIELD_SEPARATOR = '_';
const FIELD_COUNT = 5;
const MAXIMUM_ABSOLUTE_COORDINATE_METRES = 1_000_000;

function roundToTenth(value: number): number {
	return Math.round(value * 10) / 10;
}

function parseFiniteNumber(text: string): number | null {
	if (text.trim() === '') return null;
	const value = Number(text);
	return Number.isFinite(value) ? value : null;
}

/**
 * Zamienia widok kamery na krótki tekst do adresu URL (`E_N_H_kierunek_nachylenie`, np.
 * `581.8_200.9_350_45_-50`) i z powrotem. Separator `_` nie wymaga kodowania w adresie.
 * Odczyt odrzuca każdy tekst, który nie jest pięcioma sensownymi liczbami.
 */
export class CameraViewCodec {
	serialize(view: CameraView): string {
		return [
			view.east,
			view.north,
			view.height,
			((view.headingDegrees % 360) + 360) % 360,
			view.pitchDegrees
		]
			.map(roundToTenth)
			.join(FIELD_SEPARATOR);
	}

	parse(text: string): CameraView | null {
		const fields = text.split(FIELD_SEPARATOR).map(parseFiniteNumber);
		if (fields.length !== FIELD_COUNT) return null;
		const [east, north, height, headingDegrees, pitchDegrees] = fields;
		if (
			east === null ||
			north === null ||
			height === null ||
			headingDegrees === null ||
			pitchDegrees === null
		) {
			return null;
		}
		const isInsideWorld = [east, north, height].every(
			(coordinate) => Math.abs(coordinate) <= MAXIMUM_ABSOLUTE_COORDINATE_METRES
		);
		const hasValidAngles =
			headingDegrees >= 0 && headingDegrees <= 360 && Math.abs(pitchDegrees) <= 90;
		if (!isInsideWorld || !hasValidAngles) return null;
		return { east, north, height, headingDegrees, pitchDegrees };
	}
}
