// The Form, Field, FormSpy and Typed form access scenarios of 04-requirements.md against the root
// entry installed from the packed tarball. compat/run.mjs runs this file on every matrix row and, on
// Svelte 5, once per consumer mode; COMPAT_MODE names the mode.
import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import * as root from 'svelte-final-form-ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
	live,
	renderCount,
	reset,
	validateStore
} from './setup.js';

const OUTSIDE_FORM_MESSAGE =
	'getForm() must be called inside a <Form> component, during component initialisation';
const MIN_AGE_ERROR = 'Must be 18 or older';
const minAge = (value) => (value < 18 ? MIN_AGE_ERROR : undefined);

const json = (testId) => JSON.parse(screen.getByTestId(testId).textContent ?? '');
const input = (name) => screen.getByLabelText(name);
const change = (name, value) => fireEvent.input(input(name), { target: { value } });
const submit = () => fireEvent.submit(screen.getByTestId('form'));

/** Renders the profile form with the given config and returns the form API its content holds. */
function mountProfile(overrides = {}) {
	Object.assign(config, overrides);
	if ('validate' in overrides) validateStore.set(overrides.validate);
	const view = render(Profile);
	return { form: forms[0], view };
}

function deferred() {
	let resolve = () => undefined;
	const promise = new Promise((r) => (resolve = r));
	return { promise, resolve };
}

beforeEach(reset);

describe('consumer mode', () => {
	it(`compiles this consumer in ${process.env.COMPAT_MODE} mode`, async () => {
		render(Mode);

		await fireEvent.click(screen.getByRole('button', { name: 'Count' }));

		expect(['runes', 'non-runes']).toContain(process.env.COMPAT_MODE);
		expect(screen.getByTestId('mode-count').textContent).toBe(
			process.env.COMPAT_MODE === 'runes' ? '0' : '1'
		);
	});
});

describe('the root entry', () => {
	it('exports Form, Field, FormSpy and getForm', () => {
		const exported = [root.Form, root.Field, root.FormSpy, root.getForm];

		expect(exported.map((value) => typeof value)).toEqual([
			'function',
			'function',
			'function',
			'function'
		]);
	});
});

