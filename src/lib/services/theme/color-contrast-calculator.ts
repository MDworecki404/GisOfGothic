const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;
const CHANNEL_MAXIMUM = 255;

function linearizeChannel(channel: number): number {
	const unit = channel / CHANNEL_MAXIMUM;
	return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
}

/** Liczy kontrast dwóch kolorów wzorem WCAG 2.x (od 1 do 21). */
export class ColorContrastCalculator {
	calculateContrastRatio(firstHex: string, secondHex: string): number {
		const firstLuminance = this.calculateRelativeLuminance(firstHex);
		const secondLuminance = this.calculateRelativeLuminance(secondHex);
		const lighter = Math.max(firstLuminance, secondLuminance);
		const darker = Math.min(firstLuminance, secondLuminance);
		return (lighter + 0.05) / (darker + 0.05);
	}

	private calculateRelativeLuminance(hex: string): number {
		const match = HEX_COLOR_PATTERN.exec(hex);
		if (!match) throw new Error(`Kolor musi mieć zapis #rrggbb, jest: ${hex}`);
		const [red, green, blue] = [match[1], match[2], match[3]].map((part) =>
			linearizeChannel(parseInt(part, 16))
		);
		return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
	}
}
