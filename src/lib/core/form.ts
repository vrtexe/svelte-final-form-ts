import { FORM_ERROR, createForm, formSubscriptionItems } from 'final-form';
import type {
	Config,
	FormState,
	FormSubscription,
	SubmissionErrors,
	Unsubscribe
} from 'final-form';
import type { AnyFormValues, FormRenderProps, TypedFormApi } from './types.js';

/** The final-form options a `Form` accepts. Every key exists in final-form 4.20 and 5. */
export type FormConfig<V extends AnyFormValues> = Pick<
	Config<V, Partial<V>>,
	| 'onSubmit'
	| 'initialValues'
	| 'validate'
	| 'validateOnBlur'
	| 'destroyOnUnregister'
	| 'keepDirtyOnReinitialize'
	| 'mutators'
	| 'debug'
>;

/** Every key final-form publishes, the default when a `Form` or `FormSpy` gets no subscription. */
export const allFormSubscription: FormSubscription = Object.fromEntries(
	formSubscriptionItems.map((key) => [key, true])
);

/**
 * Create a final-form instance whose API checks field names against the paths of `V`.
 *
 * @throws Error `No onSubmit function specified` from final-form when `onSubmit` is missing
 */
export function createTypedForm<V extends AnyFormValues>(config: FormConfig<V>): TypedFormApi<V> {
	// TypedFormApi retypes final-form's `keyof V` names as dot paths, which final-form accepts at runtime.
	return createForm<V, Partial<V>>({
		...config,
		onSubmit: normalizeOnSubmit(config.onSubmit)
	}) as TypedFormApi<V>;
}

function errorMessage(error: unknown): string {
	if (error instanceof Error) return error.message;
	return typeof error === 'string' ? error : String(error);
}

// final-form reports a rejected onSubmit as success and wedges the form after a synchronous throw.
// The wrapper keeps the callback protocol: a three-parameter onSubmit makes final-form wait for it.
const normalizedOnSubmit = new WeakMap<object, unknown>();

export function normalizeOnSubmit<V extends AnyFormValues>(
	onSubmit: FormConfig<V>['onSubmit']
): FormConfig<V>['onSubmit'] {
	if (!onSubmit) return onSubmit;
	const cached = normalizedOnSubmit.get(onSubmit);
	if (cached) return cached as FormConfig<V>['onSubmit'];
	const wrapped: NonNullable<FormConfig<V>['onSubmit']> = (values, form, callback) => {
		const complete = callback ?? (() => undefined);
		const fail = (error: unknown) =>
			complete({ [FORM_ERROR]: errorMessage(error) } as SubmissionErrors);
		try {
			const result = onSubmit(values, form, complete);
			if (result && typeof (result as Promise<SubmissionErrors>).then === 'function') {
				void (result as Promise<SubmissionErrors>).then(
					(errors) => complete(errors),
					(error: unknown) => fail(error)
				);
				return;
			}
			if (onSubmit.length < 3) complete(result as SubmissionErrors);
		} catch (error) {
			fail(error);
		}
	};
	normalizedOnSubmit.set(onSubmit, wrapped);
	return wrapped;
}

/** Set the form-level validator, clearing the errors left behind when it is removed. */
export function setValidate<V extends AnyFormValues>(
	form: TypedFormApi<V>,
	validate: FormConfig<V>['validate']
): void {
	if (validate) {
		form.setConfig('validate', validate);
		return;
	}
	const state = form.getState();
	if (state.valid && !state.errors) {
		form.setConfig('validate', undefined);
		return;
	}
	form.setConfig('validate', () => undefined);
	form.setConfig('validate', undefined);
}

/** Subscribe to the form state. final-form calls the listener once right away. */
export function subscribeForm<V extends AnyFormValues>(
	form: TypedFormApi<V>,
	listener: (state: FormState<V, Partial<V>>) => void,
	subscription: FormSubscription = allFormSubscription
): Unsubscribe {
	return form.subscribe(listener, subscription);
}

/** Create the `handleSubmit` a `Form` hands its content: it cancels the browser submit and submits the form. */
export function createHandleSubmit<V extends AnyFormValues>(
	form: TypedFormApi<V>
): FormRenderProps<V>['handleSubmit'] {
	return (event) => {
		event?.preventDefault();
		return form.submit();
	};
}

/** Returns a watcher that calls `callback` when the value it receives differs from the one before. */
export function whenValueChanges<T>(init: T, callback: () => void): (value: T) => void {
	let previous = init;
	return (value) => {
		if (previous !== value) {
			callback();
			previous = value;
		}
	};
}
