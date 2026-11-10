// The /runes entry: what it exports, the import rule of 05-architecture.md:335 (runes/ imports values
// only from core/ and svelte), and "Packing produces the named tarball with only the library" with
// requirements change 5 (05-architecture.md:463): the tarball holds dist/runes/index.js and
// dist/runes/index.d.ts, and every relative import of both resolves to a file in the tarball.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, posix, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as root from '../lib/index.js';
import * as runes from '../lib/runes/index.js';
import RunesField from '../lib/runes/Field.svelte';
import RunesForm from '../lib/runes/Form.svelte';
import RunesFormSpy from '../lib/runes/FormSpy.svelte';

const projectRoot = resolve(import.meta.dirname, '../..');
const runesDir = join(projectRoot, 'src/lib/runes');
const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as {
	name: string;
	version: string;
};
const tarball = `${manifest.name}-${manifest.version}.tgz`;

/** The module specifiers a file imports or re-exports values from; `import type` is left out. */
const valueImportsOf = (source: string): string[] =>
	[...source.matchAll(/\b(?:import|export)\s+(type\s+)?(?:[^;]*?\bfrom\s+)?'([^']+)'/g)]
		.filter(([, typeOnly]) => !typeOnly)
		.map(([, , specifier]) => specifier);

describe('runes entry', () => {
	it('exports Form, Field, FormSpy and getForm and nothing else at runtime', () => {
		const names = Object.keys(runes).sort();

		expect(names).toEqual(['Field', 'Form', 'FormSpy', 'getForm']);
	});

	it('exports the runes components, not the legacy ones', () => {
		const { Form, Field, FormSpy } = runes;

		expect({ Form, Field, FormSpy }).toEqual({
			Form: RunesForm,
			Field: RunesField,
			FormSpy: RunesFormSpy
		});
		expect([Form, Field, FormSpy]).not.toContain(root.Form);
		expect([Form, Field, FormSpy]).not.toContain(root.Field);
		expect([Form, Field, FormSpy]).not.toContain(root.FormSpy);
	});

	it('shares getForm with the root entry, so a Form of either set provides it', () => {
		expect(runes.getForm).toBe(root.getForm);
	});

	it.each(readdirSync(runesDir).filter((file) => /\.(svelte|ts)$/.test(file)))(
		'imports values only from svelte, the core and its own components: %s',
		(file) => {
			const specifiers = valueImportsOf(readFileSync(join(runesDir, file), 'utf8'));
			const foreign = specifiers.filter(
				(specifier) =>
					specifier !== 'svelte' &&
					!/^\.\.\/core\/[a-z]+\.js$/.test(specifier) &&
					!/^\.\/[A-Za-z]+\.svelte$/.test(specifier)
			);

			expect(specifiers.length).toBeGreaterThan(0);
			expect(foreign).toEqual([]);
		}
	);
});

interface PackResult {
	filename: string;
	files: { path: string }[];
}

let packDir = '';
let pack: PackResult | undefined;
let packError = '';

beforeAll(() => {
	// Packaged into a scratch folder, so the run neither rewrites the project's dist nor wakes Vite.
	packDir = mkdtempSync(join(tmpdir(), 'svelte-final-form-ts-pack-'));
	const build = spawnSync(
		join(projectRoot, 'node_modules/.bin/svelte-package'),
		['-o', join(packDir, 'dist')],
		{ cwd: projectRoot, encoding: 'utf8' }
	);
	if (build.status !== 0) {
		packError = `svelte-package failed: ${build.stderr}${build.stdout}`;
		return;
	}
	copyFileSync(join(projectRoot, 'package.json'), join(packDir, 'package.json'));
	copyFileSync(join(projectRoot, 'LICENSE.md'), join(packDir, 'LICENSE.md'));
	const run = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
		cwd: packDir,
		encoding: 'utf8'
	});
	if (run.status !== 0) {
		packError = `npm pack failed: ${run.stderr}`;
		return;
	}
	pack = (JSON.parse(run.stdout) as PackResult[])[0];
}, 120_000);

afterAll(() => {
	if (packDir) rmSync(packDir, { recursive: true, force: true });
});

const packedPaths = (): string[] => {
	if (!pack) throw new Error(packError || 'npm pack produced no result');
	return pack.files.map((file) => file.path);
};

describe('the packed library', () => {
	it('is named after the package and version', () => {
		packedPaths();

		expect(pack?.filename).toBe(tarball);
	});

	it.each([
		'dist/index.js',
		'dist/index.d.ts',
		'dist/runes/index.js',
		'dist/runes/index.d.ts',
		'dist/runes/Form.svelte',
		'dist/runes/Field.svelte',
		'dist/runes/FormSpy.svelte'
	])('contains %s', (path) => {
		expect(packedPaths()).toContain(path);
	});

	it('contains only the manifest, readme, license and dist, with no test, spec, route or fixture file', () => {
		const stray = packedPaths().filter(
			(path) =>
				!(path.startsWith('dist/') || ['package.json', 'README.md', 'LICENSE.md'].includes(path)) ||
				/\.(test|spec)\./.test(path) ||
				/(^|\/)(routes|fixtures|specs)\//.test(path)
		);

		expect(stray).toEqual([]);
	});

	it('contains every target of the export map', () => {
		const manifest = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8')) as {
			exports: Record<string, Record<string, string>>;
		};
		const targets = Object.values(manifest.exports).flatMap((conditions) =>
			Object.values(conditions).map((target) => posix.normalize(target))
		);

		expect(targets).toContain('dist/runes/index.js');
		expect(targets.filter((target) => !packedPaths().includes(target))).toEqual([]);
	});

	it.each(['dist/runes/index.js', 'dist/runes/index.d.ts', 'dist/index.js', 'dist/index.d.ts'])(
		'resolves every relative import of %s to a packed file',
		(entry) => {
			const paths = packedPaths();
			const source = readFileSync(join(packDir, entry), 'utf8');
			const relativeImports = [...source.matchAll(/\bfrom\s+'(\.[^']+)'/g)].map(
				([, specifier]) => specifier
			);
			// A declaration file resolves `./X.svelte` to `X.svelte.d.ts` and `./x.js` to `x.d.ts`.
			const candidates = (target: string): string[] =>
				entry.endsWith('.d.ts') ? [`${target}.d.ts`, target.replace(/\.js$/, '.d.ts')] : [target];
			const missing = relativeImports
				.map((specifier) => posix.join(posix.dirname(entry), specifier))
				.filter((target) => !candidates(target).some((candidate) => paths.includes(candidate)));

			expect(relativeImports.length).toBeGreaterThan(0);
			expect(missing).toEqual([]);
		}
	);

	it('keeps the root entry free of the runes set', () => {
		const rootImports = ['dist/index.js', 'dist/index.d.ts'].flatMap((entry) =>
			[...readFileSync(join(packDir, entry), 'utf8').matchAll(/\bfrom\s+'([^']+)'/g)].map(
				([, specifier]) => specifier
			)
		);

		expect(packedPaths()).toContain('dist/index.js');
		expect(rootImports.filter((specifier) => specifier.includes('runes'))).toEqual([]);
	});
});
