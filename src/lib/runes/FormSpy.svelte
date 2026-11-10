<!--
	Renders `children` with the subscribed form `state` and `form`, and re-renders only when
	subscribed state changes. Pass the enclosing form's `form` to type the state.
-->
<script lang="ts" generics="V extends AnyFormValues">
	import { onDestroy, untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { FormState, FormSubscription } from 'final-form';
	import type { AnyFormValues, FormSpyRenderProps, TypedFormApi } from '../core/types.js';
	import { subscribeForm } from '../core/form.js';
	import { getForm } from '../core/context.js';

	interface Props {
		/** Read once at creation. Defaults to the form of the enclosing `Form`, untyped. */
		form?: TypedFormApi<V>;
		/** Read once at creation. Defaults to every form state key. */
		subscription?: FormSubscription;
		children: Snippet<[FormSpyRenderProps<V>]>;
	}

	let { form: formProp, subscription, children }: Props = $props();

	const form = untrack(() => formProp) ?? getForm<V>();

	// Assigned right away: final-form calls the listener on subscribe, so the first render and SSR
	// already see state. `undefined!` keeps TypeScript out of the markup, which ships as is.
	let formState: FormState<V, Partial<V>> = $state.raw(undefined!);
	onDestroy(
		subscribeForm(
			form,
			(next) => {
				formState = next;
			},
			untrack(() => subscription)
		)
	);
</script>

{@render children({ state: formState, form })}
