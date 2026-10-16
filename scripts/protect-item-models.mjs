/**
 * Przygotowuje chronione podglądy przedmiotów do wgrania na R2: wbudowuje tekstury w GLB,
 * dokleja wymiary ze spisu i szyfruje plik (format `ProtectedModelCodec`). Nazwa wyniku to HMAC
 * ścieżki modelu, więc publicznie nie ma żadnego spisu ani czytelnych nazw.
 * Klucz: `PUBLIC_MODEL_KEY` w `.env` — jeśli go brak, skrypt go tworzy i dopisuje do `.env`.
 *
 * Użycie: node scripts/protect-item-models.mjs <folder-previews> <folder-wynikowy> <przestrzeń>
 * np.:    node scripts/protect-item-models.mjs "C:/…/dist/g2nk/khorinis/models/previews" build-models g2nk/khorinis
 */
import { appendFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ProtectedModelCodec } from '../src/lib/services/models/protected-model-format.ts';

const ENV_FILE = '.env';
const KEY_VARIABLE = 'PUBLIC_MODEL_KEY';

async function readOrCreateKey() {
	const env = await readFile(ENV_FILE, 'utf8').catch(() => '');
	const match = env.match(new RegExp(`^${KEY_VARIABLE}=(.+)$`, 'm'));
	if (match) return match[1].trim();
	const key = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64');
	await appendFile(
		ENV_FILE,
		`${env.endsWith('\n') || env === '' ? '' : '\n'}${KEY_VARIABLE}=${key}\n`
	);
	console.log(`Utworzono nowy klucz ${KEY_VARIABLE} w ${ENV_FILE}.`);
	return key;
}

async function readBoundsByFile(previewsFolder) {
	const index = JSON.parse(await readFile(path.join(previewsFolder, 'index.json'), 'utf8'));
	return new Map(index.previews.map((preview) => [preview.file, preview.bounds_m]));
}

const [previewsFolder, outputFolder, namespace] = process.argv.slice(2);
if (!previewsFolder || !outputFolder || !namespace) {
	console.error(
		'Użycie: node scripts/protect-item-models.mjs <folder-previews> <folder-wynikowy> <przestrzeń>'
	);
	process.exit(1);
}

const codec = new ProtectedModelCodec(await readOrCreateKey());
const boundsByFile = await readBoundsByFile(previewsFolder);
const io = new NodeIO();
await mkdir(outputFolder, { recursive: true });

const files = (await readdir(previewsFolder)).filter((file) => file.endsWith('.glb'));
let protectedCount = 0;
for (const file of files) {
	const bounds = boundsByFile.get(file);
	if (!bounds) {
		console.error(`Pomijam ${file}: brak wymiarów w index.json`);
		continue;
	}
	const document = await io.read(path.join(previewsFolder, file));
	const glb = await io.writeBinary(document);
	const encrypted = await codec.encrypt({ bounds, glb: new Uint8Array(glb) });
	const fileId = await codec.createFileId(`${namespace}/previews/${file}`);
	await writeFile(path.join(outputFolder, `${fileId}.bin`), encrypted);
	protectedCount++;
}
console.log(`Gotowe: ${protectedCount} chronionych modeli w ${outputFolder}`);
