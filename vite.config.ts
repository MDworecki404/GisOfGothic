import { readFileSync } from 'node:fs';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'vitest/config';

const packageVersion: unknown = JSON.parse(readFileSync('package.json', 'utf-8')).version;
const cesiumSource = 'node_modules/cesium/Build/Cesium';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: 'index.html' }),
			paths: { relative: false },
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['none'],
					'script-src': ['self', 'wasm-unsafe-eval', 'unsafe-eval'],
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:', 'blob:'],
					'font-src': ['self'],
					'connect-src': ['self', 'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev'],
					'worker-src': ['self', 'blob:'],
					'manifest-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['none']
				}
			}
		}),
		viteStaticCopy({
			targets: ['Workers', 'Assets', 'ThirdParty', 'Widgets'].map((dir) => ({
				src: `${cesiumSource}/${dir}`,
				dest: 'cesiumStatic',
				// zachowaj tylko `Workers/`, `Assets/`… (bez node_modules/cesium/Build/Cesium)
				rename: { stripBase: 4 }
			}))
		})
	],
	define: {
		CESIUM_BASE_URL: JSON.stringify('/cesiumStatic'),
		__APP_VERSION__: JSON.stringify(packageVersion)
	},
	test: {
		include: ['src/**/*.{test,spec}.ts']
	}
});
