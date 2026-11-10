import { describe, expect, it, vi } from 'vitest';
import { FORM_ERROR, formSubscriptionItems } from 'final-form';
import type { FormState } from 'final-form';
import {
	allFormSubscription,
	createHandleSubmit,
	createTypedForm,
	setValidate,
	subscribeForm
} from '../lib/core/form.js';
import type { FormConfig } from '../lib/core/form.js';
import { registerTypedField } from '../lib/core/field.js';
import type { FieldRenderProps } from '../lib/core/types.js';

interface Profile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
}

type ProfileState = FormState<Profile, Partial<Profile>>;

function profileForm(config: Partial<FormConfig<Profile>> = {}) {
	return createTypedForm<Profile>({ onSubmit: () => undefined, ...config });
}

/** Subscribes with the given subscription and returns a getter for the latest published state. */
function watchForm(
	form: ReturnType<typeof profileForm>,
	subscription?: Parameters<typeof subscribeForm>[2]
): () => ProfileState | undefined {
	let latest: ProfileState | undefined;
	subscribeForm(form, (state) => (latest = state), subscription);
	return () => latest;
}

function watchFirstName(
	form: ReturnType<typeof profileForm>
): () => FieldRenderProps<'firstName', string> | undefined {
	let latest: FieldRenderProps<'firstName', string> | undefined;
	registerTypedField(form, 'firstName', (props) => (latest = props));
	return () => latest;
}

describe('allFormSubscription', () => {
	it('subscribes to every key final-form publishes', () => {
		const keys = Object.keys(allFormSubscription).filter((key) => allFormSubscription[key]);

		expect(keys.sort()).toEqual([...formSubscriptionItems].sort());
	});
});

describe('createTypedForm', () => {
	it('submits the current values to onSubmit', async () => {
		const onSubmit = vi.fn();
		const form = profileForm({ onSubmit, initialValues: { firstName: 'Ana', age: 30 } });
		form.change('firstName', 'Marija');

		await form.submit();

		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit.mock.calls[0][0]).toEqual({ firstName: 'Marija', age: 30 });
	});

	it('does not call onSubmit while form-level validation reports errors', async () => {
		const onSubmit = vi.fn();
		const form = profileForm({
			onSubmit,
			validate: (values) => (values.firstName ? {} : { firstName: 'Required' })
		});
		const state = watchForm(form);
		watchFirstName(form);

		await form.submit();

		expect(onSubmit).not.toHaveBeenCalled();
		expect(state()?.valid).toBe(false);
	});

	it('marks the invalid field touched with its form-level error when submission is blocked', async () => {
		const form = profileForm({
			validate: (values) => (values.firstName ? {} : { firstName: 'Required' })
		});
		const field = watchFirstName(form);

		await form.submit();

		expect(field()?.meta).toMatchObject({ error: 'Required', touched: true });
	});

	it('publishes the submission errors returned by onSubmit in the form state', async () => {
		const form = profileForm({ onSubmit: () => ({ firstName: 'Taken' }) });
		const state = watchForm(form);
		watchFirstName(form);

		await form.submit();

		expect(state()).toMatchObject({ submitFailed: true, hasSubmitErrors: true });
	});

	it('hands the submission error of a field to that field meta', async () => {
		const form = profileForm({ onSubmit: () => ({ firstName: 'Taken' }) });
		const field = watchFirstName(form);

		await form.submit();

		expect(field()?.meta.submitError).toBe('Taken');
	});

	it('reports submitting while an asynchronous onSubmit is pending', () => {
		const form = profileForm({ onSubmit: () => new Promise<undefined>(() => undefined) });
		const state = watchForm(form);

		void form.submit();

		expect(state()?.submitting).toBe(true);
	});

	it('reports submitSucceeded and no longer submitting once the onSubmit promise resolves', async () => {
		let resolve: (errors: undefined) => void = () => undefined;
		const form = profileForm({ onSubmit: () => new Promise<undefined>((r) => (resolve = r)) });
		const state = watchForm(form);
		const pending = form.submit();

		resolve(undefined);
		await pending;

		expect(state()).toMatchObject({ submitting: false, submitSucceeded: true });
	});

	it('fails with final-form error when onSubmit is missing', () => {
		// @ts-expect-error onSubmit is required; the scenario bypasses the type check.
		const create = () => createTypedForm<Profile>({ initialValues: { firstName: 'Ana' } });

		expect(create).toThrow('No onSubmit function specified');
	});
});

describe('subscribeForm', () => {
	it('publishes every key, values included, without a subscription', () => {
		const form = profileForm({ initialValues: { firstName: 'Ana' } });

		const state = watchForm(form);

		expect(state()).toMatchObject({ values: { firstName: 'Ana' }, pristine: true });
	});

	it('limits the published state to the subscribed keys', () => {
		const form = profileForm({ initialValues: { firstName: 'Ana' } });

		const state = watchForm(form, { submitting: true });

		expect(state()?.submitting).toBe(false);
		expect(state()?.values).toBeUndefined();
	});

	it('stops publishing after unsubscribing', () => {
		const form = profileForm();
		const listener = vi.fn();
		const unsubscribe = subscribeForm(form, listener, { values: true });
		listener.mockClear();

		unsubscribe();
		form.change('firstName', 'Elena');

		expect(listener).not.toHaveBeenCalled();
	});
});

