// Every optional prop of the legacy Form and Field reaches final-form, props kept current through
// setConfig apply after mount, and unmounting the Form ends its own subscription.
import type { FieldValidator, FormSubscription } from 'final-form';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ExplicitForm from '../fixtures/legacy/ExplicitForm.svelte';
import Wiring from '../fixtures/legacy/Wiring.svelte';
import type { TypedFormApi } from '../lib/index.js';
import type { Profile } from './suite.js';

type WiringProps = Parameters<typeof Wiring>[1];

async function mount(props: Partial<WiringProps> = {}) {
	let form: TypedFormApi<Profile> | undefined;
	const screen = await render(Wiring, {
		onSubmit: () => undefined,
		...props,
		onForm: (received: TypedFormApi<Profile>) => (form = received)
	});
	if (!form) throw new Error('the fixture handed out no form API');
	return { form, screen };
}

function readJson(testId: string): Record<string, unknown> {
	flushSync();
	const element = document.querySelector(`[data-testid="${testId}"]`);
	if (!element) throw new Error(`no element with test id ${testId}`);
	return JSON.parse(element.textContent ?? '');
}

const tooYoung = (values: Partial<Profile>) =>
	values.age !== undefined && values.age < 18 ? { age: 'Too young' } : {};

describe('legacy Form passes its props to final-form', () => {
	it('calls debug when the state changes', async () => {
		const debug = vi.fn();
		const { form } = await mount({ formProps: { debug } });
		debug.mockClear();

		form.change('age', 40);

		expect(debug).toHaveBeenCalled();
	});

	it('exposes the given mutators on the form API', async () => {
		const { form } = await mount({
			formProps: {
				mutators: {
					setAge: ([age], state, { changeValue }) => changeValue(state, 'age', () => age)
				}
			}
		});

		form.mutators.setAge(40);

		expect(form.getState().values.age).toBe(40);
	});

	it.each([
		{ validateOnBlur: true, valid: true },
		{ validateOnBlur: false, valid: false }
	])(
		'validates a change only on blur when validateOnBlur is $validateOnBlur',
		async ({ validateOnBlur, valid }) => {
			const { form } = await mount({
				formProps: { initialValues: { age: 30 }, validate: tooYoung, validateOnBlur }
			});

			form.change('age', 17);

			expect(form.getState().valid).toBe(valid);
		}
	);

	it.each([
		{ destroyOnUnregister: true, age: undefined },
		{ destroyOnUnregister: false, age: 30 }
	])(
		'keeps the value of an unmounted field unless destroyOnUnregister is $destroyOnUnregister',
		async ({ destroyOnUnregister, age }) => {
			const { form, screen } = await mount({
				formProps: { initialValues: { age: 30 }, destroyOnUnregister }
			});

			await screen.rerender({ showAge: false });

			expect(form.getState().values.age).toBe(age);
		}
	);

	it.each([
		{ keepDirtyOnReinitialize: true, age: 40 },
		{ keepDirtyOnReinitialize: false, age: 50 }
	])(
		'keeps a dirty value on initialize when keepDirtyOnReinitialize is $keepDirtyOnReinitialize',
		async ({ keepDirtyOnReinitialize, age }) => {
			const { form } = await mount({
				formProps: { initialValues: { age: 30 }, keepDirtyOnReinitialize }
			});
			form.change('age', 40);

			form.initialize({ age: 50 });

			expect(form.getState().values.age).toBe(age);
		}
	);

	it('submits to the onSubmit given after mount', async () => {
		const first = vi.fn(() => undefined);
		const second = vi.fn(() => undefined);
		const { form, screen } = await mount({ onSubmit: first });

		await screen.rerender({ onSubmit: second });
		await form.submit();

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('applies a destroyOnUnregister given after mount', async () => {
		const { form, screen } = await mount({ formProps: { initialValues: { age: 30 } } });

		await screen.rerender({ formProps: { initialValues: { age: 30 }, destroyOnUnregister: true } });
		await screen.rerender({ showAge: false });

		expect(form.getState().values.age).toBeUndefined();
	});

	it('applies a validateOnBlur given after mount', async () => {
		const formProps = { initialValues: { age: 30 }, validate: tooYoung };
		const { form, screen } = await mount({ formProps });

		await screen.rerender({ formProps: { ...formProps, validateOnBlur: true } });
		form.change('age', 17);

		expect(form.getState().valid).toBe(true);
	});

	it('applies a keepDirtyOnReinitialize given after mount', async () => {
		const formProps = { initialValues: { age: 30 } };
		const { form, screen } = await mount({ formProps });

		await screen.rerender({ formProps: { ...formProps, keepDirtyOnReinitialize: true } });
		form.change('age', 40);
		form.initialize({ age: 50 });

		expect(form.getState().values.age).toBe(40);
	});

	it('ignores an initialValues given after mount and keeps the dirty value', async () => {
		const { form, screen } = await mount({ formProps: { initialValues: { age: 30 } } });
		form.change('age', 40);

		await screen.rerender({ formProps: { initialValues: { age: 50 } } });

		expect(form.getState().values.age).toBe(40);
		expect(form.getState().initialValues?.age).toBe(30);
		expect(readJson('input:age').value).toBe(40);
	});

	it('calls validate once on mount', async () => {
		const validate = vi.fn(() => ({}));
		await mount({ formProps: { initialValues: { age: 30 }, validate } });

		expect(validate).toHaveBeenCalledTimes(1);
	});

	it('clears the errors when validate is removed after mount', async () => {
		const formProps = { initialValues: { age: 17 }, validate: tooYoung };
		const { form, screen } = await mount({ formProps });
		expect(form.getState().valid).toBe(false);

		await screen.rerender({ formProps: { initialValues: { age: 17 } } });

		expect(form.getState().valid).toBe(true);
		expect(form.getState().hasValidationErrors).toBe(false);
	});

	it('runs no subscriber of its own after it is unmounted', async () => {
		let armed = false;
		let reads = 0;
		// final-form reads the subscription of every live subscriber when it notifies.
		const subscription = new Proxy<FormSubscription>(
			{ values: true },
			{
				get(target, key, receiver) {
					if (armed) reads += 1;
					return Reflect.get(target, key, receiver);
				}
			}
		);
		const { form, screen } = await mount({ formSubscription: subscription });
		armed = true;
		form.change('firstName', 'Mounted');
		const readsWhileMounted = reads;
		await screen.unmount();
		reads = 0;

		form.change('firstName', 'Unmounted');

		expect(readsWhileMounted).toBeGreaterThan(0);
		expect(reads).toBe(0);
	});
});

describe('legacy Field passes its props to final-form', () => {
	it('starts from initialValue', async () => {
		await mount({ ageProps: { initialValue: 25 } });

		expect(readJson('input:age').value).toBe(25);
	});

	it('starts from defaultValue when the form has no value', async () => {
		await mount({ ageProps: { defaultValue: 5 } });

		expect(readJson('input:age').value).toBe(5);
	});

	it('compares with isEqual for pristine', async () => {
		const { form } = await mount({
			formProps: { initialValues: { age: 30 } },
			ageProps: { isEqual: () => true }
		});

		form.change('age', 40);

		expect(readJson('meta:age')).toMatchObject({ pristine: true, dirty: false });
	});

	it('blocks the submission when beforeSubmit returns false', async () => {
		const onSubmit = vi.fn(() => undefined);
		const { form } = await mount({ onSubmit, ageProps: { beforeSubmit: () => false } });

		await form.submit();

		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('calls afterSubmit after a successful submission', async () => {
		const afterSubmit = vi.fn();
		const { form } = await mount({ ageProps: { afterSubmit } });

		await form.submit();

		expect(afterSubmit).toHaveBeenCalledTimes(1);
	});

	it('publishes data in the meta', async () => {
		await mount({ ageProps: { data: { hint: 'years' } } });

		expect(readJson('meta:age').data).toEqual({ hint: 'years' });
	});

	it.each([
		{ validateFields: [] as string[], calls: 0 },
		{ validateFields: undefined, calls: 1 }
	])(
		'runs the other field validators on change only as validateFields $validateFields allows',
		async ({ validateFields, calls }) => {
			const firstNameValidator = vi.fn<FieldValidator<string>>(() => undefined);
			const { form } = await mount({ firstNameValidator, ageProps: { validateFields } });
			firstNameValidator.mockClear();

			form.change('age', 40);

			expect(firstNameValidator).toHaveBeenCalledTimes(calls);
		}
	);

	it('applies a validate prop given after mount without losing the field state', async () => {
		const { form, screen } = await mount({ formProps: { initialValues: { age: 30 } } });
		form.focus('age');
		form.blur('age');

		await screen.rerender({ ageValidator: () => 'Replaced' });
		form.change('age', 40);

		expect(readJson('meta:age')).toMatchObject({ error: 'Replaced', touched: true });
	});
});

describe('the form prop of the legacy Field and FormSpy', () => {
	it('binds them to the given form instead of the enclosing one', async () => {
		await render(ExplicitForm, {});

		expect(document.querySelector('[data-testid="field-value"]')?.textContent).toBe('Outer');
		expect(readJson('spy-values')).toEqual({ firstName: 'Outer' });
	});
});
