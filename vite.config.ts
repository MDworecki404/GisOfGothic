import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { defineConfig } from 'vitest/config';

const cesiumSource = 'node_modules/cesium/Build/Cesium';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: 'index.html' })
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
		CESIUM_BASE_URL: JSON.stringify('/cesiumStatic')
	},
	test: {
		include: ['src/**/*.{test,spec}.ts']
	}
});
