// Type-level checks: svelte-check (npm run check) fails on a wrong expectTypeOf and on an
// expect-error directive that has no error. The runtime asserts exist because vite.config.ts
// sets requireAssertions.
import type { FieldState } from 'final-form';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { getForm, type FieldRenderProps } from '../lib/index.js';
import * as runes from '../lib/runes/index.js';
import type {
	AnyFormValues,
	FieldInputProps,
	FieldPath,
	FieldPathValue,
	TypedFormApi
} from '../lib/index.js';

interface Profile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
}

interface TreeNode {
	label: string;
	child?: TreeNode;
	children: TreeNode[];
}

type ProfileInput<N extends FieldPath<Profile>> = FieldInputProps<N, FieldPathValue<Profile, N>>;

describe('FieldPath', () => {
	it('lists every key path of the profile form', () => {
		const path: FieldPath<Profile> = 'address.city';

		expectTypeOf<FieldPath<Profile>>().toEqualTypeOf<
			'firstName' | 'age' | 'address' | 'address.city' | 'address.zip' | 'newsletter'
		>();
		expect(path).toBe('address.city');
	});

	it('rejects names that are not paths', () => {
		// @ts-expect-error wrong case
		const wrongCase: FieldPath<Profile> = 'firstname';
		// @ts-expect-error unknown nested key
		const unknownNested: FieldPath<Profile> = 'address.town';
		// @ts-expect-error empty name
		const empty: FieldPath<Profile> = '';

		expect([wrongCase, unknownNested, empty]).toHaveLength(3);
	});

	it('treats arrays and dates as leaves', () => {
		type Values = { tags: string[]; born: Date };
		const path: FieldPath<Values> = 'tags';

		expectTypeOf<FieldPath<Values>>().toEqualTypeOf<'tags' | 'born'>();
		expect(path).toBe('tags');
	});

	it('stops at the depth cap on recursive types', () => {
		const deepest: FieldPath<TreeNode> = 'child.child.child.child.child.label';

		// @ts-expect-error one level beyond the cap
		const tooDeep: FieldPath<TreeNode> = 'child.child.child.child.child.child.label';

		expect([deepest, tooDeep]).toHaveLength(2);
	});

	it('is string for untyped form values', () => {
		const path: FieldPath<AnyFormValues> = 'anything.goes';

		expectTypeOf<FieldPath<AnyFormValues>>().toEqualTypeOf<string>();
		expect(path).toBe('anything.goes');
	});
});

describe('FieldPathValue', () => {
	it('types the value from its path', () => {
		const city: FieldPathValue<Profile, 'address.city'> = 'Skopje';

		expectTypeOf<FieldPathValue<Profile, 'age'>>().toEqualTypeOf<number>();
		expectTypeOf<FieldPathValue<Profile, 'address'>>().toEqualTypeOf<Profile['address']>();
		expectTypeOf<FieldPathValue<Profile, 'newsletter'>>().toEqualTypeOf<boolean>();
		expect(city).toBe('Skopje');
	});

	it('types the input value as the path value or undefined', () => {
		const age: number | undefined = undefined satisfies ProfileInput<'age'>['value'];

		expectTypeOf<ProfileInput<'age'>['value']>().toEqualTypeOf<number | undefined>();
		expectTypeOf<ProfileInput<'age'>['value']>().not.toExtend<string>();
		expectTypeOf<ProfileInput<'address.city'>['value']>().toEqualTypeOf<string | undefined>();
		expectTypeOf<ProfileInput<'newsletter'>['value']>().toEqualTypeOf<boolean | undefined>();
		expectTypeOf<ProfileInput<'newsletter'>['value']>().not.toExtend<number>();
		expect(age).toBeUndefined();
	});

	it('is any for untyped form values', () => {
		const value: FieldPathValue<AnyFormValues, 'anything'> = 42;

		expectTypeOf<FieldPathValue<AnyFormValues, string>>().toBeAny();
		expect(value).toBe(42);
	});
});

