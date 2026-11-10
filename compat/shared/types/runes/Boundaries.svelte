<!--
	Positive controls for the negative snippet fixtures (a call that should type-check must report 0
	errors, so the expected errors cannot pass because everything is rejected), plus path boundaries
	the scenario rows leave out. Expected errors are listed in expected-errors.json.
-->
<script lang="ts">
	import { Field, Form, FormSpy, getForm } from 'svelte-final-form-ts/runes';
	import type { Profile } from '../../runes/setup.js';

	const onSubmit = (values: Profile) => console.log(values);
	// final-form 5.0.0 types FormState.values as optional and 5.0.1 as required, so the spy rows
	// read it with ?. and pass it to targets that accept undefined.
	const toStringOrUndefined = (value: string | undefined) => value;
	const toNumberOrUndefined = (value: number | undefined) => value;
	const api = getForm<Profile>();
	api.change('address.city', 'Ohrid');
	api.change('age');
	api.change('address.town', 'Ohrid');
</script>

<Form {onSubmit}>
	{#snippet children({ form, state, handleSubmit })}
		<Field {form} name="age">
			{#snippet children({ input, meta })}
				<button type="button" onclick={() => input.onChange(30)}>Thirty</button>
				<button type="button" onclick={() => input.onChange(undefined)}>Clear</button>
				{meta.touched}
			{/snippet}
		</Field>
		<Field {form} name="address.city.zip">{#snippet children()}{/snippet}</Field>
		<Field name="anything.goes">{#snippet children({ input })}{input.value}{/snippet}</Field>
		<FormSpy {form}>
			{#snippet children({ state: spyState })}
				{toStringOrUndefined(spyState.values?.firstName)}
			{/snippet}
		</FormSpy>
		<FormSpy {form}>
			{#snippet children({ state: spyState })}
				{toNumberOrUndefined(spyState.values?.firstName)}
			{/snippet}
		</FormSpy>
		<form onsubmit={handleSubmit}>{toStringOrUndefined(state.values?.firstName)}</form>
	{/snippet}
</Form>
