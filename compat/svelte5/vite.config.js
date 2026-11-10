import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [svelte(), svelteTesting()],
	// Vite's default deny list without '**/.git/**': vitest 4 enforces it on its own setup files,
	// which fails every test when the checkout is a git worktree under .git/.
	server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}'] } },
	test: { environment: 'jsdom', include: ['src/**/*.test.{js,ts}'] }
});
