<!-- "The field value is typed from its path", with snippet content. -->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts/runes';

	const initialValues = {
		firstName: 'Ana',
		age: 30,
		address: { city: 'Skopje', zip: '1000' },
		newsletter: true
	};
	const toNumberOrUndefined = (value: number | undefined) => value;
	const toString = (value: string) => value;
	const toStringOrUndefined = (value: string | undefined) => value;
	const toBooleanOrUndefined = (value: boolean | undefined) => value;
	const toNumber = (value: number) => value;
</script>

<Form onSubmit={() => undefined} {initialValues}>
	{#snippet children({ form })}
		<Field {form} name="age">
			{#snippet children({ input })}{toNumberOrUndefined(input.value)}{/snippet}
		</Field>
		<Field {form} name="age">
			{#snippet children({ input })}{toString(input.value)}{/snippet}
		</Field>
		<Field {form} name="address.city">
			{#snippet children({ input })}{toStringOrUndefined(input.value)}{/snippet}
		</Field>
		<Field {form} name="newsletter">
			{#snippet children({ input })}{toBooleanOrUndefined(input.value)}{/snippet}
		</Field>
		<Field {form} name="newsletter">
			{#snippet children({ input })}{toNumber(input.value)}{/snippet}
		</Field>
	{/snippet}
</Form>