describe('createHandleSubmit', () => {
	it('prevents the default action of the event exactly once', () => {
		const handleSubmit = createHandleSubmit(profileForm());
		const event = new Event('submit', { cancelable: true });
		const preventDefault = vi.spyOn(event, 'preventDefault');

		void handleSubmit(event);

		expect(preventDefault).toHaveBeenCalledTimes(1);
	});

	it('submits the form without an event', async () => {
		const onSubmit = vi.fn();
		const handleSubmit = createHandleSubmit(profileForm({ onSubmit }));

		await handleSubmit();

		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it('resolves to what form.submit resolves to', async () => {
		const form = profileForm({ onSubmit: async () => ({ firstName: 'Taken' }) });
		const handleSubmit = createHandleSubmit(form);

		const result = await handleSubmit();

		expect(result).toEqual({ firstName: 'Taken' });
	});
});

describe('setValidate', () => {
	it('clears the errors left by a removed validator', () => {
		const form = profileForm({ validate: () => ({ firstName: 'Required' }) });
		expect(form.getState().valid).toBe(false);

		setValidate(form, undefined);

		expect(form.getState().valid).toBe(true);
		expect(form.getState().hasValidationErrors).toBe(false);
	});

	it('keeps the errors of a field validator when the form validator is removed', () => {
		const form = profileForm();
		registerTypedField(form, 'age', () => undefined, undefined, {
			getValidator: () => (value) => (value < 18 ? 'Too young' : undefined)
		});
		form.change('age', 17);
		expect(form.getState().valid).toBe(false);

		setValidate(form, undefined);

		expect(form.getState().valid).toBe(false);
	});
});

describe('form core boundaries', () => {
	it('publishes the submission errors resolved by an asynchronous onSubmit', async () => {
		const form = profileForm({ onSubmit: async () => ({ firstName: 'Taken' }) });
		const state = watchForm(form);
		const field = watchFirstName(form);

		await form.submit();

		expect(state()).toMatchObject({ submitting: false, submitFailed: true, hasSubmitErrors: true });
		expect(field()?.meta.submitError).toBe('Taken');
	});

	it('turns a rejected asynchronous onSubmit into a submission error', async () => {
		const form = profileForm({ onSubmit: () => Promise.reject(new Error('network down')) });
		const state = watchForm(form);

		const result = await form.submit();

		expect(result).toEqual({ [FORM_ERROR]: 'network down' });
		expect(state()).toMatchObject({
			submitting: false,
			submitFailed: true,
			submitSucceeded: false,
			submitError: 'network down'
		});
	});

	it('turns a synchronous throw into a submission error and stays submittable', async () => {
		const onSubmit = vi.fn(() => {
			throw new Error('boom');
		});
		const form = profileForm({ onSubmit });
		const state = watchForm(form);

		await form.submit();

		expect(state()).toMatchObject({
			submitting: false,
			submitFailed: true,
			submitSucceeded: false
		});

		await form.submit();

		expect(onSubmit).toHaveBeenCalledTimes(2);
	});

	it('does not call onSubmit a second time while the first submission is pending', () => {
		const onSubmit = vi.fn(() => new Promise<undefined>(() => undefined));
		const handleSubmit = createHandleSubmit(profileForm({ onSubmit }));

		void handleSubmit();
		void handleSubmit();

		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	it('resolves handleSubmit to undefined and skips onSubmit when validation blocks it', async () => {
		const onSubmit = vi.fn();
		const form = profileForm({
			onSubmit,
			validate: (values) => (values.firstName ? {} : { firstName: 'Required' })
		});
		watchFirstName(form);
		const event = new Event('submit', { cancelable: true });

		const result = await createHandleSubmit(form)(event);

		expect(result).toBeUndefined();
		expect(event.defaultPrevented).toBe(true);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('submits once the blocking form-level error is fixed', async () => {
		const onSubmit = vi.fn();
		const form = profileForm({
			onSubmit,
			validate: (values) => (values.firstName ? {} : { firstName: 'Required' })
		});
		watchFirstName(form);
		await form.submit();

		form.change('firstName', 'Ana');
		await form.submit();

		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit.mock.calls[0][0]).toEqual({ firstName: 'Ana' });
	});

	it('calls the listener once right away on subscribe', () => {
		const listener = vi.fn();

		subscribeForm(profileForm(), listener);

		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('publishes none of the state keys with an empty subscription', () => {
		const form = profileForm({ initialValues: { firstName: 'Ana' } });

		const state = watchForm(form, {});

		expect(state()?.values).toBeUndefined();
		expect(state()?.submitting).toBeUndefined();
		expect(state()?.valid).toBeUndefined();
	});

	it('passes the remaining config keys through to final-form', () => {
		const validate = vi.fn(() => ({}));
		const form = profileForm({ validate, validateOnBlur: true });
		watchFirstName(form);
		validate.mockClear();

		form.change('firstName', 'Ana');

		expect(validate).not.toHaveBeenCalled();
	});
});
