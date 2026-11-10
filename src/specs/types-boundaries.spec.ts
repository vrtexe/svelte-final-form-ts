// Type-level boundaries added by the unit tester (fix round 2). Like types.spec.ts, these are
// checked by svelte-check (npm run check); the runtime asserts satisfy requireAssertions.
import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
	FieldMeta,
	FieldPath,
	FieldPathValue,
	FieldRenderProps,
	FormRenderProps,
	FormSpyRenderProps,
	TypedFormApi
} from '../lib/index.js';

interface Profile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
}

// A form whose values are a discriminated union, for example a schema-derived type.
type Payment = { kind: 'card'; number: string } | { kind: 'iban'; iban: string };

describe('form values that are a union at the top level', () => {
	it('lists the paths of every member, as FieldPathValue resolves them', () => {
		const number: FieldPath<Payment> = 'number';

		expectTypeOf<FieldPathValue<Payment, 'number'>>().toEqualTypeOf<string>();
		expectTypeOf<FieldPath<Payment>>().toEqualTypeOf<'kind' | 'number' | 'iban'>();
		expect(number).toBe('number');
	});
});

describe('TypedFormApi.change without a value', () => {
	it('accepts a call with only the name, as final-form does to clear a field', () => {
		const calls: unknown[] = [];
		const change: TypedFormApi<Profile>['change'] = (name, value) => {
			calls.push([name, value]);
		};

		change('age');

		expect(calls).toEqual([['age', undefined]]);
	});
});

describe('render prop types', () => {
	it('types the form API in form and form spy render props by the form values', () => {
		expectTypeOf<FormRenderProps<Profile>['form']>().toEqualTypeOf<TypedFormApi<Profile>>();
		expectTypeOf<FormSpyRenderProps<Profile>['form']>().toEqualTypeOf<TypedFormApi<Profile>>();
		expect(true).toBe(true);
	});

	it('keeps the value and name in input, not in meta', () => {
		expectTypeOf<FieldMeta<number>>().not.toHaveProperty('value');
		expectTypeOf<FieldMeta<number>>().not.toHaveProperty('name');
		expectTypeOf<FieldMeta<number>>().toHaveProperty('touched');
		expectTypeOf<FieldRenderProps<'age', number>['input']['name']>().toEqualTypeOf<'age'>();
		expect(true).toBe(true);
	});
});
