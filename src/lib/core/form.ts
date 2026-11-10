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
