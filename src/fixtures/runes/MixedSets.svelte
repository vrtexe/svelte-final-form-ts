<!--
	A Form of one set around a Field, a FormSpy and getForm of the other set, none given the form
	prop, so all three find the form through the shared context key.
-->
<script lang="ts">
	import * as legacy from '$lib/index.js';
	import * as runes from '$lib/runes/index.js';
	import type { Profile } from '../../specs/suite.js';
	import FormHandout from './FormHandout.svelte';
	import LegacyFormHandout from '../legacy/FormHandout.svelte';

	let {
		outer,
		onForm,
		onInnerForm
	}: {
		outer: 'runes' | 'legacy';
		onForm: (form: runes.TypedFormApi<Profile>) => void;
		onInnerForm: (form: runes.TypedFormApi<Profile>) => void;
	} = $props();

	const onSubmit = (values: Profile): undefined => void values;
	const initialValues = { firstName: 'Ana' };
</script>

{#if outer === 'runes'}
	<runes.Form {onSubmit} {initialValues}>
		<FormHandout {onForm} />
		<LegacyFormHandout onForm={onInnerForm} />
		<legacy.Field name="firstName" let:input>
			<output data-testid="field">{input.value}</output>
		</legacy.Field>
		<legacy.FormSpy subscription={{ values: true }} let:state>
			<output data-testid="spy">{state.values.firstName}</output>
		</legacy.FormSpy>
	</runes.Form>
{:else}
	<legacy.Form {onSubmit} {initialValues}>
		<LegacyFormHandout {onForm} />
		<FormHandout onForm={onInnerForm} />
		<runes.Field name="firstName">
			{#snippet children({ input })}<output data-testid="field">{input.value}</output>{/snippet}
		</runes.Field>
		<runes.FormSpy subscription={{ values: true }}>
			{#snippet children({ state })}<output data-testid="spy">{state.values.firstName}</output
				>{/snippet}
		</runes.FormSpy>
	</legacy.Form>
{/if}
