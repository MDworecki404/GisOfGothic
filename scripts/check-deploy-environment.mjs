/**
 * Sprawdza przed wdrożeniem (podgląd i produkcja), czy `.env` ma wartości, które trafiają do strony.
 * Bez `PUBLIC_MODEL_KEY` build przechodzi, ale żaden podgląd modelu przedmiotu się nie wyświetli,
 * bo modele w R2 są nim zaszyfrowane (ADR 0012).
 */
import { readFile } from 'node:fs/promises';

const REQUIRED_VARIABLES = [
	{
		name: 'PUBLIC_MODEL_KEY',
		pattern: /^[A-Za-z0-9+/]{43}=$/,
		hint: 'klucz, którym zaszyfrowano modele w R2 (docs/rozwoj.md, „Modele przedmiotów”)'
	}
];

const env = await readFile('.env', 'utf8').catch(() => '');
const problems = REQUIRED_VARIABLES.flatMap((variable) => {
	const match = env.match(new RegExp(`^${variable.name}=(.*)$`, 'm'));
	const value = match ? match[1].trim() : '';
	return variable.pattern.test(value) ? [] : [`${variable.name} — ${variable.hint}`];
});

if (problems.length > 0) {
	console.error('✖ Wdrożenie przerwane: w .env brakuje albo jest błędne:');
	for (const problem of problems) console.error(`  - ${problem}`);
	process.exit(1);
}
