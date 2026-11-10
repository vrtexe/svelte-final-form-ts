// Compat harness: proves the packed library in consumer projects, one install per matrix row
// (05-architecture.md, Decision, "Compat harness", steps 1 to 6), for the root and /runes entries.
// Stops at the first failure.
// usage: npm run test:compat   (needs registry access; works in the git-ignored compat/.work/)
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const compat = import.meta.dirname;
const root = path.dirname(compat);
const work = path.join(compat, '.work');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const tarball = `${manifest.name}-${manifest.version}.tgz`;
const projectFiles = [
	'package.json',
	'package-lock.json',
	'vite.config.js',
	'svelte.config.js',
	'tsconfig.json'
];
// A project holding this config also runs step 6, the consumer with a boolean
// compilerOptions.runes (05-architecture.md:451).
const runesTrueConfig = 'vite.runes-true.config.js';
const rows = [
	{ project: 'svelte4', svelte: '4.2.0', finalForm: '4.20.0' },
	{ project: 'svelte4', svelte: '4.2.0', finalForm: '5.0.0' },
	{ project: 'svelte4', svelte: '4.2.20', finalForm: '4.20.10' },
	{ project: 'svelte4', svelte: '4.2.20', finalForm: '5.0.1' },
	{ project: 'svelte5-floor', svelte: '5.0.0', finalForm: '4.20.0' },
	{ project: 'svelte5-floor', svelte: '5.0.0', finalForm: '5.0.0' },
	{ project: 'svelte5', svelte: '5.56.10', finalForm: '4.20.10' },
	{ project: 'svelte5', svelte: '5.56.10', finalForm: '5.0.1' }
];
// Runes mode for every component outside node_modules, as the sv template sets it. svelte 5.0.0
// accepts only a boolean compilerOptions.runes, so the per-file choice goes through the plugin.
const runesConfig = `export default {
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.split(/[/\\\\]/).includes('node_modules') ? undefined : { runes: true }
	}
};
`;
const expectedErrors = JSON.parse(
	fs.readFileSync(path.join(compat, 'shared/expected-errors.json'), 'utf8')
);

function fail(message) {
	console.error(`FAIL ${message}`);
	process.exit(1);
}

