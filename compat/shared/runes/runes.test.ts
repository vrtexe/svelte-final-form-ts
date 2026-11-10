// The Form, Field, FormSpy and Typed form access scenarios of 04-requirements.md with snippet
// content, run against svelte-final-form-ts/runes installed from the packed tarball
// (05-architecture.md, requirements changes 3 to 5). Step 6 of run.mjs runs this file again under a
// boolean compilerOptions.runes true.
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as api from 'svelte-final-form-ts/runes';
import MissingOnSubmit from './MissingOnSubmit.svelte';
import Mode from './Mode.svelte';
import NestedAccess from './NestedAccess.svelte';
import NestedForms from './NestedForms.svelte';
import OutsideForm from './OutsideForm.svelte';
import Profile from './Profile.svelte';
import RenameField from './RenameField.svelte';
import {
	config,
	fieldName,
	fields,
	forms,
	renderCount,
	reset,
	validateStore
} from './setup.js';

const OUTSIDE_FORM = 'getForm() must be called inside a <Form> component';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const json = (testId: string): any => JSON.parse(screen.getByTestId(testId).textContent ?? '');
const text = (testId: string): string => screen.getByTestId(testId).textContent ?? '';
const type = (testId: string, value: string) =>
	fireEvent.input(screen.getByTestId(testId), { target: { value } });
const submit = () => fireEvent.submit(screen.getByTestId('form'));
const settle = async () => {
	await new Promise((resolve) => setTimeout(resolve, 0));
	await tick();
};

beforeEach(reset);
afterEach(cleanup);

function mountProfile(): ReturnType<typeof render> {
	validateStore.set(config.validate);
	return render(Profile);
}

// Guards the harness itself: COMPAT_RUNES=1 (the function form, or step 6's boolean) must really
// compile a consumer file that uses no runes in runes mode; unset leaves Svelte's automatic mode.
test(`A consumer file without runes compiles in ${process.env.COMPAT_RUNES === '1' ? 'runes' : 'non-runes'} mode`, async () => {
	render(Mode);
	await fireEvent.click(screen.getByText('Count'));
	expect(text('mode-count')).toBe(process.env.COMPAT_RUNES === '1' ? '0' : '1');
});

test('Form, Field, FormSpy and getForm resolve from svelte-final-form-ts/runes', () => {
	expect([typeof api.Form, typeof api.Field, typeof api.FormSpy, typeof api.getForm]).toEqual([
		'function',
		'function',
		'function',
		'function'
	]);
});

describe('Form', () => {
	test('Submitting calls onSubmit with the current values', async () => {
		const onSubmit = vi.fn();
		Object.assign(config, { onSubmit, initialValues: { firstName: 'Ana', age: 30 } });
		mountProfile();
		await type('input-firstName', 'Marija');
		await submit();
		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit.mock.calls[0][0]).toEqual({ firstName: 'Marija', age: 30 });
	});

	test('Initial values prefill the form state', () => {
		config.initialValues = { firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } };
		mountProfile();
		const state = json('form-state');
		expect(state.values).toEqual({ firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } });
		expect(state.pristine).toBe(true);
	});

	test('Form-level validation errors block submission', async () => {
		const onSubmit = vi.fn();
		Object.assign(config, {
			onSubmit,
			validate: (values: { firstName?: string }) =>
				values.firstName ? {} : { firstName: 'Required' }
		});
		mountProfile();
		await submit();
		expect(onSubmit).not.toHaveBeenCalled();
		expect(json('form-state').valid).toBe(false);
		expect(json('field-firstName').meta).toMatchObject({ error: 'Required', touched: true });
	});

	test('A new validate prop applies to the mounted form', async () => {
		config.initialValues = { firstName: 'Ana' };
		mountProfile();
		const form = forms[0];
		expect(form.getState().valid).toBe(true);

		validateStore.set((values) => (values.firstName ? {} : { firstName: 'Required' }));
		await tick();
		form.change('firstName', '');

		expect(form.getState().valid).toBe(false);
	});

	test('Submission errors returned by onSubmit reach the form state', async () => {
		config.onSubmit = () => ({ firstName: 'Taken' });
		mountProfile();
		await submit();
		expect(json('form-state')).toMatchObject({ submitFailed: true, hasSubmitErrors: true });
		expect(json('field-firstName').meta.submitError).toBe('Taken');
	});

	test('The submitting flag is true while an asynchronous onSubmit is pending', async () => {
		let finish: () => void = () => undefined;
		config.onSubmit = () => new Promise<void>((resolve) => (finish = resolve));
		mountProfile();
		await submit();
		expect(json('form-state').submitting).toBe(true);
		finish();
		await settle();
		expect(json('form-state')).toMatchObject({ submitting: false, submitSucceeded: true });
	});

	test('The form subscription limits the state exposed to the content', () => {
		config.formSubscription = { submitting: true };
		mountProfile();
		const state = json('form-state');
		expect(state.submitting).toBeDefined();
		expect(state.values).toBeUndefined();
	});

	test('The content receives the form API', async () => {
		mountProfile();
		await fireEvent.click(screen.getByText('Change through the Form content'));
		expect(json('form-state').values.firstName).toBe('Elena');
	});

	test('A missing onSubmit is reported when the form is created', () => {
		expect(() => render(MissingOnSubmit)).toThrow('No onSubmit function specified');
	});

	test('Unmounting the form removes its subscriptions', () => {
		const { unmount } = mountProfile();
		const retained = forms[0];
		const before = ['firstName', 'age', 'spy'].map(renderCount);
		unmount();
		retained.change('firstName', 'Petar');
		retained.change('age', 31);
		expect(['firstName', 'age', 'spy'].map(renderCount)).toEqual(before);
		expect(retained.getRegisteredFields()).toEqual([]);
	});
});

