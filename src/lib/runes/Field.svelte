<!--
	Registers a field under a dot path and renders `children` with its `input` props and `meta`.
	Pass the enclosing form's `form` to type `name` and the value; without it the field uses
	getForm() and is untyped.
-->
<script lang="ts" generics="V extends AnyFormValues, N extends FieldPath<V>">
	import { onDestroy, untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { FieldSubscription, FieldValidator, Unsubscribe } from 'final-form';
	import type {
		AnyFormValues,
		FieldPath,
		FieldPathValue,
		FieldRenderProps,
		TypedFormApi
	} from '../core/types.js';
	import { registerTypedField, sameSubscription } from '../core/field.js';
	import type { FieldOptions } from '../core/field.js';
	import { getForm } from '../core/context.js';

	type Value = FieldPathValue<V, N>;
	type Options = FieldOptions<Value>;

	interface Props {
		name: N;
		/** Read once at creation. Defaults to the form of the enclosing `Form`, untyped. */
		form?: TypedFormApi<V>;
		/** Defaults to every field state key. */
		subscription?: FieldSubscription;
		/** Read on every validation, so a new validator takes effect without registering again. */
		validate?: FieldValidator<Value>;
		validateFields?: Options['validateFields'];
		initialValue?: Options['initialValue'];
		defaultValue?: Options['defaultValue'];
		isEqual?: Options['isEqual'];
		afterSubmit?: Options['afterSubmit'];
		beforeSubmit?: Options['beforeSubmit'];
		data?: Options['data'];
		children: Snippet<[FieldRenderProps<N, Value>]>;
	}

	let {
		name,
		form: formProp,
		subscription,
		validate,
		validateFields,
		initialValue,
		defaultValue,
		isEqual,
		afterSubmit,
		beforeSubmit,
		data,
		children
	}: Props = $props();

	const form = untrack(() => formProp) ?? getForm<V>();

	// Assigned right away: final-form calls the listener on register, so the first render and SSR
	// already see the field. `undefined!` keeps TypeScript out of the markup, which ships as is.
	let fieldProps: FieldRenderProps<N, Value> = $state.raw(undefined!);
	// Plain variables: the effect compares against them and must not depend on them.
	let registeredName: N | undefined;
	let registeredSubscription: FieldSubscription | undefined;
	let unregister: Unsubscribe | undefined;

	function register(nextName: N, nextSubscription: FieldSubscription | undefined): void {
		unregister?.();
		registeredName = nextName;
		registeredSubscription = nextSubscription;
		unregister = registerTypedField(
			form,
			nextName,
			(next) => (fieldProps = next),
			nextSubscription,
			{
				validateFields,
				initialValue,
				defaultValue,
				isEqual,
				afterSubmit,
				beforeSubmit,
				data,
				getValidator: () => validate
			}
		);
	}

	untrack(() => register(name, subscription));
	onDestroy(() => unregister?.());

	// A new subscription object with the same keys, such as an inline literal, does not re-register.
	$effect(() => {
		if (name !== registeredName || !sameSubscription(subscription, registeredSubscription)) {
			untrack(() => register(name, subscription));
		}
	});
</script>

{@render children(fieldProps)}