describe('TypedFormApi.change', () => {
	it('accepts a value of the path type and rejects another type', () => {
		const calls: unknown[] = [];
		const change: TypedFormApi<Profile>['change'] = (name, value) => {
			calls.push([name, value]);
		};

		change('address.city', 'Ohrid');
		// @ts-expect-error a number is not a city
		change('address.city', 5);
		// @ts-expect-error not a path
		change('address.town', 'Ohrid');

		expect(calls).toEqual([
			['address.city', 'Ohrid'],
			['address.city', 5],
			['address.town', 'Ohrid']
		]);
	});
});

describe('FieldInputProps.onChange', () => {
	it('rejects a value of the wrong type', () => {
		const values: unknown[] = [];
		const onChange: ProfileInput<'age'>['onChange'] = (value) => {
			values.push(value);
		};

		onChange(30);
		// @ts-expect-error age is a number
		onChange('thirty');

		expect(values).toEqual([30, 'thirty']);
	});
});

// Rows of the contract table in 07-plan.md, "Public types", and its decision 1 (path leaves).
interface ContractProfile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
	tags: string[];
	born?: Date;
}

describe('FieldPath contract rows', () => {
	it('lists the contract profile paths with arrays and optional dates as leaves', () => {
		const born: FieldPath<ContractProfile> = 'born';

		expectTypeOf<FieldPath<ContractProfile>>().toEqualTypeOf<
			| 'firstName'
			| 'age'
			| 'address'
			| 'address.city'
			| 'address.zip'
			| 'newsletter'
			| 'tags'
			| 'born'
		>();
		expect(born).toBe('born');
	});

	it('enters optional and nullable objects', () => {
		type Values = { a?: { b: string } | null };
		const path: FieldPath<Values> = 'a.b';

		expectTypeOf<FieldPath<Values>>().toEqualTypeOf<'a' | 'a.b'>();
		expect(path).toBe('a.b');
	});

	it('rejects array index paths and paths into dates', () => {
		// @ts-expect-error arrays are leaves
		const index: FieldPath<ContractProfile> = 'tags.0';
		// @ts-expect-error dates are leaves
		const method: FieldPath<ContractProfile> = 'born.getTime';
		// @ts-expect-error trailing dot
		const trailing: FieldPath<ContractProfile> = 'address.';

		expect([index, method, trailing]).toHaveLength(3);
	});

	it('treats tuples and functions as leaves', () => {
		type Values = {
			pair: [string, number];
			onPick: () => void;
			debounced: { (): void; cancel(): void };
		};
		const path: FieldPath<Values> = 'debounced';

		expectTypeOf<FieldPath<Values>>().toEqualTypeOf<'pair' | 'onPick' | 'debounced'>();
		expect(path).toBe('debounced');
	});

	it('lists the key at the depth cap as a leaf', () => {
		const capped: FieldPath<TreeNode> = 'child.child.child.child.child.child';

		expectTypeOf<'child.child.child.child.child.child'>().toExtend<FieldPath<TreeNode>>();
		expect(capped).toBe('child.child.child.child.child.child');
	});

	it('is string for values with a string index signature', () => {
		const path: FieldPath<Record<string, number>> = 'any.key';

		expectTypeOf<FieldPath<Record<string, number>>>().toEqualTypeOf<string>();
		expect(path).toBe('any.key');
	});

	it('allows any sub path below a member typed any', () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		type Values = { meta: any; name: string };
		const path: FieldPath<Values> = 'meta.deep.key';

		expectTypeOf<FieldPath<Values>>().toEqualTypeOf<'name' | 'meta' | `meta.${string}`>();
		expect(path).toBe('meta.deep.key');
	});
});

describe('FieldPathValue contract rows', () => {
	it('types arrays and nested values without adding undefined', () => {
		const tags: FieldPathValue<ContractProfile, 'tags'> = ['a'];

		expectTypeOf<FieldPathValue<ContractProfile, 'tags'>>().toEqualTypeOf<string[]>();
		expectTypeOf<FieldPathValue<ContractProfile, 'address.city'>>().toEqualTypeOf<string>();
		expectTypeOf<FieldPathValue<ContractProfile, 'born'>>().toEqualTypeOf<Date | undefined>();
		expectTypeOf<FieldPathValue<{ a?: { b: string } | null }, 'a.b'>>().toEqualTypeOf<string>();
		expect(tags).toEqual(['a']);
	});

	it('is never for a path that does not exist', () => {
		const paths: string[] = [];

		expectTypeOf<FieldPathValue<ContractProfile, 'address.town'>>().toBeNever();
		expectTypeOf<FieldPathValue<ContractProfile, 'tags.0'>>().toBeNever();
		expect(paths).toHaveLength(0);
	});
});

