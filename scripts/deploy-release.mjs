/**
 * Wdrożenie produkcyjne — wyłącznie z wydania. Odmawia, jeśli:
 * - w katalogu roboczym są niezacommitowane zmiany,
 * - bieżący commit nie jest oznaczony tagiem wydania `vX.Y.Z` (z `npm run release`),
 * - commit albo tag nie są wypchnięte na GitHuba (produkcja = to, co jest w repozytorium),
 * - w `.env` brakuje wartości trafiających do strony (`PUBLIC_MODEL_KEY`),
 * - którykolwiek z testów nie przejdzie (check, lint, Vitest, Playwright).
 * Dopiero potem buduje stronę, usuwa niepubliczne pliki danych i wysyła ją na Cloudflare Pages.
 *
 * Użycie: npm run deploy
 */
import { execFileSync, spawnSync } from 'node:child_process';

const RELEASE_TAG = /^v\d+\.\d+\.\d+$/;
const PRODUCTION_BRANCH = 'main';

class ReleaseDeployment {
	readGit(...args) {
		return execFileSync('git', args, { encoding: 'utf8' }).trim();
	}

	/** Na Windows `npm` i `npx` wymagają powłoki, która dzieli argumenty po spacjach — stąd cudzysłowy. */
	runStep(description, command, args) {
		console.log(`\n▶ ${description}`);
		const usesShell = process.platform === 'win32';
		const shellSafeArgs = usesShell ? args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)) : args;
		const result = spawnSync(command, shellSafeArgs, { stdio: 'inherit', shell: usesShell });
		if (result.status !== 0) this.refuse(`krok „${description}” się nie powiódł`);
	}

	refuse(reason) {
		console.error(`\n✖ Wdrożenie przerwane: ${reason}.`);
		process.exit(1);
	}

	findReleaseTag() {
		const tags = this.readGit('tag', '--points-at', 'HEAD')
			.split('\n')
			.filter((tag) => RELEASE_TAG.test(tag));
		if (tags.length === 0) {
			this.refuse('bieżący commit nie jest wydaniem — najpierw `npm run release` i push z tagami');
		}
		return tags[0];
	}

	ensureCleanWorkingTree() {
		if (this.readGit('status', '--porcelain') !== '') {
			this.refuse('są niezacommitowane zmiany — produkcja musi odpowiadać wydaniu z repozytorium');
		}
	}

	ensurePublished(tag, commit) {
		this.readGit('fetch', '--quiet', 'origin', PRODUCTION_BRANCH, '--tags');
		const remoteCommit = this.readGit('rev-parse', `origin/${PRODUCTION_BRANCH}`);
		const remoteTagCommit = this.readGit('rev-parse', `${tag}^{commit}`);
		if (remoteCommit !== commit) {
			this.refuse(
				`commit wydania nie jest ostatnim commitem origin/${PRODUCTION_BRANCH} — zrób push`
			);
		}
		const remoteTags = this.readGit('ls-remote', '--tags', 'origin', tag);
		if (remoteTags === '' || remoteTagCommit !== commit) {
			this.refuse(`tag ${tag} nie jest wypchnięty — \`git push --follow-tags origin main\``);
		}
	}

	deploy() {
		this.ensureCleanWorkingTree();
		const tag = this.findReleaseTag();
		const commit = this.readGit('rev-parse', 'HEAD');
		this.ensurePublished(tag, commit);
		console.log(`Wdrażam wydanie ${tag} (${commit.slice(0, 7)}) po pełnych testach.`);

		this.runStep('Wartości w .env', 'node', ['scripts/check-deploy-environment.mjs']);
		this.runStep('Sprawdzenie typów', 'npm', ['run', 'check']);
		this.runStep('Lint', 'npm', ['run', 'lint']);
		this.runStep('Testy jednostkowe', 'npm', ['run', 'test']);
		this.runStep('Testy w przeglądarce (Playwright)', 'npm', ['run', 'test:e2e']);
		this.runStep('Budowanie strony', 'npm', ['run', 'build']);
		this.runStep('Usuwanie niepublicznych plików', 'node', [
			'scripts/remove-private-files-from-build.mjs'
		]);
		this.runStep('Wysyłka na Cloudflare Pages', 'npx', [
			'wrangler',
			'pages',
			'deploy',
			'build',
			'--project-name',
			'gis-of-gothic',
			'--branch',
			PRODUCTION_BRANCH,
			'--commit-hash',
			commit,
			'--commit-message',
			`Wydanie ${tag}`
		]);
		console.log(`\n✔ Na produkcji jest wydanie ${tag}.`);
	}
}

new ReleaseDeployment().deploy();
