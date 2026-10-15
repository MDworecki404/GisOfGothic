import { spawn } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const CONTENT_TYPES = new Map([
	['.glb', 'model/gltf-binary'],
	['.png', 'image/png'],
	['.json', 'application/json']
]);
const CACHE_CONTROL = 'public,max-age=31536000,immutable';
const PARALLEL_UPLOADS = 6;
const RETRIES = 2;

/**
 * Wgrywa folder z modelami do bucketa R2 przez `wrangler` (trzeba wcześniej zrobić
 * `npx wrangler login`). Zachowuje układ podfolderów, więc `textures/` leży obok plików `.glb`.
 * Użycie: node scripts/upload-models-to-r2.mjs <folder> <bucket> <prefiks-w-bucketcie> [--dry-run]
 */
class ModelsUploader {
	constructor(folder, bucket, keyPrefix, isDryRun) {
		this.folder = folder;
		this.bucket = bucket;
		this.keyPrefix = keyPrefix.replace(/^\/+|\/+$/g, '');
		this.isDryRun = isDryRun;
		this.uploadedCount = 0;
		this.failedFiles = [];
	}

	async uploadAll() {
		const files = await this.listFilesRecursively(this.folder);
		console.log(`Plików do wgrania: ${files.length} → ${this.bucket}/${this.keyPrefix}/`);
		const queue = [...files];
		const workers = Array.from({ length: PARALLEL_UPLOADS }, () =>
			this.consumeQueue(queue, files.length)
		);
		await Promise.all(workers);
		console.log(`Gotowe. Wgrano: ${this.uploadedCount}, błędy: ${this.failedFiles.length}`);
		for (const file of this.failedFiles) console.error(`  nie wgrano: ${file}`);
		process.exitCode = this.failedFiles.length > 0 ? 1 : 0;
	}

	async consumeQueue(queue, total) {
		for (let file = queue.shift(); file; file = queue.shift()) {
			const isUploaded = await this.uploadWithRetries(file);
			if (isUploaded) this.uploadedCount++;
			else this.failedFiles.push(file);
			const done = this.uploadedCount + this.failedFiles.length;
			if (done % 25 === 0 || done === total) console.log(`  ${done}/${total}`);
		}
	}

	async uploadWithRetries(file) {
		for (let attempt = 0; attempt <= RETRIES; attempt++) {
			if (await this.uploadOnce(file)) return true;
		}
		return false;
	}

	uploadOnce(file) {
		const relativePath = path.relative(this.folder, file).split(path.sep).join('/');
		const key = `${this.keyPrefix}/${relativePath}`;
		const contentType = CONTENT_TYPES.get(path.extname(file).toLowerCase());
		if (!contentType) {
			console.error(`Pomijam nieznany typ: ${file}`);
			return Promise.resolve(true);
		}
		if (this.isDryRun) {
			console.log(`  [próba] ${key} (${contentType})`);
			return Promise.resolve(true);
		}
		return new Promise((resolve) => {
			const child = spawn(
				'npx',
				[
					'--yes',
					'wrangler',
					'r2',
					'object',
					'put',
					`${this.bucket}/${key}`,
					'--file',
					file,
					'--content-type',
					contentType,
					'--cache-control',
					CACHE_CONTROL,
					'--remote'
				],
				{ shell: true, stdio: ['ignore', 'ignore', 'pipe'] }
			);
			let errorOutput = '';
			child.stderr.on('data', (chunk) => (errorOutput += chunk));
			child.on('close', (code) => {
				if (code !== 0) console.error(`Błąd ${key}: ${this.pickErrorLine(errorOutput)}`);
				resolve(code === 0);
			});
		});
	}

	pickErrorLine(errorOutput) {
		const lines = errorOutput
			.split('\n')
			.map((line) => line.trim())
			.filter(Boolean);
		return lines.find((line) => line.includes('ERROR')) ?? lines.at(-1) ?? 'brak komunikatu';
	}

	async listFilesRecursively(directory) {
		const files = [];
		for (const entry of await readdir(directory)) {
			const fullPath = path.join(directory, entry);
			if ((await stat(fullPath)).isDirectory())
				files.push(...(await this.listFilesRecursively(fullPath)));
			else files.push(fullPath);
		}
		return files;
	}
}

const [folder, bucket, keyPrefix] = process.argv
	.slice(2)
	.filter((argument) => !argument.startsWith('--'));
if (!folder || !bucket || !keyPrefix) {
	console.error(
		'Użycie: node scripts/upload-models-to-r2.mjs <folder> <bucket> <prefiks> [--dry-run]'
	);
	process.exit(2);
}
await new ModelsUploader(
	path.resolve(folder),
	bucket,
	keyPrefix,
	process.argv.includes('--dry-run')
).uploadAll();
