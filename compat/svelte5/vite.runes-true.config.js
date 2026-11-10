import { defineConfig } from 'vitest/config';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Step 6 of run.mjs: a consumer whose compilerOptions.runes is the boolean true, so every component,
// the library's in node_modules included, compiles in runes mode. Only svelte-final-form-ts/runes
// supports that setup, so only the runes set runs. configFile: false keeps svelte.config.js and its
// function form out.
export default defineConfig({
	plugins: [
		svelte({ configFile: false, preprocess: vitePreprocess(), compilerOptions: { runes: true } })
	],
	// The browser build of svelte: the component tests mount into jsdom.
	resolve: { conditions: ['browser'] },
	// As in vite.config.js: Vite's default deny list without '**/.git/**', for git worktrees.
	server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}'] } },
	test: { environment: 'jsdom', include: ['src/runes/**/*.test.ts'] }
});
