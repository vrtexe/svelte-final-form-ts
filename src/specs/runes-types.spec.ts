// Requirements change 3 (05-architecture.md:461): the TypeScript types scenarios also hold for snippet
// consumers of the runes set, with the same error counts under strict. svelte-check does not honour
// expect-error comments in markup, so each consumer is written to a scratch folder and checked there,
// one scenario row per file, and every file must report exactly the stated number of errors.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

const profileValues = `{ firstName: 'Ana', age: 30, address: { city: 'Skopje', zip: '1000' }, newsletter: true }`;

/** A runes Form with values inferred from its initial values, around `content`. */
const inferred = (content: string, script = '') => `<script lang="ts">
	import { Field, Form } from '$lib/runes/index.js';
${script}
</script>

<Form onSubmit={() => undefined} initialValues={${profileValues}}>
	{#snippet children({ form })}
${content}
	{/snippet}
</Form>
`;

const field = (name: string, body = '<span>{input.value}</span>') =>
	`		<Field {form} name="${name}">
			{#snippet children({ input })}${body}{/snippet}
		</Field>`;

const assignTo = (name: string, target: string) =>
	field(name, `{@const target: ${target} = input.value}<span>{target}</span>`);

const consumers: Record<string, { source: string; errors: number; mentions?: string }> = {
	// Field names that are not paths of the form values are rejected.
	'NameFirstName.svelte': { source: inferred(field('firstName')), errors: 0 },
	'NameAddressCity.svelte': { source: inferred(field('address.city')), errors: 0 },
	'NameAddress.svelte': { source: inferred(field('address')), errors: 0 },
	'NameLowercase.svelte': {
		source: inferred(field('firstname')),
		errors: 1,
		mentions: '"firstname"'
	},
	'NameAddressTown.svelte': {
		source: inferred(field('address.town')),
		errors: 1,
		mentions: '"address.town"'
	},
	'NameEmpty.svelte': { source: inferred(field('')), errors: 1, mentions: '""' },
	// The field value is typed from its path.
	'ValueAgeNumber.svelte': { source: inferred(assignTo('age', 'number | undefined')), errors: 0 },
	'ValueAgeString.svelte': { source: inferred(assignTo('age', 'string')), errors: 1 },
	'ValueCityString.svelte': {
		source: inferred(assignTo('address.city', 'string | undefined')),
		errors: 0
	},
	'ValueNewsletterBoolean.svelte': {
		source: inferred(assignTo('newsletter', 'boolean | undefined')),
		errors: 0
	},
	'ValueNewsletterNumber.svelte': { source: inferred(assignTo('newsletter', 'number')), errors: 1 },
	// The change handler rejects a value of the wrong type.
	'ChangeAgeString.svelte': {
		source: inferred(
			field('age', `<button type="button" onclick={() => input.onChange('thirty')}>Change</button>`)
		),
		errors: 1,
		mentions: "type 'number'"
	},
	// Form values are inferred from initialValues without explicit generics.
	'InferInitial.svelte': {
		source: `<script lang="ts">
	import { Field, Form } from '$lib/runes/index.js';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Ana', age: 30 }}>
	{#snippet children({ form })}
		<Field {form} name="firstName">{#snippet children({ input })}{input.value}{/snippet}</Field>
		<Field {form} name="lastName">{#snippet children({ input })}{input.value}{/snippet}</Field>
	{/snippet}
</Form>
`,
		errors: 1,
		mentions: '"lastName"'
	},
	// Form values are inferred from onSubmit without explicit generics.
	'InferSubmit.svelte': {
		source: `<script lang="ts">
	import { Field, Form } from '$lib/runes/index.js';
	interface Profile {
		firstName: string;
		age: number;
		address: { city: string; zip: string };
		newsletter: boolean;
	}
	const onSubmit = (values: Profile): undefined => void values;
</script>

<Form {onSubmit}>
	{#snippet children({ form })}
		<Field {form} name="address.zip">{#snippet children({ input })}{input.value}{/snippet}</Field>
		<Field {form} name="address.code">{#snippet children({ input })}{input.value}{/snippet}</Field>
	{/snippet}
</Form>
`,
		errors: 1,
		mentions: '"address.code"'
	},
	// The form API from the helper is typed by the given form values.
	'HelperChange.svelte': {
		source: `<script lang="ts">
	import { getForm } from '$lib/runes/index.js';
	interface Profile {
		firstName: string;
		age: number;
		address: { city: string; zip: string };
		newsletter: boolean;
	}
	const form = getForm<Profile>();
	form.change('address.city', 5);
</script>
`,
		errors: 1
	},
	// The FormSpy content state is typed by the form it is given.
	'SpyState.svelte': {
		source: inferred(`		<FormSpy {form} subscription={{ values: true }}>
			{#snippet children({ state })}
				{@const city: string | undefined = state.values.address?.city}
				{@const age: string = state.values.age}
				<span>{city}{age}</span>
			{/snippet}
		</FormSpy>`).replace('{ Field, Form }', '{ Field, Form, FormSpy }'),
		errors: 1
	}
};

interface Diagnostic {
	file: string;
	line: number;
	message: string;
}

let dir = '';
let diagnostics: Diagnostic[] = [];
let exitStatus: number | null = null;

beforeAll(() => {
	dir = mkdtempSync(join(tmpdir(), 'svelte-final-form-ts-runes-types-'));
	symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'));
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
	writeFileSync(
		join(dir, 'tsconfig.json'),
		JSON.stringify({ extends: join(root, 'tsconfig.json'), include: ['./*.svelte'] })
	);
	for (const [file, { source }] of Object.entries(consumers))
		writeFileSync(join(dir, file), source);

	const run = spawnSync(
		join(root, 'node_modules/.bin/svelte-check'),
		['--tsconfig', join(dir, 'tsconfig.json'), '--output', 'machine', '--threshold', 'error'],
		{ cwd: root, encoding: 'utf8' }
	);
	exitStatus = run.status;
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

describe('runes set, snippet consumer: TypeScript types under strict', () => {
	it('svelte-check ran and reported errors only in the scratch consumers', () => {
		const foreign = diagnostics.filter((diagnostic) => !(diagnostic.file in consumers));

		expect(exitStatus).not.toBeNull();
		expect(foreign).toEqual([]);
	});

	it.each(
		Object.entries(consumers).map(([file, { errors, mentions }]) => ({ file, errors, mentions }))
	)('$file reports $errors error(s)', ({ file, errors, mentions }) => {
		const found = diagnostics.filter((diagnostic) => diagnostic.file === file);

		expect(found.map((diagnostic) => diagnostic.message)).toHaveLength(errors);
		if (mentions) expect(found[0].message).toContain(mentions);
	});
});
