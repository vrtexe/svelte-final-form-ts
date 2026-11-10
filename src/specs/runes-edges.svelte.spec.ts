// Runes-set boundaries the shared suite and runes.svelte.spec.ts do not reach: a Field and FormSpy bound
// through the form prop with no enclosing Form (and their cleanup), validators removed after mount,
// and handleSubmit cancelling the browser submit.
import type { FormState } from 'final-form';
import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import StandaloneBinding from '../fixtures/runes/StandaloneBinding.svelte';
import Wiring from '../fixtures/runes/Wiring.svelte';
import { createTypedForm } from '../lib/core/form.js';
import type { TypedFormApi } from '../lib/runes/index.js';
import type { Profile } from './suite.js';

function textOf(testId: string): string | null | undefined {
	flushSync();
	return document.querySelector(`[data-testid="${testId}"]`)?.textContent;
}

/** A standalone form whose subscribe counts every listener call made after `arm()`. */
function countingForm() {
	const form = createTypedForm<Profile>({
		onSubmit: () => undefined,
		initialValues: { firstName: 'Ana' }
	});
	const calls = { count: 0, armed: false };
	const subscribe = form.subscribe.bind(form);
	form.subscribe = (listener, subscription) =>
		subscribe((state: FormState<Profile, Partial<Profile>>) => {
			if (calls.armed) calls.count++;
			listener(state);
		}, subscription);
	return { form, calls };
}

describe('runes Field and FormSpy given a form prop and no enclosing Form', () => {
	it('render the given form without asking getForm for an enclosing one', async () => {
		const { form } = countingForm();

		await render(StandaloneBinding, { form });

		expect(textOf('field-value')).toBe('Ana');
		expect(textOf('spy-first-name')).toBe('Ana');
		expect(form.getRegisteredFields()).toEqual(['firstName']);
	});

	it('write through the field input and the spy form API to the given form', async () => {
		const { form } = countingForm();
		await render(StandaloneBinding, { form });

		await page.getByRole('button', { name: 'Type' }).click();
		expect(form.getState().values.firstName).toBe('Typed');
		expect(textOf('spy-first-name')).toBe('Typed');

		await page.getByRole('button', { name: 'Spy change' }).click();
		expect(form.getState().values.firstName).toBe('Spy');
		expect(textOf('field-value')).toBe('Spy');
	});

	it('leave no registration and no subscription on the given form after unmounting', async () => {
		const { form, calls } = countingForm();
		const screen = await render(StandaloneBinding, { form });
		calls.armed = true;
		form.change('firstName', 'Mounted');
		const callsWhileMounted = calls.count;
		await screen.unmount();
		calls.count = 0;

		form.change('firstName', 'Unmounted');

		expect(callsWhileMounted).toBeGreaterThan(0);
		expect(calls.count).toBe(0);
		expect(form.getRegisteredFields()).toEqual([]);
	});
});

describe('runes Form and Field validators removed after mount', () => {
	async function mount(props: Partial<Parameters<typeof Wiring>[1]> = {}) {
		let form: TypedFormApi<Profile> | undefined;
		const screen = await render(Wiring, {
			onSubmit: () => undefined,
			...props,
			onForm: (received: TypedFormApi<Profile>) => (form = received)
		});
		if (!form) throw new Error('the fixture handed out no form API');
		return { form, screen };
	}

	const tooYoung = (values: Partial<Profile>) =>
		values.age !== undefined && values.age < 18 ? { age: 'Too young' } : {};

	// final-form skips validation, and keeps the old errors, once no validation rule is left at all
	// (runValidation's "no validation rules" early return), so a passing rule stays registered.
	const firstNameValidator = () => undefined;

	it('stops applying a form validate function removed after mount', async () => {
		const initialValues = { age: 30 };
		const { form, screen } = await mount({
			firstNameValidator,
			formProps: { initialValues, validate: tooYoung }
		});
		form.change('age', 17);
		expect(form.getState().valid).toBe(false);

		await screen.rerender({ formProps: { initialValues } });
		form.change('age', 16);

		expect(form.getState().valid).toBe(true);
	});

	it('stops applying a field validator removed after mount', async () => {
		const { form, screen } = await mount({
			firstNameValidator,
			formProps: { initialValues: { age: 30 } },
			ageValidator: (age) => (age !== undefined && age < 18 ? 'Too young' : undefined)
		});
		form.change('age', 17);
		expect(form.getFieldState('age')?.error).toBe('Too young');

		await screen.rerender({ ageValidator: undefined });
		form.change('age', 16);

		expect(form.getFieldState('age')?.error).toBeUndefined();
		expect(form.getState().valid).toBe(true);
	});
});

describe('runes Form handleSubmit', () => {
	it('cancels the browser submit of the form element it is bound to', async () => {
		let submitted = 0;
		await render(Wiring, {
			onSubmit: () => void submitted++,
			onForm: () => undefined
		});
		const element = document.querySelector('form');
		if (!element) throw new Error('the fixture renders no form element');

		const notCancelled = element.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));

		expect(notCancelled).toBe(false);
		await expect.poll(() => submitted).toBe(1);
	});
});
