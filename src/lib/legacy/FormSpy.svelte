<!--
	Svelte 4 syntax only: this file must compile for Svelte 4 consumers and in Svelte 5 non-runes mode.
-->
<script lang="ts" generics="V extends AnyFormValues">
	import { onDestroy } from 'svelte';
	import type { FormState, FormSubscription } from 'final-form';
	import { getForm } from '../core/context.js';
	import { allFormSubscription, subscribeForm } from '../core/form.js';
	import type { AnyFormValues, TypedFormApi } from '../core/types.js';

	/** Anchors the types and picks the instance; read once. Defaults to the enclosing `Form`. */
	export let form: TypedFormApi<V> | undefined = undefined;
	/** Read once. */
	export let subscription: FormSubscription = allFormSubscription;

	const api = form ?? getForm<V>();

	// getState() only gives the variable its type: final-form calls the listener right away with the
	// subscribed keys, so the first render and SSR see that state.
	let state = api.getState();
	const unsubscribe = subscribeForm(
		api,
		(next: FormState<V, Partial<V>>) => {
			state = next;
		},
		subscription
	);
	onDestroy(unsubscribe);
</script>

<slot {state} form={api} />
