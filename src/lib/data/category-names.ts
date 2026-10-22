const UNCATEGORISED = 'Bez kategorii';
const NO_GUILD_CODE = 'NONE';
const NO_GUILD_NAME = 'Bez gildii';

/**
 * Nazwy gildii bieżącego świata z `metadata.json` (`guild_names`, tabela TXT_GUILDS z gry). Ustawia je
 * fasada po wczytaniu metadanych, zanim zbuduje indeks wyszukiwania.
 */
export class GuildNameBook {
	private names: ReadonlyMap<string, string> = new Map();

	useGuildNames(guildNames: Readonly<Record<string, string>> | undefined): void {
		this.names = new Map(Object.entries(guildNames ?? {}));
	}

	findName(guildCode: string): string | undefined {
		return this.names.get(guildCode);
	}
}

export const guildNameBook = new GuildNameBook();

/**
 * Kategorie przedmiotów są już po polsku; postacie mają kod gildii, który zamieniamy na nazwę z danych świata.
 * Kod `NONE` (brak przynależności) ma w grze skrócony tekst techniczny, więc pokazujemy własny.
 */
export function describeCategory(category: string | null): string {
	if (category === null) return UNCATEGORISED;
	if (category === NO_GUILD_CODE) return NO_GUILD_NAME;
	return guildNameBook.findName(category) ?? category;
}
