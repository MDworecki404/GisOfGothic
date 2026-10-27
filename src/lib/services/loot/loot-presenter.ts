import type { LootSource, TreasureSetCatalog, TreasureSetKind } from '#lib/data/types.js';

const MAXIMUM_LISTED_POSSIBLE_ITEMS = 40;

const LOOT_KIND_LABELS: Readonly<Record<TreasureSetKind, string>> = {
	chest: 'losowa zawartość skrzyń',
	npc: 'ekwipunek postaci',
	monster: 'trofea potworów',
	trader: 'towar handlarzy',
	mining: 'wydobycie'
};

function pluralizeSets(count: number): string {
	if (count === 1) return 'zestaw';
	const lastDigit = count % 10;
	const lastTwoDigits = count % 100;
	const isFewForm = lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14);
	return isFewForm ? 'zestawy' : 'zestawów';
}

/** Zamienia zestawy losowego łupu (Gothic 3) na krótkie teksty do kart skrzyń, postaci i przedmiotów. */
export class LootPresenter {
	/** Przedmioty, które mogą wypaść z podanych zestawów, bez powtórzeń; nadmiar zastępuje podsumowanie. */
	describePossibleContents(setCodes: readonly string[], catalog: TreasureSetCatalog): string[] {
		const largestAmountByCode = new Map<string, { name: string; amount: number }>();
		for (const setCode of setCodes) {
			for (const item of catalog.get(setCode)?.items ?? []) {
				const known = largestAmountByCode.get(item.code);
				if (!known || item.amount > known.amount) {
					largestAmountByCode.set(item.code, { name: item.name, amount: item.amount });
				}
			}
		}
		const lines = [...largestAmountByCode.values()].map(({ name, amount }) =>
			amount > 1 ? `${name} ×${amount}` : name
		);
		if (lines.length <= MAXIMUM_LISTED_POSSIBLE_ITEMS) return lines;
		const hiddenCount = lines.length - MAXIMUM_LISTED_POSSIBLE_ITEMS;
		return [...lines.slice(0, MAXIMUM_LISTED_POSSIBLE_ITEMS), `…i ${hiddenCount} innych`];
	}

	/** Skąd przedmiot może wypaść: jedna linia na rodzaj zestawu, z liczbą zestawów. */
	describeLootSources(sources: readonly LootSource[]): string[] {
		const setCountByKind = new Map<TreasureSetKind, number>();
		for (const source of sources) {
			setCountByKind.set(source.kind, (setCountByKind.get(source.kind) ?? 0) + 1);
		}
		return [...setCountByKind.entries()].map(
			([kind, count]) => `${LOOT_KIND_LABELS[kind]} (${count} ${pluralizeSets(count)})`
		);
	}
}
