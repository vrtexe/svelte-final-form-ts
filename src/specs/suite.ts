// The component scenarios of 04-requirements.md, written once and run against every fixture set.
// A fixture set is one way of consuming a component set (for example the legacy set from a
// runes-mode consumer); every set provides the same fixtures with the same props.
import type {
	FieldSubscription,
	FieldValidator,
	FormState,
	FormSubscription,
	SubmissionErrors,
	ValidationErrors
} from 'final-form';
import { flushSync, type Component } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { TypedFormApi } from '../lib/index.js';

export interface Profile {
	firstName: string;
	age: number;
	address: { city: string; zip: string };
	newsletter: boolean;
}

export type ProfileFieldName = 'firstName' | 'age' | 'address.city' | 'address.zip';

export type ProfileSubmit = (
	values: Profile
) => SubmissionErrors | Promise<SubmissionErrors> | undefined;

/**
 * The profile form. It renders a `<form>` with a Submit button and a "Set Elena" button that calls
 * `change` on the form API it receives, and these test ids: `form-state` (the form state as JSON),
 * `input:<name>` and `meta:<name>` per field, and `spy-state` when a spy subscription is given. The
 * spy content also renders a "Set age" button (`spy-set-age`) that calls `change('age', 42)` on the
 * form API the spy hands it.
 */
export interface ProfileProps {
	onSubmit: ProfileSubmit;
	initialValues?: Partial<Profile>;
	validate?: (values: Profile) => ValidationErrors;
	formSubscription?: FormSubscription;
	/** Applied to every field. */
	fieldSubscription?: FieldSubscription;
	/** Mounts a `FormSpy` with this subscription when given. */
	spySubscription?: FormSubscription;
	/** Passed to the `FormSpy` as its onChange. */
	spyOnChange?: (state: FormState<Profile, Partial<Profile>>) => void;
	ageValidator?: FieldValidator<number>;
	/** The fields to mount, all four by default. */
	fields?: ProfileFieldName[];
	/** Receives the form API once, before any field or spy of the content subscribes. */
	onForm?: (form: TypedFormApi<Profile>) => void;
	/** Called with `form`, `spy` or `field:<name>` every time that content renders. */
	onRender?: (id: string) => void;
}

/** A `Form` whose content calls `getForm` in a component two levels deep (button "Set Elena"). */
export type NestedAccessProps = Record<string, never>;

/** An outer form with firstName "Outer" around an inner form with firstName "Inner". */
export interface NestedFormsProps {
	onForm: (form: TypedFormApi<Profile>) => void;
}

/** Renders `getForm`, a `Field` or a `FormSpy` with no enclosing `Form`. */
export interface OutsideFormProps {
	which: 'getForm' | 'Field' | 'FormSpy';
}

/** One `Field` whose name follows the prop, inside a form with firstName "Ana" and city "Skopje". */
export interface RenameFieldProps {
	name: 'firstName' | 'address.city';
	onForm: (form: TypedFormApi<Profile>) => void;
}

/** A `Form` rendered without `onSubmit`, bypassing the type check. */
export type MissingOnSubmitProps = Record<string, never>;

/** A runes consumer whose initial values are a `$state` object (test id `initial` shows it). */
export interface StateProxyProps {
	onSubmit: ProfileSubmit;
}

/** A runes consumer whose Submit button derives its label from the submitting flag. */
export interface DerivedLabelProps {
	onSubmit: ProfileSubmit;
}

interface CommonFixtures {
	name: string;
	Profile: Component<ProfileProps>;
	NestedAccess: Component<NestedAccessProps>;
	NestedForms: Component<NestedFormsProps>;
	OutsideForm: Component<OutsideFormProps>;
	RenameField: Component<RenameFieldProps>;
	MissingOnSubmit: Component<MissingOnSubmitProps>;
}

/** Runes-mode sets also provide the fixtures of the runes-mode consumer scenarios. */
export type FixtureSet =
	| (CommonFixtures & { mode: 'non-runes' })
	| (CommonFixtures & {
			mode: 'runes';
			StateProxy: Component<StateProxyProps>;
			DerivedLabel: Component<DerivedLabelProps>;
	  });

const OUTSIDE_FORM_MESSAGE =
	'getForm() must be called inside a <Form> component, during component initialisation';
const MIN_AGE_ERROR = 'Must be 18 or older';

const minAge: FieldValidator<number> = (value) => (value < 18 ? MIN_AGE_ERROR : undefined);
const noSubmit: ProfileSubmit = () => undefined;