describe('Form', () => {
	it('submitting calls onSubmit with the current values', async () => {
		const onSubmit = vi.fn();
		mountProfile({ onSubmit, initialValues: { firstName: 'Ana', age: 30 } });
		await change('firstName', 'Marija');

		await submit();

		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit.mock.calls[0][0]).toEqual({ firstName: 'Marija', age: 30 });
	});

	it('initial values prefill the form state', () => {
		mountProfile({ initialValues: { firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } } });

		const state = json('form-state');

		expect(state).toMatchObject({
			values: { firstName: 'Ana', address: { city: 'Skopje' } },
			pristine: true
		});
	});

	it('form-level validation errors block submission', async () => {
		const onSubmit = vi.fn();
		mountProfile({
			onSubmit,
			validate: (values) => (values.firstName ? {} : { firstName: 'Required' })
		});

		await submit();

		expect(onSubmit).not.toHaveBeenCalled();
		expect(json('form-state').valid).toBe(false);
		expect(json('meta:firstName')).toMatchObject({ error: 'Required', touched: true });
	});

	it('a new validate prop applies to the mounted form', async () => {
		const { form } = mountProfile({ initialValues: { firstName: 'Ana' } });
		expect(form.getState().valid).toBe(true);

		validateStore.set((values) => (values.firstName ? {} : { firstName: 'Required' }));
		await tick();
		form.change('firstName', '');

		expect(form.getState().valid).toBe(false);
	});

	it('submission errors returned by onSubmit reach the form state', async () => {
		mountProfile({ onSubmit: () => ({ firstName: 'Taken' }) });

		await submit();

		expect(json('form-state')).toMatchObject({ submitFailed: true, hasSubmitErrors: true });
		expect(json('meta:firstName').submitError).toBe('Taken');
	});

	it('the submitting flag is true while an asynchronous onSubmit is pending', async () => {
		const pending = deferred();
		mountProfile({ onSubmit: () => pending.promise });

		await submit();
		const whilePending = json('form-state').submitting;
		pending.resolve(undefined);
		await pending.promise;
		await tick();

		expect(whilePending).toBe(true);
		expect(json('form-state')).toMatchObject({ submitting: false, submitSucceeded: true });
	});

	it('the form subscription limits the state exposed to the content', () => {
		mountProfile({ initialValues: { firstName: 'Ana' }, formSubscription: { submitting: true } });

		const state = json('form-state');

		expect(state.submitting).toBe(false);
		expect(state.values).toBeUndefined();
	});

	it('the content receives the form API', async () => {
		mountProfile();

		await fireEvent.click(screen.getByRole('button', { name: 'Change through the Form content' }));

		expect(json('form-state')).toMatchObject({ values: { firstName: 'Elena' } });
	});

	it('a missing onSubmit is reported when the form is created', () => {
		const mount = () => render(MissingOnSubmit);

		expect(mount).toThrow('No onSubmit function specified');
	});

	it('unmounting the form removes its subscriptions', async () => {
		const { form, view } = mountProfile({ spySubscription: { values: true } });
		const counted = ['form', 'spy', 'firstName', 'age', 'address.city'];
		view.unmount();
		const rendersAtUnmount = counted.map(renderCount);

		form.change('firstName', 'Elena');
		await tick();

		expect(rendersAtUnmount.every((count) => count >= 1)).toBe(true);
		expect(form.getRegisteredFields()).toEqual([]);
		expect(counted.map(renderCount)).toEqual(rendersAtUnmount);
	});

	it('unmounting the form ends the form spy subscription', () => {
		// The spy is the only subscriber after Probe; render counts cannot see a leaked listener,
		// because a destroyed component ignores its own state updates.
		const { view } = mountProfile({ spySubscription: { values: true } });
		const whileMounted = live.subscriptions;

		view.unmount();

		expect(whileMounted).toBe(1);
		expect(live.subscriptions).toBe(0);
	});
});

describe('Field', () => {
	it('a top-level field receives its input props', () => {
		mountProfile({ initialValues: { firstName: 'Ana' } });

		const props = json('input:firstName');

		expect(props).toEqual({
			name: 'firstName',
			value: 'Ana',
			handlers: ['function', 'function', 'function']
		});
	});

	it('a nested field path reads and writes the nested value', async () => {
		const { form } = mountProfile({ initialValues: { address: { city: 'Skopje', zip: '1000' } } });

		await change('address.city', 'Bitola');

		expect(json('input:address.city').value).toBe('Bitola');
		expect(form.getState().values.address).toEqual({ city: 'Bitola', zip: '1000' });
	});

	it('changing a field updates the form values', async () => {
		mountProfile();

		await change('firstName', 'Petar');

		expect(json('form-state')).toMatchObject({ values: { firstName: 'Petar' } });
		expect(json('meta:firstName').dirty).toBe(true);
	});

	it('blurring a field marks it touched', async () => {
		mountProfile();
		const touchedBefore = json('meta:firstName').touched;

		await fireEvent.focus(input('firstName'));
		await fireEvent.blur(input('firstName'));

		expect(touchedBefore).toBe(false);
		expect(json('meta:firstName').touched).toBe(true);
	});

	it('a field-level validator error appears in the field meta', async () => {
		mountProfile({ ageValidator: minAge });

		await change('age', '17');

		expect(json('meta:age').error).toBe(MIN_AGE_ERROR);
		expect(json('form-state').valid).toBe(false);
	});

	it.each([
		{ age: '17', error: MIN_AGE_ERROR },
		{ age: '18', error: undefined }
	])('the field validator boundary on age: $age', async ({ age, error }) => {
		mountProfile({ ageValidator: minAge });

		await change('age', age);

		expect(json('meta:age').error).toBe(error);
	});

	it("a form-level error for a nested path appears in that field's meta", () => {
		mountProfile({
			initialValues: { address: { city: '', zip: '1000' } },
			validate: (values) => (values.address?.city ? {} : { address: { city: 'Required' } })
		});

		const meta = json('meta:address.city');

		expect(meta.error).toBe('Required');
	});

	it('the field subscription limits the meta exposed to the content', () => {
		mountProfile({ initialValues: { firstName: 'Ana' }, fieldSubscription: { value: true } });

		const meta = json('meta:firstName');

		expect(json('input:firstName').value).toBe('Ana');
		expect(meta.touched).toBeUndefined();
		expect(meta.error).toBeUndefined();
	});

	it("changing one field does not re-render another field's content", async () => {
		fields.set(['firstName', 'age']);
		mountProfile({ fieldSubscription: { value: true } });
		const ageRendersBefore = renderCount('age');

		await change('firstName', 'Petar');

		expect(ageRendersBefore).toBe(1);
		expect(json('input:firstName').value).toBe('Petar');
		expect(renderCount('age')).toBe(1);
	});

	it('unmounting a field unregisters it from the form', async () => {
		fields.set(['firstName', 'age']);
		const { form } = mountProfile();

		fields.set(['firstName']);
		await tick();

		expect(form.getRegisteredFields()).toEqual(['firstName']);
	});

	it('changing the name of a mounted field re-registers it under the new name', async () => {
		render(RenameField);

		fieldName.set('address.city');
		await tick();

		expect(json('input:field')).toEqual({ name: 'address.city', value: 'Skopje' });
		expect(forms[0].getRegisteredFields()).toEqual(['address.city']);
	});
});

