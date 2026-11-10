// The component scenarios on the runes set (the /runes entry) from snippet consumers, every optional
// prop of the runes Form and Field reaching final-form, and a Form of one set serving the other set.
import type { FieldValidator, FormSubscription } from 'final-form';
import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DerivedLabel from '../fixtures/runes/DerivedLabel.svelte';
import DetachedConsumers from '../fixtures/runes/DetachedConsumers.svelte';
import ExplicitForm from '../fixtures/runes/ExplicitForm.svelte';
import MissingOnSubmit from '../fixtures/runes/MissingOnSubmit.svelte';
import MixedSets from '../fixtures/runes/MixedSets.svelte';
import NestedAccess from '../fixtures/runes/NestedAccess.svelte';
import NestedForms from '../fixtures/runes/NestedForms.svelte';
import OutsideForm from '../fixtures/runes/OutsideForm.svelte';
import Profile from '../fixtures/runes/Profile.svelte';
import RenameField from '../fixtures/runes/RenameField.svelte';
import StateProxy from '../fixtures/runes/StateProxy.svelte';
import Wiring from '../fixtures/runes/Wiring.svelte';
import type { TypedFormApi } from '../lib/runes/index.js';
import { componentSuite, type Profile as ProfileValues } from './suite.js';

componentSuite({
	name: 'runes set, snippet consumer',
	mode: 'runes',
	Profile,
	NestedAccess,
	NestedForms,
	OutsideForm,
	RenameField,
	MissingOnSubmit,
	StateProxy,
	DerivedLabel
});

type WiringProps = Parameters<typeof Wiring>[1];

