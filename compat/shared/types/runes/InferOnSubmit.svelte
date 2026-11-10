<!-- "Form values are inferred from onSubmit without explicit generics", with snippet content. -->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts/runes';
	import type { Profile } from '../../runes/setup.js';

	const onSubmit = (values: Profile) => console.log(values);
</script>

<Form {onSubmit}>
	{#snippet children({ form })}
		<Field {form} name="address.zip">{#snippet children()}{/snippet}</Field>
		<Field {form} name="address.code">{#snippet children()}{/snippet}</Field>
	{/snippet}
</Form>