describe('FormSpy', () => {
	it('the form spy shows the subscribed state', async () => {
		mountProfile({ spySubscription: { values: true } });

		await change('firstName', 'Petar');

		expect(json('spy-state')).toEqual({ values: { firstName: 'Petar' } });
	});

	it('the form spy re-renders when subscribed state changes', async () => {
		mountProfile({
			initialValues: { firstName: 'Ana', age: 30 },
			spySubscription: { dirty: true }
		});
		const rendersBefore = renderCount('spy');

		await change('firstName', 'Petar');

		expect(rendersBefore).toBe(1);
		expect(renderCount('spy')).toBe(2);
		expect(json('spy-state')).toEqual({ dirty: true });
	});

	it('the form spy does not re-render when only unsubscribed state changes', async () => {
		mountProfile({ spySubscription: { submitting: true } });
		const rendersBefore = renderCount('spy');

		await change('firstName', 'Petar');

		expect(rendersBefore).toBe(1);
		expect(renderCount('spy')).toBe(1);
	});

	it('the form spy does not re-render when subscribed state keeps its value', async () => {
		mountProfile({
			initialValues: { firstName: 'Ana', age: 30 },
			spySubscription: { dirty: true }
		});
		await change('firstName', 'Petar');
		const rendersBefore = renderCount('spy');

		await change('age', '31');

		expect(rendersBefore).toBe(2);
		expect(renderCount('spy')).toBe(2);
	});
});

describe('Typed form access', () => {
	it('a nested component obtains the form API of its enclosing form', async () => {
		render(NestedAccess);

		await fireEvent.click(screen.getByRole('button', { name: 'Change through getForm' }));

		expect(json('form-state')).toMatchObject({ values: { firstName: 'Elena' } });
	});

	it('the helper returns the innermost form when forms are nested', () => {
		render(NestedForms);

		const values = forms.map((form) => form.getState().values);

		expect(values).toEqual([{ firstName: 'Inner' }]);
	});

	it.each(['getForm', 'Field', 'FormSpy'])(
		'calling the helper outside a form fails with a clear error: %s',
		(outside) => {
			config.outside = outside;

			const mount = () => render(OutsideForm);

			expect(mount).toThrow(OUTSIDE_FORM_MESSAGE);
		}
	);
});
