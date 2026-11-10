// "Form values are inferred from initialValues / onSubmit without explicit generics": svelte-check
// must report exactly one error per consumer, on the bad field name. svelte-check does not honour
// expect-error comments in markup, so the consumers are written to a scratch folder and checked there.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

const consumers: Record<string, string> = {
	'InferInitial.svelte': `<script lang="ts">
	import { Field, Form } from '$lib/index.js';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Ana', age: 30 }} let:form>
	<Field {form} name="firstName" let:input><span>{input.value}</span></Field>
	<Field {form} name="lastName" let:input><span>{input.value}</span></Field>
</Form>
`,
	'InferInitialNonRunes.svelte': `<svelte:options runes={false} />

<script lang="ts">
	import { Field, Form } from '$lib/index.js';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Ana', age: 30 }} let:form>
	<Field {form} name="firstName" let:input><span>{input.value}</span></Field>
	<Field {form} name="lastName" let:input><span>{input.value}</span></Field>
</Form>
`,
	'InferSubmit.svelte': `<script lang="ts">
	import { Field, Form } from '$lib/index.js';
	interface Profile {
		firstName: string;
		age: number;
		address: { city: string; zip: string };
		newsletter: boolean;
	}
	const onSubmit = (values: Profile): undefined => void values;
</script>

<Form {onSubmit} let:form>
	<Field {form} name="address.zip" let:input><span>{input.value}</span></Field>
	<Field {form} name="address.code" let:input><span>{input.value}</span></Field>
</Form>
`
};

interface Diagnostic {
	file: string;
	line: number;
	message: string;
}

let dir = '';
let diagnostics: Diagnostic[] = [];

beforeAll(() => {
	// Outside the project, so Vite does not reload on the new tsconfig; the $lib alias comes from
	// the extended tsconfig and the packages from the linked node_modules.
	dir = mkdtempSync(join(tmpdir(), 'svelte-final-form-ts-types-'));
	symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'));
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
	writeFileSync(
		join(dir, 'tsconfig.json'),
		JSON.stringify({ extends: join(root, 'tsconfig.json'), include: ['./*.svelte'] })
	);
	for (const [file, source] of Object.entries(consumers)) writeFileSync(join(dir, file), source);

	const run = spawnSync(
		join(root, 'node_modules/.bin/svelte-check'),
		['--tsconfig', join(dir, 'tsconfig.json'), '--output', 'machine', '--threshold', 'error'],
		{ cwd: root, encoding: 'utf8' }
	);
	diagnostics = run.stdout
		.split('\n')
		.map((line) => /^\d+ ERROR "([^"]+)" (\d+):\d+ (".*")$/.exec(line))
		.filter((match) => match !== null)
		.map(([, file, line, message]) => ({
			file: relative(dir, resolve(root, file)),
			line: Number(line),
			message: JSON.parse(message) as string
		}));
}, 120_000);

afterAll(() => {
	if (dir) rmSync(dir, { recursive: true, force: true });
});

describe('legacy Form infers the form values without explicit generics', () => {
	it.each([
		{ file: 'InferInitial.svelte', line: 7, name: 'lastName' },
		{ file: 'InferInitialNonRunes.svelte', line: 9, name: 'lastName' },
		{ file: 'InferSubmit.svelte', line: 14, name: 'address.code' }
	])('$file reports one error, for $name', ({ file, line, name }) => {
		const errors = diagnostics.filter((diagnostic) => diagnostic.file === file);

		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatchObject({ line });
		expect(errors[0].message).toContain(`"${name}"`);
	});
});