describe('getForm typing', () => {
	it('returns the form API typed by the given form values', () => {
		expectTypeOf(getForm<Profile>).returns.toEqualTypeOf<TypedFormApi<Profile>>();
		expectTypeOf(getForm).returns.toEqualTypeOf<TypedFormApi<AnyFormValues>>();
		expect(getForm).toBeTypeOf('function');
	});

	it('rejects a change of the wrong type on the typed helper result', () => {
		// Never called: getForm needs a component; only svelte-check evaluates this body.
		const typedUse = (): void => {
			const form = getForm<Profile>();
			form.change('address.city', 'Ohrid');
			// @ts-expect-error a number is not a city
			form.change('address.city', 5);
			// @ts-expect-error not a path
			form.blur('address.town');
			// @ts-expect-error not a path
			form.focus('firstname');
			// @ts-expect-error not a path
			form.resetFieldState('');
			expectTypeOf(form.getFieldState('age')).toEqualTypeOf<FieldState<number> | undefined>();
		};
		const untypedUse = (): void => {
			const form = getForm();
			form.change('anything.goes', 5);
		};

		expect([typedUse, untypedUse]).toHaveLength(2);
	});
});

describe('runes entry', () => {
	it('exports the same getForm and types as the root entry', () => {
		expectTypeOf<runes.FieldPath<Profile>>().toEqualTypeOf<FieldPath<Profile>>();
		expectTypeOf<runes.TypedFormApi<Profile>>().toEqualTypeOf<TypedFormApi<Profile>>();
		expectTypeOf<runes.FieldRenderProps<'age', number>>().toEqualTypeOf<
			FieldRenderProps<'age', number>
		>();
		expect(runes.getForm).toBe(getForm);
	});
});

// Boundaries beyond the contract table: shapes a real form value type takes.
interface Checkout {
	payment: { kind: 'card'; number: string } | { kind: 'iban'; iban: string };
	extra: Record<string, string>;
	labels: readonly string[];
	note?: string;
	raw: unknown;
}

describe('FieldPath and FieldPathValue on union, index-signature and readonly members', () => {
	it('types the value of a path that exists in only one member of a union', () => {
		const number: FieldPathValue<Checkout, 'payment.number'> = '4111';

		expectTypeOf<FieldPathValue<Checkout, 'payment.number'>>().toEqualTypeOf<string>();
		expectTypeOf<FieldPathValue<Checkout, 'payment.iban'>>().toEqualTypeOf<string>();
		expectTypeOf<FieldPathValue<Checkout, 'payment.kind'>>().toEqualTypeOf<'card' | 'iban'>();
		expect(number).toBe('4111');
	});

	it('lets change accept a value for every path FieldPath lists on a union member', () => {
		const calls: unknown[] = [];
		const change: TypedFormApi<Checkout>['change'] = (name, value) => {
			calls.push([name, value]);
		};

		change('payment.number', '4111');
		change('payment.kind', 'card');
		// @ts-expect-error not one of the kinds
		change('payment.kind', 'cash');

		expect(calls).toHaveLength(3);
	});

	it('enters an index signature below a typed key', () => {
		const path: FieldPath<Checkout> = 'extra.anything';

		expectTypeOf<FieldPathValue<Checkout, 'extra.anything'>>().toEqualTypeOf<string>();
		expect(path).toBe('extra.anything');
	});

	it('treats readonly arrays, optional primitives and unknown as leaves', () => {
		// @ts-expect-error readonly arrays are leaves
		const length: FieldPath<Checkout> = 'labels.length';
		// @ts-expect-error strings are leaves
		const method: FieldPath<Checkout> = 'note.length';

		expectTypeOf<'labels' | 'note' | 'raw'>().toExtend<FieldPath<Checkout>>();
		expectTypeOf<FieldPathValue<Checkout, 'note'>>().toEqualTypeOf<string | undefined>();
		expect([length, method]).toHaveLength(2);
	});
});
