// Unit tester: boundaries of the snippet scenarios that runes.test.ts leaves out, run against the
// packed svelte-final-form-ts/runes on every Svelte 5 row in both modes and again under step 6's
// boolean compilerOptions.runes true.
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as api from 'svelte-final-form-ts/runes';
import DerivedLabel from './DerivedLabel.svelte';
import Profile from './Profile.svelte';
import RenameField from './RenameField.svelte';
import StateProxy from './StateProxy.svelte';
import { config, fieldName, fields, forms, reset } from './setup.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const json = (testId: string): any => JSON.parse(screen.getByTestId(testId).textContent ?? '');

/** Dispatches a cancelable submit on the fixture's form element; true when the default was prevented. */
function submitPreventsDefault(): boolean {
	const event = new Event('submit', { bubbles: true, cancelable: true });
	screen.getByTestId('form').dispatchEvent(event);
	return event.defaultPrevented;
}

beforeEach(reset);
afterEach(cleanup);

describe('svelte-final-form-ts/runes (requirements change 5)', () => {
	test('exports exactly Form, Field, FormSpy and getForm at runtime', () => {
		expect(Object.keys(api).sort()).toEqual(['Field', 'Form', 'FormSpy', 'getForm']);
	});
});

describe('handleSubmit from the snippet', () => {
	test('prevents the browser submit when the form is valid', () => {
		const onSubmit = vi.fn();
		config.onSubmit = onSubmit;
		render(Profile);
		expect(submitPreventsDefault()).toBe(true);
		expect(onSubmit).toHaveBeenCalledTimes(1);
	});

	test('prevents the browser submit when validation blocks submission', () => {
		const onSubmit = vi.fn();
		Object.assign(config, { onSubmit, validate: () => ({ firstName: 'Required' }) });
		render(Profile);
		expect(submitPreventsDefault()).toBe(true);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});

describe('Form with no initial values', () => {
	test('exposes empty values and empty field values', async () => {
		render(Profile);
		expect(json('form-state').values).toEqual({});
		expect(json('field-firstName').value).toBeUndefined();
		expect(json('field-address.city').value).toBeUndefined();
		await fireEvent.input(screen.getByTestId('input-address.city'), { target: { value: 'Ohrid' } });
		expect(json('form-state').values).toEqual({ address: { city: 'Ohrid' } });
	});
});

describe('Field registration', () => {
	test('a field renamed and renamed back is registered once, under its original name', async () => {
		render(RenameField);
		fieldName.set('address.city');
		await tick();
		fieldName.set('firstName');
		await tick();
		expect(json('field')).toEqual({ name: 'firstName', value: 'Ana' });
		expect(forms[0].getRegisteredFields()).toEqual(['firstName']);
	});

	test('unmounting every field leaves no registered field', async () => {
		render(Profile);
		expect(forms[0].getRegisteredFields()).toHaveLength(3);
		fields.set([]);
		await tick();
		expect(forms[0].getRegisteredFields()).toEqual([]);
	});
});

describe('Svelte 5 consumer scenarios with snippet content', () => {
	test('A runes-mode consumer can pass state proxies as initial values', async () => {
		const onSubmit = vi.fn();
		config.onSubmit = onSubmit;
		render(StateProxy);
		await fireEvent.input(screen.getByTestId('input-address.city'), { target: { value: 'Ohrid' } });
		await fireEvent.submit(screen.getByTestId('form'));
		expect(onSubmit).toHaveBeenCalledTimes(1);
		expect(onSubmit.mock.calls[0][0]).toEqual({
			firstName: 'Ana',
			address: { city: 'Ohrid', zip: '1000' }
		});
		expect(json('initial').address.city).toBe('Skopje');
	});

	test('A runes-mode consumer reacts to form state with derived values', async () => {
		let finish: () => void = () => undefined;
		config.onSubmit = () => new Promise<void>((resolve) => (finish = resolve));
		render(DerivedLabel);
		expect(screen.getByTestId('label').textContent).toBe('Save');
		await fireEvent.submit(screen.getByTestId('form'));
		expect(screen.getByTestId('label').textContent).toBe('Saving');
		finish();
		await new Promise((resolve) => setTimeout(resolve, 0));
		await tick();
		expect(screen.getByTestId('label').textContent).toBe('Save');
	});
});
