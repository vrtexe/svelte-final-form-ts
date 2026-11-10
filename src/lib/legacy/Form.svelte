<!--
	Svelte 4 syntax only: this file must compile for Svelte 4 consumers and in Svelte 5 non-runes mode.
-->
<script lang="ts" generics="V extends AnyFormValues">
	import { onDestroy } from 'svelte';
	import type { FormState, FormSubscription } from 'final-form';
	import { setFormContext } from '../core/context.js';
	import {
		allFormSubscription,
		createHandleSubmit,
		createTypedForm,
		subscribeForm,
		type FormConfig
	} from '../core/form.js';
	import type { AnyFormValues } from '../core/types.js';

	export let onSubmit: FormConfig<V>['onSubmit'];
	export let initialValues: FormConfig<V>['initialValues'] = undefined;
	export let validate: FormConfig<V>['validate'] = undefined;
	// Plain boolean, as final-form types these: FormConfig<V>[...] here is emitted as FormConfig<V_1>
	// in Form.svelte.d.ts, which consumers checking with skipLibCheck false reject.
	export let validateOnBlur: boolean | undefined = undefined;
	export let destroyOnUnregister: boolean | undefined = undefined;
	export let keepDirtyOnReinitialize: boolean | undefined = undefined;
	export let mutators: FormConfig<V>['mutators'] = undefined;
	export let debug: FormConfig<V>['debug'] = undefined;
	export let subscription: FormSubscription = allFormSubscription;

	// initialValues, mutators, debug and subscription are read once, here.
	const form = createTypedForm<V>({
		onSubmit,
		initialValues,
		validate,
		validateOnBlur,
		destroyOnUnregister,
		keepDirtyOnReinitialize,
		mutators,
		debug
	});
	setFormContext(form);
	const handleSubmit = createHandleSubmit(form);

	// getState() only gives the variable its type: final-form calls the listener right away with the
	// subscribed keys, so the first render and SSR see that state.
	let state = form.getState();
	const unsubscribe = subscribeForm(
		form,
		(next: FormState<V, Partial<V>>) => (state = next),
		subscription
	);
	onDestroy(unsubscribe);

	$: form.setConfig('onSubmit', onSubmit);
	$: form.setConfig('validate', validate);
	$: form.setConfig('validateOnBlur', validateOnBlur);
	$: form.setConfig('destroyOnUnregister', destroyOnUnregister);
	$: form.setConfig('keepDirtyOnReinitialize', keepDirtyOnReinitialize);
</script>

<slot {form} {state} {handleSubmit} />