async function mount(props: Partial<WiringProps> = {}) {
	let form: TypedFormApi<ProfileValues> | undefined;
	const screen = await render(Wiring, {
		onSubmit: () => undefined,
		...props,
		onForm: (received: TypedFormApi<ProfileValues>) => (form = received)
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

function textOf(testId: string): string | null | undefined {
	flushSync();
	return document.querySelector(`[data-testid="${testId}"]`)?.textContent;
}

const tooYoung = (values: Partial<ProfileValues>) =>
	values.age !== undefined && values.age < 18 ? { age: 'Too young' } : {};

describe('runes Form passes its props to final-form', () => {
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

	it('does not validate again when another kept prop changes and validate stays', async () => {
		const validate = vi.fn(tooYoung);
		const { screen } = await mount({ formProps: { initialValues: { age: 30 }, validate } });
		validate.mockClear();

		await screen.rerender({ onSubmit: () => undefined });

		expect(validate).not.toHaveBeenCalled();
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

describe('runes Field passes its props to final-form', () => {
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

describe('the form prop of the runes Field and FormSpy', () => {
	it('binds them to the given form instead of the enclosing one', async () => {
		await render(ExplicitForm, {});

		expect(textOf('field-value')).toBe('Outer');
		expect(readJson('spy-values')).toEqual({ firstName: 'Outer' });
	});
});

describe.each(['runes', 'legacy'] as const)('a %s Form serving the other set', (outer) => {
	it('provides its form API to getForm, Field and FormSpy of the other set', async () => {
		let form: TypedFormApi<ProfileValues> | undefined;
		let innerForm: TypedFormApi<ProfileValues> | undefined;

		await render(MixedSets, {
			outer,
			onForm: (received) => (form = received),
			onInnerForm: (received) => (innerForm = received)
		});

		expect(innerForm).toBe(form);
		expect(form?.getRegisteredFields()).toEqual(['firstName']);
		expect(textOf('field')).toBe('Ana');
		expect(textOf('spy')).toBe('Ana');
	});
});

// The runes lifecycle points of 05-architecture.md (Decision, "Runes entry"), checked directly.
describe('runes lifecycle rules of the Decision', () => {
	/** Mounts Wiring and counts every registerField call made by its fields. */
	async function mountCounting(props: Partial<WiringProps> = {}) {
		const names: string[] = [];
		let form: TypedFormApi<ProfileValues> | undefined;
		const screen = await render(Wiring, {
			onSubmit: () => undefined,
			...props,
			// FormHandout runs before the fields of the content register.
			onForm: (received: TypedFormApi<ProfileValues>) => {
				form = received;
				const { registerField } = received;
				received.registerField = (name, subscriber, subscription, config) => {
					names.push(String(name));
					return registerField(name, subscriber, subscription, config);
				};
			}
		});
		flushSync();
		if (!form) throw new Error('the fixture handed out no form API');
		return { form, screen, names };
	}

	it('a Form reads initialValues once and does not reinitialise when the prop changes', async () => {
		const { form, screen } = await mount({ formProps: { initialValues: { age: 30 } } });

		await screen.rerender({ formProps: { initialValues: { age: 50 } } });

		expect(form.getState().values.age).toBe(30);
		expect(form.getState().initialValues?.age).toBe(30);
		expect(readJson('input:age').value).toBe(30);
	});

	it('a Field registers exactly once on mount, so its first effect run does not register again', async () => {
		const { names } = await mountCounting();

		expect(names.sort()).toEqual(['age', 'firstName']);
	});

	it('a new field validator does not register the field again', async () => {
		const { screen, names } = await mountCounting({ ageValidator: () => undefined });
		names.length = 0;

		await screen.rerender({ ageValidator: () => 'Replaced' });
		flushSync();

		expect(names).toEqual([]);
	});

	it('a new subscription with other keys registers the field once more, under the same name', async () => {
		const { screen, names } = await mountCounting({ ageSubscription: { value: true } });
		names.length = 0;

		await screen.rerender({ ageSubscription: { value: true, error: true } });
		flushSync();

		expect(names).toEqual(['age']);
	});
});

describe('runes set boundaries', () => {
	const minAge: FieldValidator<number> = (value) => (value < 18 ? 'Too young' : undefined);

	it('unmounting a field with a failing validator leaves the form valid', async () => {
		const { form, screen } = await mount({
			formProps: { initialValues: { age: 30 } },
			ageValidator: minAge
		});
		form.change('age', 17);
		const validWithField = form.getState().valid;

		await screen.rerender({ showAge: false });

		expect(validWithField).toBe(false);
		expect(form.getState().valid).toBe(true);
		expect(form.getState().errors).toEqual({});
	});

	// final-form skips validation, and keeps stale errors, once no validator is left at all; the other
	// validator keeps the removal observable (checked against final-form 5.0.1 directly).
	it('a field validator removed after mount no longer reports an error', async () => {
		const { form, screen } = await mount({
			formProps: { initialValues: { age: 30 } },
			ageValidator: minAge,
			firstNameValidator: () => undefined
		});
		form.change('age', 17);
		const errorBefore = readJson('meta:age').error;

		await screen.rerender({ ageValidator: undefined });
		form.change('age', 16);

		expect(errorBefore).toBe('Too young');
		expect(readJson('meta:age').error).toBeUndefined();
		expect(form.getState().valid).toBe(true);
	});

	it('a form validate removed after mount leaves the form valid', async () => {
		const formProps = { initialValues: { age: 17 } };
		const { form, screen } = await mount({
			formProps: { ...formProps, validate: tooYoung },
			firstNameValidator: () => undefined
		});
		const validBefore = form.getState().valid;

		await screen.rerender({ formProps });

		expect(validBefore).toBe(false);
		expect(form.getState().valid).toBe(true);
	});

	it('a replaced validate is not applied again when another kept prop changes later', async () => {
		const first = vi.fn(tooYoung);
		const second = vi.fn(tooYoung);
		const formProps = { initialValues: { age: 30 } };
		const { screen } = await mount({ formProps: { ...formProps, validate: first } });
		await screen.rerender({ formProps: { ...formProps, validate: second } });
		second.mockClear();

		await screen.rerender({ onSubmit: () => undefined });

		expect(second).not.toHaveBeenCalled();
	});

	it('a Field and a FormSpy given a form need no enclosing Form', async () => {
		const { form } = await mount({ formProps: { initialValues: { firstName: 'Ana' } } });

		await render(DetachedConsumers, { form });
		form.change('firstName', 'Elena');

		expect(textOf('detached-field')).toBe('Elena');
		expect(readJson('detached-spy')).toEqual({ firstName: 'Elena' });
	});
});
