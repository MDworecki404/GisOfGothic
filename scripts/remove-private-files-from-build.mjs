/**
 * Usuwa z katalogu `build/` pliki z `static/data/`, których aplikacja nie używa, a które nie
 * powinny być publiczne (opis kontraktu danych z paczki ekstrakcji). Uruchamiane przez `npm run deploy`.
 */
import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const BUILD_DATA_FOLDER = 'build/data';
const PRIVATE_FILE_NAMES = new Set(['README.md']);

async function removePrivateFiles(folder) {
	const entries = await readdir(folder, { withFileTypes: true }).catch(() => []);
	for (const entry of entries) {
		const entryPath = path.join(folder, entry.name);
		if (entry.isDirectory()) await removePrivateFiles(entryPath);
		else if (PRIVATE_FILE_NAMES.has(entry.name)) {
			await rm(entryPath);
			console.log(`Usunięto z wdrożenia: ${entryPath}`);
		}
	}
}

await removePrivateFiles(BUILD_DATA_FOLDER);
