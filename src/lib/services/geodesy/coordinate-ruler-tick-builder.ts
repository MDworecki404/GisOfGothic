import type { ViewExtent } from './view-extent.js';

export interface RulerTick {
	offsetPixels: number;
	label: string;
}

export interface CoordinateRulers {
	horizontal: RulerTick[];
	vertical: RulerTick[];
}

const NICE_STEPS = [1, 2, 5] as const;
const kilometres = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 3 });

/** Buduje znaczniki linijek współrzędnych (Wschód u góry, Północ z lewej) dla widoku 2D. */
export class CoordinateRulerTickBuilder {
	constructor(private readonly minimumSpacingPixels = 90) {}

	build(extent: ViewExtent): CoordinateRulers | null {
		if (!(extent.metresPerPixel > 0) || !Number.isFinite(extent.metresPerPixel)) return null;
		const halfWidthMetres = (extent.widthPixels / 2) * extent.metresPerPixel;
		const halfHeightMetres = (extent.heightPixels / 2) * extent.metresPerPixel;
		return {
			horizontal: this.buildAxisTicks(
				extent.centreEastMetres - halfWidthMetres,
				extent.metresPerPixel,
				extent.widthPixels,
				1
			),
			vertical: this.buildAxisTicks(
				extent.centreNorthMetres + halfHeightMetres,
				extent.metresPerPixel,
				extent.heightPixels,
				-1
			)
		};
	}

	/** `direction` 1: wartości rosną wraz z pikselami (Wschód); -1: maleją (Północ, bo ekran liczy w dół). */
	private buildAxisTicks(
		startMetres: number,
		metresPerPixel: number,
		lengthPixels: number,
		direction: 1 | -1
	): RulerTick[] {
		const stepMetres = this.pickStepMetres(metresPerPixel * this.minimumSpacingPixels);
		const endMetres = startMetres + direction * metresPerPixel * lengthPixels;
		const lowestMetres = Math.min(startMetres, endMetres);
		const highestMetres = Math.max(startMetres, endMetres);
		const ticks: RulerTick[] = [];
		for (
			let valueMetres = Math.ceil(lowestMetres / stepMetres) * stepMetres;
			valueMetres <= highestMetres;
			valueMetres += stepMetres
		) {
			ticks.push({
				offsetPixels: ((valueMetres - startMetres) * direction) / metresPerPixel + 0,
				label: this.formatLabel(valueMetres)
			});
		}
		return ticks;
	}

	private pickStepMetres(minimumStepMetres: number): number {
		const magnitude = 10 ** Math.floor(Math.log10(minimumStepMetres));
		const candidates = [...NICE_STEPS.map((step) => step * magnitude), 10 * magnitude];
		return candidates.find((candidate) => candidate >= minimumStepMetres) ?? 10 * magnitude;
	}

	private formatLabel(valueMetres: number): string {
		const rounded = Math.round(valueMetres * 1000) / 1000;
		if (Math.abs(rounded) >= 1000) return `${kilometres.format(rounded / 1000)} km`;
		return `${rounded.toLocaleString('pl-PL')} m`;
	}
}