/** Reads the JSON a fixture renders under the test id, after flushing pending updates. */
function readJson(testId: string): Record<string, unknown> {
	flushSync();
	const element = document.querySelector(`[data-testid="${testId}"]`);
	if (!element) throw new Error(`no element with test id ${testId}`);
	return JSON.parse(element.textContent ?? '');
}

function textOf(testId: string): string {
	flushSync();
	return document.querySelector(`[data-testid="${testId}"]`)?.textContent ?? '';
}

interface Deferred {
	promise: Promise<SubmissionErrors>;
	resolve: (errors: SubmissionErrors) => void;
}

function deferred(): Deferred {
	let resolve: Deferred['resolve'] = () => undefined;
	const promise = new Promise<SubmissionErrors>((r) => (resolve = r));
	return { promise, resolve };
}

/** Collects the content renders the profile form reports, by id. */
function renderCounter(): { onRender: (id: string) => void; count: (id: string) => number } {
	const seen: string[] = [];
	return {
		onRender: (id) => seen.push(id),
		count: (id) => {
			flushSync();
			return seen.filter((entry) => entry === id).length;
		}
	};
}

/**
 * Counts the subscriptions and field registrations made through the form API from now on that have
 * not been undone yet.
 */
function trackSubscriptions(form: TypedFormApi<Profile>): () => number {
	let open = 0;
	const track = (unsubscribe: () => void): (() => void) => {
		open += 1;
		let closed = false;
		return () => {
			if (!closed) open -= 1;
			closed = true;
			unsubscribe();
		};
	};
	const { subscribe, registerField } = form;
	form.subscribe = (listener, subscription) => track(subscribe(listener, subscription));
	form.registerField = (name, subscriber, subscription, config) =>
		track(registerField(name, subscriber, subscription, config));
	return () => open;
}

/** Renders the profile form and hands back the form API its content received. */
async function mountProfile(
	set: FixtureSet,
	props: Partial<ProfileProps> = {}
): Promise<{ form: TypedFormApi<Profile>; screen: Awaited<ReturnType<typeof render>> }> {
	let form: TypedFormApi<Profile> | undefined;
	const screen = await render(set.Profile, {
		onSubmit: noSubmit,
		...props,
		onForm: (received: TypedFormApi<Profile>) => {
			form = received;
			props.onForm?.(received);
		}
	});
	if (!form) throw new Error('the profile form handed out no form API');
	return { form, screen };
}