describe('Field', () => {
	test('A top-level field receives its input props', () => {
		config.initialValues = { firstName: 'Ana' };
		mountProfile();
		expect(json('field-firstName')).toMatchObject({
			name: 'firstName',
			value: 'Ana',
			handlers: ['function', 'function', 'function']
		});
	});

	test('A nested field path reads and writes the nested value', async () => {
		config.initialValues = { address: { city: 'Skopje', zip: '1000' } };
		mountProfile();
		await type('input-address.city', 'Bitola');
		expect(json('field-address.city').value).toBe('Bitola');
		expect(json('form-state').values.address).toEqual({ city: 'Bitola', zip: '1000' });
	});

	test('Changing a field updates the form values', async () => {
		mountProfile();
		await type('input-firstName', 'Petar');
		expect(json('form-state').values.firstName).toBe('Petar');
		expect(json('field-firstName').meta.dirty).toBe(true);
	});

	test('Blurring a field marks it touched', async () => {
		mountProfile();
		expect(json('field-firstName').meta.touched).toBe(false);
		await fireEvent.focus(screen.getByTestId('input-firstName'));
		await fireEvent.blur(screen.getByTestId('input-firstName'));
		expect(json('field-firstName').meta.touched).toBe(true);
	});

	test('A field-level validator error appears in the field meta', async () => {
		config.ageValidator = (age) =>
			age !== undefined && age < 18 ? 'Must be 18 or older' : undefined;
		mountProfile();
		await type('input-age', '17');
		expect(json('field-age').meta.error).toBe('Must be 18 or older');
		expect(json('form-state').valid).toBe(false);
	});

	test.each([
		[17, 'Must be 18 or older'],
		[18, undefined]
	])('The field validator boundary on age: %i', async (age, error) => {
		config.ageValidator = (value) =>
			value !== undefined && value < 18 ? 'Must be 18 or older' : undefined;
		mountProfile();
		await type('input-age', String(age));
		expect(json('field-age').meta.error).toBe(error);
	});

	test("A form-level error for a nested path appears in that field's meta", () => {
		config.validate = (values) => (values.address?.city ? {} : { address: { city: 'Required' } });
		mountProfile();
		expect(json('field-address.city').meta.error).toBe('Required');
	});

	test('The field subscription limits the meta exposed to the content', () => {
		Object.assign(config, {
			initialValues: { firstName: 'Ana' },
			fieldSubscription: { value: true }
		});
		mountProfile();
		const field = json('field-firstName');
		expect(field.value).toBe('Ana');
		expect(field.meta.touched).toBeUndefined();
		expect(field.meta.error).toBeUndefined();
	});

	test("Changing one field does not re-render another field's content", async () => {
		config.fieldSubscription = { value: true };
		mountProfile();
		expect(text('renders-age')).toBe('1');
		await type('input-firstName', 'Petar');
		expect(text('renders-age')).toBe('1');
	});

	test('Unmounting a field unregisters it from the form', async () => {
		fields.set(['firstName', 'age']);
		mountProfile();
		fields.set(['firstName']);
		await tick();
		expect(forms[0].getRegisteredFields()).toEqual(['firstName']);
	});

	test('Changing the name of a mounted field re-registers it under the new name', async () => {
		render(RenameField);
		fieldName.set('address.city');
		await tick();
		expect(json('field')).toEqual({ name: 'address.city', value: 'Skopje' });
		expect(forms[0].getRegisteredFields()).not.toContain('firstName');
	});
});

describe('FormSpy', () => {
	test('The form spy shows the subscribed state', async () => {
		config.spySubscription = { values: true };
		mountProfile();
		await type('input-firstName', 'Petar');
		expect(json('spy-state').values.firstName).toBe('Petar');
	});

	test('The form spy re-renders when subscribed state changes', async () => {
		config.spySubscription = { dirty: true };
		mountProfile();
		expect(text('renders-spy')).toBe('1');
		await type('input-firstName', 'Petar');
		expect(text('renders-spy')).toBe('2');
		expect(json('spy-state').dirty).toBe(true);
	});

	test('The form spy does not re-render when only unsubscribed state changes', async () => {
		config.spySubscription = { submitting: true };
		mountProfile();
		expect(text('renders-spy')).toBe('1');
		await type('input-firstName', 'Petar');
		expect(text('renders-spy')).toBe('1');
	});

	test('The form spy does not re-render when subscribed state keeps its value', async () => {
		config.spySubscription = { dirty: true };
		mountProfile();
		await type('input-firstName', 'Petar');
		expect(text('renders-spy')).toBe('2');
		await type('input-age', '31');
		expect(text('renders-spy')).toBe('2');
	});
});

describe('Typed form access', () => {
	test('A nested component obtains the form API of its enclosing form', async () => {
		config.initialValues = { firstName: 'Ana' };
		render(NestedAccess);
		await fireEvent.click(screen.getByText('Change through getForm'));
		expect(json('form-state').values.firstName).toBe('Elena');
	});

	test('The helper returns the innermost form when forms are nested', () => {
		render(NestedForms);
		expect(forms).toHaveLength(1);
		expect(forms[0].getState().values.firstName).toBe('Inner');
	});

	test.each(['getForm', 'Field', 'FormSpy'] as const)(
		'Calling the helper outside a form fails with a clear error: %s',
		(outside) => {
			config.outside = outside;
			expect(() => render(OutsideForm)).toThrow(OUTSIDE_FORM);
		}
	);
});
