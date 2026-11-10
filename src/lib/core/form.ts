import { createForm, formSubscriptionItems } from 'final-form';
import type { Config, FormState, FormSubscription, Unsubscribe } from 'final-form';
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
	return createForm<V, Partial<V>>(config) as TypedFormApi<V>;
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

/** Compares two objects one level deep: equal keys, `===` per value. Nested objects compare by reference. */
export function shallowEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
	const left = a as Record<string, unknown>;
	const right = b as Record<string, unknown>;
	const keys = Object.keys(left);
	return keys.length === Object.keys(right).length && keys.every((key) => left[key] === right[key]);
}

/** Returns a watcher that calls `callback` when the value it receives differs, by `isEqual`, from the one before. */
export function whenValueChanges<T>(
	init: T,
	callback: () => void,
	isEqual: (a: T, b: T) => boolean = (a, b) => a === b
): (value: T) => void {
	let previous = init;
	return (value) => {
		if (!isEqual(previous, value)) {
			callback();
			previous = value;
		}
	};
}