function run(cmd, args, cwd, env = {}) {
	const r = spawnSync(cmd, args, {
		cwd,
		encoding: 'utf8',
		maxBuffer: 64 << 20,
		env: { ...process.env, ...env }
	});
	return { code: r.status ?? 1, stdout: r.stdout ?? '', all: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

console.log('== 1. lockfiles resolve from the public registry');
const lockfiles = [
	path.join(root, 'package-lock.json'),
	...new Set(rows.map((r) => path.join(compat, r.project, 'package-lock.json')))
];
for (const lock of lockfiles) {
	const name = path.relative(root, lock);
	if (!fs.existsSync(lock)) fail(`${name} is missing`);
	if (fs.readFileSync(lock, 'utf8').includes('repo.netcetera.com')) {
		fail(
			`${name} contains repo.netcetera.com; ` +
				'regenerate it with npm install --registry=https://registry.npmjs.org/'
		);
	}
}

// The runes set must reach the library only through /runes: step 6 compiles everything it imports
// in runes mode, which the legacy components of the root entry do not support.
console.log('== 1. the runes fixture sets import only svelte-final-form-ts/runes');
const runesFiles = ['shared/runes', 'shared/types/runes'].flatMap((set) =>
	fs
		.readdirSync(path.join(compat, set), { recursive: true })
		.map((f) => path.join(compat, set, f))
		.filter((f) => fs.statSync(f).isFile())
);
for (const file of runesFiles) {
	const source = fs.readFileSync(file, 'utf8');
	for (const [, spec] of source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*['"]([^'"]+)['"]/g)) {
		if (spec === 'svelte-final-form-ts' || spec.split('/').includes('legacy')) {
			fail(`${path.relative(root, file)} imports ${spec}`);
		}
	}
}
console.log(`OK   ${runesFiles.length} files`);

console.log('== 2. npm pack (prepack runs svelte-package and publint)');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
const pack = run('npm', ['pack', '--json', '--pack-destination', work], root);
if (pack.code !== 0) fail(`npm pack exited ${pack.code}\n${pack.all}`);
if (!pack.all.includes('All good!')) fail(`publint did not report a clean package\n${pack.all}`);
// Lifecycle output can precede the JSON on stdout; the JSON array starts on its own line.
const [packed] = JSON.parse(pack.stdout.slice(pack.stdout.search(/^\[/m)));
if (packed.filename !== tarball) fail(`tarball is ${packed.filename}, expected ${tarball}`);
const packedFiles = packed.files.map((f) => f.path);
const stray = packedFiles.filter(
	(f) =>
		!(
			f.startsWith('dist/') ||
			f === 'package.json' ||
			f === 'README.md' ||
			f === 'LICENSE.md'
		) || /\.(spec|test)\./.test(f)
);
if (stray.length) fail(`tarball holds files outside the library: ${stray.join(', ')}`);
for (const f of [
	'dist/index.js',
	'dist/index.d.ts',
	'dist/runes/index.js',
	'dist/runes/index.d.ts',
	// The declarations of Form, Field, FormSpy and getForm from the root entry.
	'dist/legacy/Form.svelte.d.ts',
	'dist/legacy/Field.svelte.d.ts',
	'dist/legacy/FormSpy.svelte.d.ts',
	'dist/core/context.d.ts'
]) {
	if (!packedFiles.includes(f)) fail(`tarball lacks ${f}`);
}
console.log(`OK   ${tarball}, ${packedFiles.length} files`);

console.log('== 3. the root entry reaches nothing under dist/runes/ and no Snippet type');
const dist = path.join(root, 'dist');
const importsSnippet =
	/\bimport\b[^;]*\bSnippet\b[^;]*['"]svelte['"]|import\(\s*['"]svelte['"]\s*\)\.Snippet\b/;
function reachable(entry) {
	const seen = new Set();
	const todo = [entry];
	while (todo.length) {
		const file = todo.pop();
		if (seen.has(file)) continue;
		if (!fs.existsSync(file)) fail(`${path.relative(root, file)} is imported but not shipped`);
		seen.add(file);
		const source = fs.readFileSync(file, 'utf8');
		for (const [, spec] of source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*['"](\.[^'"]*)['"]/g)) {
			let target = path.resolve(path.dirname(file), spec);
			if (file.endsWith('.d.ts')) {
				target = target.endsWith('.js') ? target.slice(0, -3) + '.d.ts' : target + '.d.ts';
			}
			todo.push(target);
		}
	}
	return [...seen];
}
for (const entry of ['index.js', 'index.d.ts']) {
	for (const file of reachable(path.join(dist, entry))) {
		const rel = path.relative(dist, file);
		if (rel.startsWith(`runes${path.sep}`)) fail(`dist/${entry} reaches dist/${rel}`);
		if (rel.endsWith('.d.ts') && importsSnippet.test(fs.readFileSync(file, 'utf8'))) {
			fail(`dist/${rel}, reached from dist/${entry}, imports Snippet`);
		}
	}
}
console.log('OK   root entry graph');

// Svelte 4 compiler, no preprocessor: shipped components must hold plain JavaScript.
function compileWithSvelte4(dir) {
	const compiler = createRequire(path.join(dir, 'package.json'))('svelte/compiler');
	const lib = path.join(dir, 'node_modules/svelte-final-form-ts/dist');
	const files = fs
		.readdirSync(lib, { recursive: true })
		.filter((f) => f.endsWith('.svelte') && !f.startsWith(`runes${path.sep}`));
	for (const f of files) {
		for (const generate of ['dom', 'ssr']) {
			try {
				compiler.compile(fs.readFileSync(path.join(lib, f), 'utf8'), { filename: f, generate });
			} catch (e) {
				fail(`svelte ${compiler.VERSION} (${generate}) cannot compile dist/${f}: ${e.message}`);
			}
		}
	}
	console.log(
		`OK   4. svelte ${compiler.VERSION} compiled ${files.length} components without a preprocessor`
	);
}

function checkTypes(dir, name, major) {
	const r = run(
		'node_modules/.bin/svelte-check',
		['--tsconfig', './tsconfig.json', '--output', 'machine-verbose'],
		dir
	);
	if (!/\bCOMPLETED\b/.test(r.stdout)) fail(`${name}: svelte-check did not complete\n${r.all}`);
	const actual = r.stdout
		.split('\n')
		.map((line) => line.match(/^\d+ (\{.*\})$/)?.[1])
		.filter(Boolean)
		.map((json) => JSON.parse(json))
		.filter((d) => d.type === 'ERROR')
		.map((d) => ({
			file: path.relative('src', d.filename),
			line: d.start.line + 1,
			message: d.message
		}));
	const missing = [];
	const absent = [];
	for (const [file, errors] of Object.entries(expectedErrors)) {
		// Svelte 4 rows skip the runes fixtures, so their expected errors are absent by design.
		if (!fs.existsSync(path.join(dir, 'src', file))) {
			if (!(major === 4 && file.includes('runes'))) absent.push(file);
			continue;
		}
		for (const e of errors) {
			const i = actual.findIndex(
				(a) => a.file === file && a.line === e.line && a.message.includes(e.includes)
			);
			if (i === -1) missing.push(`${file}:${e.line} "${e.includes}"`);
			else actual.splice(i, 1);
		}
	}
	const positive = ['types/legacy-Exports.svelte'];
	if (major >= 5) positive.push('types/runes/exports.ts');
	for (const file of positive) {
		if (!fs.existsSync(path.join(dir, 'src', file))) absent.push(file);
	}
	if (absent.length) {
		fail(`${name}: type fixtures are missing: ${absent.join(', ')}`);
	}
	if (missing.length || actual.length) {
		fail(
			`${name}: svelte-check errors differ from expected-errors.json\n` +
				`  missing: ${missing.join('; ') || 'none'}\n` +
				`  extra: ${actual.map((a) => `${a.file}:${a.line} ${a.message}`).join('; ') || 'none'}`
		);
	}
	console.log('OK   svelte-check errors match expected-errors.json');
}

for (const row of rows) {
	const name = `${row.project}-svelte${row.svelte}-final-form${row.finalForm}`;
	const major = Number(row.svelte.split('.')[0]);
	console.log(`== 5. ${name}`);
	const dir = path.join(work, name);
	for (const f of projectFiles) fs.cpSync(path.join(compat, row.project, f), path.join(dir, f));
	const runesTrue = fs.existsSync(path.join(compat, row.project, runesTrueConfig));
	if (runesTrue) {
		fs.cpSync(path.join(compat, row.project, runesTrueConfig), path.join(dir, runesTrueConfig));
	}
	// The runes entry is Svelte 5 only, so Svelte 4 rows skip its fixtures.
	fs.cpSync(path.join(compat, 'shared/types'), path.join(dir, 'src/types'), {
		recursive: true,
		filter: (src) => major >= 5 || !path.basename(src).includes('runes')
	});
	fs.cpSync(path.join(compat, 'shared/smoke'), path.join(dir, 'src/smoke'), { recursive: true });
	fs.cpSync(path.join(compat, 'shared/legacy'), path.join(dir, 'src/legacy'), { recursive: true });
	if (major >= 5) {
		fs.cpSync(path.join(compat, 'shared/runes'), path.join(dir, 'src/runes'), { recursive: true });
	}

	const install = run(
		'npm',
		[
			'install',
			'--no-save',
			'--no-audit',
			'--no-fund',
			`../${tarball}`,
			`svelte@${row.svelte}`,
			`final-form@${row.finalForm}`
		],
		dir
	);
	if (install.code !== 0 || install.all.includes('ERESOLVE')) {
		fail(`${name}: npm install exited ${install.code}\n${install.all}`);
	}
	for (const [pkg, version] of [
		['svelte', row.svelte],
		['final-form', row.finalForm]
	]) {
		const got = JSON.parse(
			fs.readFileSync(path.join(dir, 'node_modules', pkg, 'package.json'), 'utf8')
		).version;
		if (got !== version) fail(`${name}: installed ${pkg} ${got}, expected ${version}`);
	}
	console.log('OK   installed without a peer conflict');

	if (major === 4) compileWithSvelte4(dir);
	checkTypes(dir, name, major);

	// Svelte 5 consumers run the legacy and runes sets in both modes, runes mode last because it
	// replaces the project's svelte.config.js (07-plan.md, contract decision 9). The legacy set reads
	// the mode from COMPAT_MODE, the runes set from COMPAT_RUNES.
	for (const mode of major === 4 ? ['non-runes'] : ['non-runes', 'runes']) {
		if (mode === 'runes') fs.writeFileSync(path.join(dir, 'svelte.config.js'), runesConfig);
		const test = run('node_modules/.bin/vitest', ['run'], dir, {
			COMPAT_MODE: mode,
			COMPAT_RUNES: mode === 'runes' ? '1' : ''
		});
		if (test.code !== 0) fail(`${name}, ${mode} mode: vitest exited ${test.code}\n${test.all}`);
		console.log(
			`OK   vitest, ${mode} mode: ${test.all.match(/Tests\s+.*passed.*/)?.[0] ?? 'passed'}`
		);
	}

	// 6. A boolean runes: true compiles node_modules in runes mode as well, so only the /runes
	// consumers of the runes set can run.
	if (runesTrue) {
		const test = run('node_modules/.bin/vitest', ['run', '--config', runesTrueConfig], dir, {
			COMPAT_RUNES: '1'
		});
		if (test.code !== 0) fail(`${name}, boolean runes: vitest exited ${test.code}\n${test.all}`);
		console.log(
			`OK   6. vitest, boolean runes: ${test.all.match(/Tests\s+.*passed.*/)?.[0] ?? 'passed'}`
		);
	}
}
console.log(`\nAll ${rows.length} rows passed.`);
