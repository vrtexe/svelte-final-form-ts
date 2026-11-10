<!--
	Creates a final-form instance, provides it to getForm and renders `children` with `form`, the
	subscribed `state` and `handleSubmit`. Renders no element of its own.
-->
<script lang="ts" generics="V extends AnyFormValues">
	import { onDestroy, untrack } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { FormState, FormSubscription } from 'final-form';
	import type { AnyFormValues, FormRenderProps } from '../core/types.js';
	import {
		createHandleSubmit,
		createTypedForm,
		normalizeOnSubmit,
		setValidate,
		subscribeForm
	} from '../core/form.js';
	import type { FormConfig } from '../core/form.js';
	import { setFormContext } from '../core/context.js';

	interface Props {
		onSubmit: FormConfig<V>['onSubmit'];
		/** Read once at creation; call `form.initialize` to reset to new values. */
		initialValues?: Partial<V>;
		validate?: FormConfig<V>['validate'];
		validateOnBlur?: boolean;
		destroyOnUnregister?: boolean;
		keepDirtyOnReinitialize?: boolean;
		/** Read once at creation. */
		mutators?: FormConfig<V>['mutators'];
		/** Read once at creation. */
		debug?: FormConfig<V>['debug'];
		/** Read once at creation. Defaults to every form state key. */
		subscription?: FormSubscription;
		children: Snippet<[FormRenderProps<V>]>;
	}

	let {
		onSubmit,
		initialValues,
		validate,
		validateOnBlur,
		destroyOnUnregister,
		keepDirtyOnReinitialize,
		mutators,
		debug,
		subscription,
		children
	}: Props = $props();

	type LiveConfig = Pick<
		FormConfig<V>,
		'onSubmit' | 'validate' | 'validateOnBlur' | 'destroyOnUnregister' | 'keepDirtyOnReinitialize'
	>;

	// The props as they were at creation; the effect below applies later changes.
	const applied: LiveConfig = untrack(() => ({
		onSubmit,
		validate,
		validateOnBlur,
		destroyOnUnregister,
		keepDirtyOnReinitialize
	}));

	const form = createTypedForm<V>({
		...applied,
		...untrack(() => ({ initialValues, mutators, debug }))
	});
	setFormContext(form);
	const handleSubmit = createHandleSubmit(form);

	// Assigned right away: final-form calls the listener on subscribe, so the first render and SSR
	// already see state. `undefined!` keeps TypeScript out of the markup, which ships as is.
	let formState: FormState<V, Partial<V>> = $state.raw(undefined!);
	onDestroy(
		subscribeForm(
			form,
			(next) => (formState = next),
			untrack(() => subscription)
		)
	);

	// Only a changed value reaches final-form: setConfig('validate') revalidates the whole form.
	function keep<K extends keyof LiveConfig>(key: K, value: LiveConfig[K]): void {
		if (applied[key] === value) return;
		applied[key] = value;
		if (key === 'validate') setValidate(form, value as FormConfig<V>['validate']);
		else if (key === 'onSubmit')
			form.setConfig('onSubmit', normalizeOnSubmit(value as FormConfig<V>['onSubmit']));
		else form.setConfig(key, value);
	}

	$effect(() => {
		keep('onSubmit', onSubmit);
		keep('validate', validate);
		keep('validateOnBlur', validateOnBlur);
		keep('destroyOnUnregister', destroyOnUnregister);
		keep('keepDirtyOnReinitialize', keepDirtyOnReinitialize);
	});
</script>

{@render children({ form, state: formState, handleSubmit })}
