<!-- "Form values are inferred from initialValues without explicit generics", with snippet content. -->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts/runes';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Ana', age: 30 }}>
	{#snippet children({ form })}
		<Field {form} name="firstName">{#snippet children()}{/snippet}</Field>
		<Field {form} name="lastName">{#snippet children()}{/snippet}</Field>
	{/snippet}
</Form>
