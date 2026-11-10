import { fieldSubscriptionItems } from 'final-form';
import type { FieldConfig, FieldSubscription, FieldValidator, Unsubscribe } from 'final-form';
import type {
	AnyFormValues,
	FieldPath,
	FieldPathValue,
	FieldRenderProps,
	TypedFormApi
} from './types.js';

/**
 * The final-form field options a `Field` accepts. `getValidator` is read on every validation, so a new
 * validator takes effect without registering the field again.
 */
export type FieldOptions<T> = Pick<
	FieldConfig<T>,
	| 'validateFields'
	| 'initialValue'
	| 'defaultValue'
	| 'isEqual'
	| 'afterSubmit'
	| 'beforeSubmit'
	| 'data'
> & { getValidator?: () => FieldValidator<T> | undefined };

/** Every key final-form publishes, the default when a `Field` gets no subscription. */
export const allFieldSubscription: FieldSubscription = Object.fromEntries(
	fieldSubscriptionItems.map((key) => [key, true])
);

/**
 * Register a field under a dot path and hand the listener its render props. final-form calls the
 * listener once right away.
 *
 * @returns a function that unregisters the field
 */
export function registerTypedField<V extends AnyFormValues, N extends FieldPath<V>>(
	form: TypedFormApi<V>,
	name: N,
	listener: (props: FieldRenderProps<N, FieldPathValue<V, N>>) => void,
	subscription: FieldSubscription = allFieldSubscription,
	options: FieldOptions<FieldPathValue<V, N>> = {}
): Unsubscribe {
	return form.registerField(
		// The one cast: final-form types names as `keyof V`, but it reads and writes dot paths.
		name as keyof V,
		(state) => {
			// The rest is the meta: name, value and the handlers go to input only.
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { name: _name, value, change, blur, focus, ...meta } = state;
			listener({
				input: { name, value, onChange: change, onFocus: focus, onBlur: blur },
				meta
			});
		},
		subscription,
		options
	);
}

/** Whether two subscriptions have the same truthy keys. A missing subscription counts as the full one. */
export function sameSubscription(a?: FieldSubscription, b?: FieldSubscription): boolean {
	const keys = (subscription: FieldSubscription = allFieldSubscription): string =>
		Object.keys(subscription)
			.filter((key) => subscription[key as keyof FieldSubscription])
			.sort()
			.join();
	return keys(a) === keys(b);
}
