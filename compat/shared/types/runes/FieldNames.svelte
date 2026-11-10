<!-- "Field names that are not paths of the form values are rejected", with snippet content. -->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts/runes';

	const initialValues = {
		firstName: 'Ana',
		age: 30,
		address: { city: 'Skopje', zip: '1000' },
		newsletter: true
	};
</script>

<Form onSubmit={() => undefined} {initialValues}>
	{#snippet children({ form })}
		<Field {form} name="firstName">{#snippet children()}{/snippet}</Field>
		<Field {form} name="address.city">{#snippet children()}{/snippet}</Field>
		<Field {form} name="address">{#snippet children()}{/snippet}</Field>
		<Field {form} name="firstname">{#snippet children()}{/snippet}</Field>
		<Field {form} name="address.town">{#snippet children()}{/snippet}</Field>
		<Field {form} name="">{#snippet children()}{/snippet}</Field>
	{/snippet}
</Form>
