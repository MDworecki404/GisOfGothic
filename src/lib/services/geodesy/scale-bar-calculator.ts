export interface ScaleBar {
	widthPixels: number;
	label: string;
}

const NICE_STEPS = [1, 2, 5] as const;

export class ScaleBarCalculator {
	constructor(private readonly maximumWidthPixels = 120) {}

	/** Dobiera „okrągłą” długość odcinka (1, 2, 5 × 10ⁿ m), która mieści się w maksymalnej szerokości. */
	calculate(metresPerPixel: number): ScaleBar | null {
		if (!(metresPerPixel > 0) || !Number.isFinite(metresPerPixel)) return null;
		const maximumMetres = metresPerPixel * this.maximumWidthPixels;
		const magnitude = 10 ** Math.floor(Math.log10(maximumMetres));
		const lengthMetres = NICE_STEPS.map((step) => step * magnitude)
			.filter((length) => length <= maximumMetres)
			.reduce((longest, length) => Math.max(longest, length), magnitude);
		return {
			widthPixels: Math.round(lengthMetres / metresPerPixel),
			label: this.formatLength(lengthMetres)
		};
	}

	private formatLength(lengthMetres: number): string {
		if (lengthMetres >= 1000) return `${lengthMetres / 1000} km`;
		if (lengthMetres >= 1) return `${lengthMetres} m`;
		return `${Math.round(lengthMetres * 100)} cm`;
	}
}
