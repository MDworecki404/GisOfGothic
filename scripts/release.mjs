/**
 * Wydanie nowej wersji. Przed 1.0.0 `commit-and-tag-version` zawsze zamienia `feat` na podbicie
 * patch (tryb `preMajor`, nie do wyłączenia konfiguracją), więc nowe funkcje nie podnosiłyby
 * środkowej liczby. Skrypt wykrywa commity `feat` od ostatniego tagu i wtedy wymusza `--release-as minor`.
 * Pozostałe argumenty (np. `--dry-run`, `--release-as major`) trafiają do narzędzia bez zmian.
 *
 * Użycie: npm run release [-- --dry-run]
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const FEATURE_COMMIT_SUBJECT = /^feat(\([^)]*\))?!?:/;

class ReleaseVersionPicker {
	readGit(...args) {
		return execFileSync('git', args, { encoding: 'utf8' }).trim();
	}

	readCurrentVersion() {
		return JSON.parse(readFileSync('package.json', 'utf8')).version;
	}

	isBeforeFirstStableVersion() {
		return this.readCurrentVersion().startsWith('0.');
	}

	hasFeatureCommitsSinceLastTag() {
		const lastTag = this.readGit('describe', '--tags', '--abbrev=0');
		const subjects = this.readGit('log', `${lastTag}..HEAD`, '--format=%s').split('\n');
		return subjects.some((subject) => FEATURE_COMMIT_SUBJECT.test(subject));
	}

	buildReleaseArguments(userArguments) {
		const userChoseVersion = userArguments.some((argument) => argument.startsWith('--release-as'));
		const shouldForceMinor =
			!userChoseVersion &&
			this.isBeforeFirstStableVersion() &&
			this.hasFeatureCommitsSinceLastTag();
		return shouldForceMinor ? ['--release-as', 'minor', ...userArguments] : userArguments;
	}
}

const releaseArguments = new ReleaseVersionPicker().buildReleaseArguments(process.argv.slice(2));
const usesShell = process.platform === 'win32';
const result = spawnSync('npx', ['commit-and-tag-version', ...releaseArguments], {
	stdio: 'inherit',
	shell: usesShell
});
process.exit(result.status ?? 1);
