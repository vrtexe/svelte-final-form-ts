import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ContextInsideForm from '../fixtures/ContextInsideForm.svelte';
import ContextProbe from '../fixtures/ContextProbe.svelte';
import GetFormOutside from '../fixtures/GetFormOutside.svelte';
import ProvideForms from '../fixtures/ProvideForms.svelte';
import { getForm, type AnyFormValues, type TypedFormApi } from '../lib/index.js';

const OUTSIDE_FORM_MESSAGE =
	'getForm() must be called inside a <Form> component, during component initialisation';

// getForm only hands back what was provided, so any object stands in for a form API.
const fakeForm = (label: string) => ({ label }) as unknown as TypedFormApi<AnyFormValues>;

const errorOf = (action: () => unknown): unknown => {
	try {
		action();
	} catch (error) {
		return error;
	}
	throw new Error('expected the action to throw');
};

describe('getForm', () => {
	it('fails with a clear error when no Form encloses the component', () => {
		const mount = (): unknown => render(GetFormOutside);

		expect(mount).toThrow(OUTSIDE_FORM_MESSAGE);
	});

	it('throws a plain Error with exactly the contract message', () => {
		const error = errorOf(() => render(ProvideForms, { forms: [], onForm: () => {} }));

		// Svelte's dev build appends the component stack on later lines.
		const firstLine = (error as Error).message.split('\n')[0];

		expect(Object.getPrototypeOf(error)).toBe(Error.prototype);
		expect(firstLine).toBe(OUTSIDE_FORM_MESSAGE);
	});

	it('returns the form provided by the enclosing component', () => {
		const form = fakeForm('only');
		const received: unknown[] = [];

		render(ProvideForms, { forms: [form], onForm: (found) => received.push(found) });

		expect(received).toEqual([form]);
		expect(received[0]).toBe(form);
	});

	it('returns the innermost form when forms are nested', () => {
		const outer = fakeForm('outer');
		const inner = fakeForm('inner');
		const received: unknown[] = [];

		render(ProvideForms, { forms: [outer, inner], onForm: (found) => received.push(found) });

		expect(received).toHaveLength(1);
		expect(received[0]).toBe(inner);
	});

	it('ignores contexts set under look-alike keys', () => {
		const mount = (): unknown =>
			render(ProvideForms, { forms: [fakeForm('decoy')], onForm: () => {}, decoy: true });

		expect(mount).toThrow(OUTSIDE_FORM_MESSAGE);
	});

	it('lets Svelte report a call outside component initialisation', () => {
		const error = errorOf(() => getForm());

		expect((error as Error).message).toContain('lifecycle_outside_component');
		expect((error as Error).message).not.toContain(OUTSIDE_FORM_MESSAGE);
	});
});

describe('FORM', () => {
	it('is the key getForm reads: getContext(FORM) is the form getForm returns', () => {
		const found: { context?: unknown; form?: unknown }[] = [];

		render(ContextInsideForm, { onFound: (value) => found.push(value) });

		expect(found).toHaveLength(1);
		expect(found[0].context).toBeDefined();
		expect(found[0].context).toBe(found[0].form);
	});

	it('is undefined outside a Form, without throwing', () => {
		const found: { context?: unknown }[] = [];

		render(ContextProbe, { onFound: (value) => found.push(value) });

		expect(found).toHaveLength(1);
		expect(found[0].context).toBeUndefined();
	});
});
