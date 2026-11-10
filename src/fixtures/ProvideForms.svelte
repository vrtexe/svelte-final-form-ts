<!--
	Provides each form in `forms` to its descendants, outermost first, then calls getForm in the
	innermost component and hands the result to `onForm`. With `decoy`, the forms are put under
	look-alike keys instead of the library's private one.
-->
<script lang="ts">
	import { setContext, untrack } from 'svelte';
	import { getForm, type AnyFormValues, type TypedFormApi } from '$lib/index.js';
	import { setFormContext } from '$lib/core/context.js';
	import Self from './ProvideForms.svelte';

	interface Props {
		forms: TypedFormApi<AnyFormValues>[];
		onForm: (form: TypedFormApi<AnyFormValues>) => void;
		decoy?: boolean;
	}

	let { forms, onForm, decoy = false }: Props = $props();

	const [first, ...rest] = untrack(() => forms);
	if (first && untrack(() => decoy)) {
		setContext(Symbol('svelte-final-form-ts.form'), first);
		setContext('FINAL_FORM', first);
	} else if (first) {
		setFormContext(first);
	} else {
		untrack(() => onForm)(getForm());
	}
</script>

{#if first}
	<Self forms={rest} {onForm} {decoy} />
{/if}
