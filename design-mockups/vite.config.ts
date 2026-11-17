import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	root: import.meta.dirname,
	base: './',
	plugins: [svelte({ configFile: false, compilerOptions: { runes: true } })],
	server: { port: 5180, strictPort: true },
	preview: { port: 5180, strictPort: true },
	build: { outDir: 'dist', emptyOutDir: true }
});
