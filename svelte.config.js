import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Strip TypeScript from the shipped .svelte files so Svelte 4 consumers can compile them.
	preprocess: vitePreprocess({ script: true }),
	compilerOptions: {
		// src/lib/runes/ is runes mode, the rest of src/lib/ keeps Svelte 4 syntax, and everything
		// else outside node_modules (routes, fixtures) is runes mode. The runes rule must come first.
		runes: ({ filename }) => {
			const parts = filename.split(/[/\\]/);
			if (parts.includes('node_modules')) return undefined;
			if (/(^|[/\\])src[/\\]lib[/\\]runes[/\\]/.test(filename)) return true;
			if (/(^|[/\\])src[/\\]lib[/\\]/.test(filename)) return undefined;
			return true;
		}
	},
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter()
	}
};

export default config;
