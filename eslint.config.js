import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'node_modules/',
			'static/',
			'src/lib/components/ui/',
			'playwright-report/',
			'test-results/'
		]
	},
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: { globals: { ...globals.browser, ...globals.node } }
	},
	{
		rules: {
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-non-null-assertion': 'error',
			'@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }]
		}
	},
	{
		files: ['src/lib/components/**/*.svelte', 'src/routes/**/*.svelte'],
		ignores: ['src/lib/components/ui/**'],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['cesium', 'cesium/*', 'minisearch', '#lib/services/*', '#lib/data/*'],
							message: 'Komponenty UI korzystają z logiki wyłącznie przez fasadę i zdarzenia.'
						}
					]
				}
			]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: ts.parser } }
	}
);
