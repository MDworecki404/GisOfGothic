/**
 * Pełne wydanie jednym poleceniem: podbicie wersji (`npm run release`), wypchnięcie commitu
 * i tagu na GitHuba, a potem wdrożenie na produkcję (`npm run deploy`, które samo uruchamia
 * wszystkie testy). Odmawia poza gałęzią `main` albo przy niezacommitowanych zmianach.
 * Argumenty trafiają do `npm run release`; z `--dry-run` skrypt kończy się po podglądzie wydania.
 *
 * Użycie: npm run publish-release [-- --release-as minor]
 */
import { execFileSync, spawnSync } from 'node:child_process';

const PRODUCTION_BRANCH = 'main';

class ReleasePublication {
	readGit(...args) {
		return execFileSync('git', args, { encoding: 'utf8' }).trim();
	}

	refuse(reason) {
		console.error(`\n✖ Wydanie przerwane: ${reason}.`);
		process.exit(1);
	}

	/** Na Windows `npm` wymaga powłoki, która dzieli argumenty po spacjach — stąd cudzysłowy. */
	runStep(description, command, args) {
		console.log(`\n▶ ${description}`);
		const usesShell = process.platform === 'win32';
		const shellSafeArgs = usesShell ? args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg)) : args;
		const result = spawnSync(command, shellSafeArgs, { stdio: 'inherit', shell: usesShell });
		if (result.status !== 0) this.refuse(`krok „${description}” się nie powiódł`);
	}

	ensureReadyToRelease() {
		if (this.readGit('branch', '--show-current') !== PRODUCTION_BRANCH) {
			this.refuse(`wydanie robimy z gałęzi ${PRODUCTION_BRANCH}`);
		}
		if (this.readGit('status', '--porcelain') !== '') {
			this.refuse('są niezacommitowane zmiany');
		}
	}

	publish(releaseArguments) {
		this.ensureReadyToRelease();
		const isDryRun = releaseArguments.includes('--dry-run');
		this.runStep('Podbicie wersji i changelog', 'npm', [
			'run',
			'release',
			...(releaseArguments.length > 0 ? ['--', ...releaseArguments] : [])
		]);
		if (isDryRun) return;
		this.runStep('Wypchnięcie commitu i tagu', 'git', [
			'push',
			'--follow-tags',
			'origin',
			PRODUCTION_BRANCH
		]);
		this.runStep('Wdrożenie na produkcję', 'npm', ['run', 'deploy']);
	}
}

new ReleasePublication().publish(process.argv.slice(2));