function input(name: ProfileFieldName): HTMLInputElement {
	const element = document.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`);
	if (!element) throw new Error(`no input for ${name}`);
	return element;
}

async function fill(name: ProfileFieldName, value: string): Promise<void> {
	await userEvent.fill(input(name), value);
}

async function submit(): Promise<void> {
	await userEvent.click(document.querySelector('button[type="submit"]') as HTMLButtonElement);
}

function errorOf(action: () => unknown): Error {
	try {
		action();
	} catch (error) {
		return error as Error;
	}
	throw new Error('expected the action to throw');
}

/** Registers every component scenario for the fixture set. */
export function componentSuite(set: FixtureSet): void {
	describe(`${set.name}: Form`, () => {
		it('submitting calls onSubmit with the current values', async () => {
			const onSubmit = vi.fn<ProfileSubmit>();
			await mountProfile(set, { onSubmit, initialValues: { firstName: 'Ana', age: 30 } });
			await fill('firstName', 'Marija');

			await submit();

			expect(onSubmit).toHaveBeenCalledTimes(1);
			expect(onSubmit.mock.calls[0][0]).toEqual({ firstName: 'Marija', age: 30 });
		});

		it('initial values prefill the form state', async () => {
			await mountProfile(set, {
				initialValues: { firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } }
			});

			const state = readJson('form-state');

			expect(state).toMatchObject({
				values: { firstName: 'Ana', address: { city: 'Skopje' } },
				pristine: true
			});
		});

		it('form-level validation errors block submission', async () => {
			const onSubmit = vi.fn<ProfileSubmit>();
			await mountProfile(set, {
				onSubmit,
				validate: (values) => (values.firstName ? {} : { firstName: 'Required' })
			});

			await submit();

			expect(onSubmit).not.toHaveBeenCalled();
			expect(readJson('form-state').valid).toBe(false);
			expect(readJson('meta:firstName')).toMatchObject({ error: 'Required', touched: true });
		});

		it('submission errors returned by onSubmit reach the form state', async () => {
			await mountProfile(set, { onSubmit: () => ({ firstName: 'Taken' }) });

			await submit();

			expect(readJson('form-state')).toMatchObject({ submitFailed: true, hasSubmitErrors: true });
			expect(readJson('meta:firstName').submitError).toBe('Taken');
		});

		it('the submitting flag is true while an asynchronous onSubmit is pending', async () => {
			const pending = deferred();
			await mountProfile(set, { onSubmit: () => pending.promise });

			await submit();
			const whilePending = readJson('form-state').submitting;
			pending.resolve(undefined);
			await pending.promise;
			await Promise.resolve();

			expect(whilePending).toBe(true);
			expect(readJson('form-state')).toMatchObject({ submitting: false, submitSucceeded: true });
		});

		it('the form subscription limits the state exposed to the content', async () => {
			await mountProfile(set, {
				initialValues: { firstName: 'Ana' },
				formSubscription: { submitting: true }
			});

			const state = readJson('form-state');

			expect(state.submitting).toBe(false);
			expect(state.values).toBeUndefined();
		});

		it('the content receives the form API', async () => {
			await mountProfile(set);

			await userEvent.click(document.querySelector('[data-testid="set-elena"]') as HTMLElement);

			expect(readJson('form-state')).toMatchObject({ values: { firstName: 'Elena' } });
		});

		it('a new validate prop applies to the mounted form', async () => {
			const { screen } = await mountProfile(set);
			const validBefore = readJson('form-state').valid;

			await screen.rerender({ validate: () => ({ firstName: 'Required' }) });

			expect(validBefore).toBe(true);
			expect(readJson('form-state').valid).toBe(false);
		});

		it('a missing onSubmit is reported when the form is created', () => {
			const error = errorOf(() => render(set.MissingOnSubmit, {}));

			expect(error.message).toContain('No onSubmit function specified');
		});

		it('unmounting the form removes its subscriptions', async () => {
			let openSubscriptions: () => number = () => 0;
			const counter = renderCounter();
			const { form, screen } = await mountProfile(set, {
				fields: ['firstName', 'age', 'address.city'],
				spySubscription: { values: true },
				onForm: (received) => (openSubscriptions = trackSubscriptions(received)),
				onRender: counter.onRender
			});
			const openWhileMounted = openSubscriptions();
			await screen.unmount();
			const rendersAtUnmount = counter.count('spy') + counter.count('form');

			form.change('firstName', 'Elena');

			expect(openWhileMounted).toBe(4);
			expect(openSubscriptions()).toBe(0);
			expect(form.getRegisteredFields()).toEqual([]);
			expect(counter.count('spy') + counter.count('form')).toBe(rendersAtUnmount);
		});

		it('an onSubmit that resolves after the form is unmounted runs no subscriber of the form', async () => {
			const pending = deferred();
			const counter = renderCounter();
			const { form, screen } = await mountProfile(set, {
				onSubmit: () => pending.promise,
				spySubscription: { submitting: true },
				onRender: counter.onRender
			});
			await submit();
			const submittingAtUnmount = form.getState().submitting;
			await screen.unmount();
			const rendersAtUnmount = counter.count('spy') + counter.count('form');

			pending.resolve({ firstName: 'Taken' });
			await pending.promise;
			await Promise.resolve();

			expect(submittingAtUnmount).toBe(true);
			expect(form.getState()).toMatchObject({ submitting: false, hasSubmitErrors: true });
			expect(counter.count('spy') + counter.count('form')).toBe(rendersAtUnmount);
		});

		it('an empty form subscription exposes no state key but keeps the fields working', async () => {
			await mountProfile(set, { initialValues: { firstName: 'Ana' }, formSubscription: {} });

			await fill('firstName', 'Petar');

			expect(readJson('form-state')).toEqual({});
			expect(readJson('input:firstName').value).toBe('Petar');
		});
	});

	describe(`${set.name}: Field`, () => {
		it('a top-level field receives its input props', async () => {
			await mountProfile(set, { initialValues: { firstName: 'Ana' } });

			const props = readJson('input:firstName');

			expect(props).toEqual({
				name: 'firstName',
				value: 'Ana',
				handlers: ['function', 'function', 'function']
			});
		});

		it('a nested field path reads and writes the nested value', async () => {
			const { form } = await mountProfile(set, {
				initialValues: { address: { city: 'Skopje', zip: '1000' } }
			});

			await fill('address.city', 'Bitola');

			expect(readJson('input:address.city').value).toBe('Bitola');
			expect(form.getState().values.address).toEqual({ city: 'Bitola', zip: '1000' });
		});

		it('changing a field updates the form values', async () => {
			await mountProfile(set);

			await fill('firstName', 'Petar');

			expect(readJson('form-state')).toMatchObject({ values: { firstName: 'Petar' } });
			expect(readJson('meta:firstName').dirty).toBe(true);
		});

		it('blurring a field marks it touched', async () => {
			await mountProfile(set);
			const touchedBefore = readJson('meta:firstName').touched;

			await userEvent.click(input('firstName'));
			await userEvent.tab();

			expect(touchedBefore).toBe(false);
			expect(readJson('meta:firstName').touched).toBe(true);
		});

		it('a field-level validator error appears in the field meta', async () => {
			await mountProfile(set, { ageValidator: minAge });

			await fill('age', '17');

			expect(readJson('meta:age').error).toBe(MIN_AGE_ERROR);
			expect(readJson('form-state').valid).toBe(false);
		});

		it.each([
			{ age: '17', error: MIN_AGE_ERROR },
			{ age: '18', error: undefined }
		])('the field validator boundary on age: $age', async ({ age, error }) => {
			await mountProfile(set, { ageValidator: minAge });

			await fill('age', age);

			expect(readJson('meta:age').error).toBe(error);
		});

		it("a form-level error for a nested path appears in that field's meta", async () => {
			await mountProfile(set, {
				initialValues: { address: { city: '', zip: '1000' } },
				validate: (values) => (values.address?.city ? {} : { address: { city: 'Required' } })
			});

			const meta = readJson('meta:address.city');

			expect(meta.error).toBe('Required');
		});

		it('the field subscription limits the meta exposed to the content', async () => {
			await mountProfile(set, {
				initialValues: { firstName: 'Ana' },
				fieldSubscription: { value: true }
			});

			const meta = readJson('meta:firstName');

			expect(readJson('input:firstName').value).toBe('Ana');
			expect(meta.touched).toBeUndefined();
			expect(meta.error).toBeUndefined();
		});

		it("changing one field does not re-render another field's content", async () => {
			const counter = renderCounter();
			await mountProfile(set, {
				fields: ['firstName', 'age'],
				fieldSubscription: { value: true },
				onRender: counter.onRender
			});
			const ageRendersBefore = counter.count('field:age');

			await fill('firstName', 'Petar');

			expect(ageRendersBefore).toBe(1);
			expect(readJson('input:firstName').value).toBe('Petar');
			expect(counter.count('field:age')).toBe(1);
		});

		it('unmounting a field unregisters it from the form', async () => {
			const { form, screen } = await mountProfile(set, { fields: ['firstName', 'age'] });

			await screen.rerender({ fields: ['firstName'] });

			expect(form.getRegisteredFields()).toEqual(['firstName']);
		});

		it('changing the name of a mounted field re-registers it under the new name', async () => {
			let form: TypedFormApi<Profile> | undefined;
			const screen = await render(set.RenameField, {
				name: 'firstName',
				onForm: (received: TypedFormApi<Profile>) => (form = received)
			});

			await screen.rerender({ name: 'address.city' });

			expect(readJson('input:field')).toMatchObject({ name: 'address.city', value: 'Skopje' });
			expect(form?.getRegisteredFields()).toEqual(['address.city']);
		});
		it('an equal field subscription in a new object does not register the field again', async () => {
			const counter = renderCounter();
			const { screen } = await mountProfile(set, {
				fields: ['firstName'],
				fieldSubscription: { value: true },
				onRender: counter.onRender
			});
			const rendersBefore = counter.count('field:firstName');

			await screen.rerender({ fieldSubscription: { value: true } });

			expect(rendersBefore).toBe(1);
			expect(counter.count('field:firstName')).toBe(1);
		});

		it('a field subscription with other keys registers the field again', async () => {
			const { screen } = await mountProfile(set, {
				initialValues: { firstName: 'Ana' },
				fields: ['firstName'],
				fieldSubscription: { value: true }
			});

			await screen.rerender({ fieldSubscription: { value: true, touched: true } });

			expect(readJson('meta:firstName')).toEqual({ touched: false });
			expect(readJson('input:firstName').value).toBe('Ana');
		});

		it('a new field subscription drops the previous registration of the field', async () => {
			let openSubscriptions: () => number = () => 0;
			const { screen } = await mountProfile(set, {
				fields: ['firstName'],
				fieldSubscription: { value: true },
				onForm: (received) => (openSubscriptions = trackSubscriptions(received))
			});
			const openBefore = openSubscriptions();

			await screen.rerender({ fieldSubscription: { value: true, touched: true } });
			await fill('firstName', 'Petar');

			expect(openBefore).toBe(1);
			expect(openSubscriptions()).toBe(1);
			expect(readJson('meta:firstName')).toEqual({ touched: false });
			expect(readJson('input:firstName').value).toBe('Petar');
		});

		it('an empty field subscription still hands the content its name and handlers', async () => {
			await mountProfile(set, {
				initialValues: { firstName: 'Ana' },
				fields: ['firstName'],
				fieldSubscription: {}
			});

			expect(readJson('input:firstName')).toEqual({
				name: 'firstName',
				handlers: ['function', 'function', 'function']
			});
			expect(readJson('meta:firstName')).toEqual({});
		});

		it('unmounting a renamed field unregisters it under its current name', async () => {
			let form: TypedFormApi<Profile> | undefined;
			const screen = await render(set.RenameField, {
				name: 'firstName',
				onForm: (received: TypedFormApi<Profile>) => (form = received)
			});
			await screen.rerender({ name: 'address.city' });

			await screen.unmount();

			expect(form?.getRegisteredFields()).toEqual([]);
		});

		it('a field renamed back to its first name reads that value again', async () => {
			const screen = await render(set.RenameField, { name: 'firstName', onForm: () => undefined });
			await screen.rerender({ name: 'address.city' });

			await screen.rerender({ name: 'firstName' });

			expect(readJson('input:field')).toEqual({ name: 'firstName', value: 'Ana' });
		});
	});

	describe(`${set.name}: FormSpy`, () => {
		it('the form spy shows the subscribed state', async () => {
			await mountProfile(set, { spySubscription: { values: true } });

			await fill('firstName', 'Petar');

			expect(readJson('spy-state')).toEqual({ values: { firstName: 'Petar' } });
		});

		it('the form spy re-renders when subscribed state changes', async () => {
			const counter = renderCounter();
			await mountProfile(set, {
				initialValues: { firstName: 'Ana', age: 30 },
				spySubscription: { dirty: true },
				onRender: counter.onRender
			});
			const rendersBefore = counter.count('spy');

			await fill('firstName', 'Petar');

			expect(rendersBefore).toBe(1);
			expect(counter.count('spy')).toBe(2);
			expect(readJson('spy-state')).toEqual({ dirty: true });
		});

		it('the form spy does not re-render when only unsubscribed state changes', async () => {
			const counter = renderCounter();
			await mountProfile(set, {
				spySubscription: { submitting: true },
				onRender: counter.onRender
			});
			const rendersBefore = counter.count('spy');

			await fill('firstName', 'Petar');

			expect(rendersBefore).toBe(1);
			expect(counter.count('spy')).toBe(1);
		});

		it('the form spy does not re-render when subscribed state keeps its value', async () => {
			const counter = renderCounter();
			await mountProfile(set, {
				initialValues: { firstName: 'Ana', age: 30 },
				spySubscription: { dirty: true },
				onRender: counter.onRender
			});
			await fill('firstName', 'Petar');
			const rendersBefore = counter.count('spy');

			await fill('age', '31');

			expect(rendersBefore).toBe(2);
			expect(counter.count('spy')).toBe(2);
		});

		it('the form spy content receives the form API of the enclosing form', async () => {
			const { form } = await mountProfile(set, { spySubscription: { values: true } });

			await userEvent.click(document.querySelector('[data-testid="spy-set-age"]') as HTMLElement);

			expect(form.getState().values.age).toBe(42);
			expect(readJson('spy-state')).toEqual({ values: { age: 42 } });
		});

		it('unmounting only the form spy ends its subscription while the form stays mounted', async () => {
			let openSubscriptions: () => number = () => 0;
			const counter = renderCounter();
			const { form, screen } = await mountProfile(set, {
				fields: ['firstName'],
				spySubscription: { values: true },
				onForm: (received) => (openSubscriptions = trackSubscriptions(received)),
				onRender: counter.onRender
			});
			const openWithSpy = openSubscriptions();

			await screen.rerender({ spySubscription: undefined });
			const spyRendersAtUnmount = counter.count('spy');
			form.change('firstName', 'Elena');

			expect(openWithSpy).toBe(2);
			expect(openSubscriptions()).toBe(1);
			expect(counter.count('spy')).toBe(spyRendersAtUnmount);
			expect(readJson('form-state')).toMatchObject({ values: { firstName: 'Elena' } });
		});

		it('the form spy calls onChange on mount with the subscribed state', async () => {
			const onChange = vi.fn();
			await mountProfile(set, {
				initialValues: { firstName: 'Ana' },
				spySubscription: { values: true },
				spyOnChange: onChange
			});

			expect(onChange).toHaveBeenCalledTimes(1);
			expect(onChange.mock.calls[0][0]).toEqual({ values: { firstName: 'Ana' } });
		});

		it('the form spy calls onChange before it renders the new state', async () => {
			const seen: (string | null)[] = [];
			await mountProfile(set, {
				initialValues: { firstName: 'Ana' },
				spySubscription: { values: true },
				spyOnChange: () =>
					seen.push(document.querySelector('[data-testid="spy-state"]')?.textContent ?? null)
			});
			await fill('firstName', 'Petar');

			expect(seen).toEqual([null, JSON.stringify({ values: { firstName: 'Ana' } })]);
		});

		it('the form spy calls onChange only for subscribed changes', async () => {
			const onChange = vi.fn();
			await mountProfile(set, { spySubscription: { submitFailed: true }, spyOnChange: onChange });
			onChange.mockClear();

			await fill('firstName', 'Petar');

			expect(onChange).not.toHaveBeenCalled();
		});

		it('a new onChange handler applies without subscribing again', async () => {
			const first = vi.fn();
			const second = vi.fn();
			let openSubscriptions: () => number = () => 0;
			const { screen } = await mountProfile(set, {
				initialValues: { firstName: 'Ana' },
				spySubscription: { values: true },
				spyOnChange: first,
				onForm: (received) => (openSubscriptions = trackSubscriptions(received))
			});
			const openBefore = openSubscriptions();

			await screen.rerender({ spyOnChange: second });
			first.mockClear();
			await fill('firstName', 'Petar');

			expect(openSubscriptions()).toBe(openBefore);
			expect(first).not.toHaveBeenCalled();
			expect(second).toHaveBeenCalledTimes(1);
			expect(second.mock.calls[0][0]).toEqual({ values: { firstName: 'Petar' } });
		});
	});

	describe(`${set.name}: Typed form access`, () => {
		it('a nested component obtains the form API of its enclosing form', async () => {
			await render(set.NestedAccess, {});

			await userEvent.click(document.querySelector('[data-testid="set-elena"]') as HTMLElement);

			expect(readJson('form-state')).toMatchObject({ values: { firstName: 'Elena' } });
		});

		it('the helper returns the innermost form when forms are nested', async () => {
			const received: TypedFormApi<Profile>[] = [];

			await render(set.NestedForms, { onForm: (form) => received.push(form) });

			expect(received).toHaveLength(1);
			expect(received[0].getState().values).toEqual({ firstName: 'Inner' });
		});

		it.each(['getForm', 'Field', 'FormSpy'] as const)(
			'calling the helper outside a form fails with a clear error: %s',
			(which) => {
				const error = errorOf(() => render(set.OutsideForm, { which }));

				expect(error.message).toContain(OUTSIDE_FORM_MESSAGE);
			}
		);
	});

	if (set.mode === 'runes') {
		const { StateProxy, DerivedLabel } = set;

		describe(`${set.name}: runes-mode consumer`, () => {
			it('a runes-mode consumer can pass state proxies as initial values', async () => {
				const onSubmit = vi.fn<ProfileSubmit>();
				await render(StateProxy, { onSubmit });
				await fill('address.city', 'Ohrid');

				await submit();

				expect(onSubmit.mock.calls[0][0]).toEqual({
					firstName: 'Ana',
					address: { city: 'Ohrid', zip: '1000' }
				});
				expect(readJson('initial')).toMatchObject({ address: { city: 'Skopje' } });
			});

			it('a runes-mode consumer reacts to form state with derived values', async () => {
				const pending = deferred();
				await render(DerivedLabel, { onSubmit: () => pending.promise });
				const labelBefore = textOf('submit-label');

				await submit();

				expect(labelBefore).toBe('Save');
				expect(textOf('submit-label')).toBe('Saving');
			});
		});
	}
}
