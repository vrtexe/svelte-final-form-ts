<!--
	Unit tester: snippet parameters the scenario rows leave unchecked. The Form snippet's state and
	form and the Field snippet's meta are typed by the form values; each negative line has a positive
	control on the line above. Expected errors are listed in expected-errors.json.
-->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts/runes';
	import type { Profile } from '../../runes/setup.js';

	const onSubmit = (values: Profile) => console.log(values);
	const toString = (value: string) => value;
	const toStringOrUndefined = (value: string | undefined) => value;
	const toNumberOrUndefined = (value: number | undefined) => value;
</script>

<Form {onSubmit}>
	{#snippet children({ form, state })}
		{toStringOrUndefined(state.values?.firstName)}
		{toNumberOrUndefined(state.values?.firstName)}
		<button type="button" onclick={() => form.change('age', 31)}>Valid</button>
		<button type="button" onclick={() => form.change('age', 'thirty')}>Invalid</button>
		<Field {form} name="age">
			{#snippet children({ meta })}
				{toNumberOrUndefined(meta.initial)}
				{toString(meta.initial)}
			{/snippet}
		</Field>
	{/snippet}
</Form>
