<!--
	Svelte 4 syntax only: this file must compile for Svelte 4 consumers and in Svelte 5 non-runes mode.
-->
<script lang="ts" generics="V extends AnyFormValues, N extends FieldPath<V>">
	import { onDestroy } from 'svelte';
	import type { FieldSubscription, FieldValidator, Unsubscribe } from 'final-form';
	import { getForm } from '../core/context.js';
	import {
		allFieldSubscription,
		registerTypedField,
		sameSubscription,
		type FieldOptions
	} from '../core/field.js';
	import type {
		AnyFormValues,
		FieldPath,
		FieldPathValue,
		FieldRenderProps,
		TypedFormApi
	} from '../core/types.js';

	type Value = FieldPathValue<V, N>;
	type Options = FieldOptions<Value>;

	export let name: N;
	/** Anchors the types and picks the instance; read once. Defaults to the enclosing `Form`. */
	export let form: TypedFormApi<V> | undefined = undefined;
	export let subscription: FieldSubscription = allFieldSubscription;
	export let validate: FieldValidator<Value> | undefined = undefined;
	export let validateFields: Options['validateFields'] = undefined;
	export let initialValue: Options['initialValue'] = undefined;
	export let defaultValue: Options['defaultValue'] = undefined;
	export let isEqual: Options['isEqual'] = undefined;
	export let afterSubmit: Options['afterSubmit'] = undefined;
	export let beforeSubmit: Options['beforeSubmit'] = undefined;
	export let data: Options['data'] = undefined;

	const api = form ?? getForm<V>();

	let props: FieldRenderProps<N, Value>;
	let registered: { name: N; subscription: FieldSubscription; unregister: Unsubscribe } | undefined;

	function register(nextName: N, nextSubscription: FieldSubscription): void {
		if (
			registered?.name === nextName &&
			sameSubscription(registered.subscription, nextSubscription)
		) {
			return;
		}
		registered?.unregister();
		const unregister = registerTypedField(
			api,
			nextName,
			(next) => (props = next),
			nextSubscription,
			{
				// Read on every validation, so a new validator applies without registering again.
				getValidator: () => validate,
				validateFields,
				initialValue,
				defaultValue,
				isEqual,
				afterSubmit,
				beforeSubmit,
				data
			}
		);
		registered = { name: nextName, subscription: nextSubscription, unregister };
	}

	// Registered during initialisation, so the first render and SSR see the field state.
	register(name, subscription);
	$: register(name, subscription);
	onDestroy(() => registered?.unregister());
</script>

<slot input={props.input} meta={props.meta} />
