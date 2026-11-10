import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import config from '../../svelte.config.js';

interface ExportEntry {
	types: string;
	svelte: string;
}

interface Manifest {
	exports: Record<string, ExportEntry>;
	peerDependencies: Record<string, string>;
	dependencies?: Record<string, string>;
	svelte: string;
	types: string;
	files: string[];
}

const manifest: Manifest = JSON.parse(
	readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
);

const runesFor = (filename: string): boolean | undefined => {
	const runes = config.compilerOptions?.runes;
	if (typeof runes !== 'function') {
		throw new Error('svelte.config.js must set compilerOptions.runes to a function');
	}
	return runes({ filename });
};

describe('svelte.config.js runes option', () => {
	it.each([
		'src/lib/legacy/Form.svelte',
		'/home/dev/svelte-final-form-ts/src/lib/legacy/Field.svelte',
		'C:\\dev\\svelte-final-form-ts\\src\\lib\\legacy\\FormSpy.svelte',
		'src/lib/Form.svelte',
		'src/lib/runes-extra/Form.svelte',
		'src/lib/legacy/runes/Form.svelte'
	])('leaves the legacy set in Svelte 4 mode: %s', (filename) => {
		const mode = runesFor(filename);

		expect(mode).toBeUndefined();
	});

	it.each([
		'node_modules/some-lib/Component.svelte',
		'/home/dev/app/node_modules/svelte-final-form-ts/dist/runes/Form.svelte',
		'/home/dev/app/node_modules/svelte-final-form-ts/src/lib/runes/Form.svelte'
	])('leaves dependencies to decide: %s', (filename) => {
		const mode = runesFor(filename);

		expect(mode).toBeUndefined();
	});

	it.each([
		'src/lib/runes/Form.svelte',
		'/home/dev/svelte-final-form-ts/src/lib/runes/Field.svelte',
		'C:\\dev\\svelte-final-form-ts\\src\\lib\\runes\\FormSpy.svelte',
		'src/routes/+page.svelte',
		'src/fixtures/GetFormOutside.svelte',
		'src/fixtures/legacy/Profile.svelte'
	])('forces runes mode: %s', (filename) => {
		const mode = runesFor(filename);

		expect(mode).toBe(true);
	});
});

describe('package.json', () => {
	it('declares svelte and final-form as peers with the tested floors', () => {
		const peers = manifest.peerDependencies;

		expect(peers).toEqual({ svelte: '^4.2.0 || ^5.0.0', 'final-form': '^4.20.0 || ^5.0.0' });
	});

	it('has no runtime dependencies', () => {
		const dependencies = manifest.dependencies;

		expect(dependencies).toBeUndefined();
	});

	it('exports the root and the runes entry', () => {
		const entries = manifest.exports;

		expect(entries).toEqual({
			'.': { types: './dist/index.d.ts', svelte: './dist/index.js' },
			'./runes': { types: './dist/runes/index.d.ts', svelte: './dist/runes/index.js' }
		});
	});

	it('keeps the top-level entry fields and ships only dist without specs', () => {
		const { svelte, types, files } = manifest;

		expect({ svelte, types, files }).toEqual({
			svelte: './dist/index.js',
			types: './dist/index.d.ts',
			files: ['dist', '!dist/**/*.test.*', '!dist/**/*.spec.*']
		});
	});
});
