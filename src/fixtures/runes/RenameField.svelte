<!-- RenameFieldProps in src/specs/suite.ts. -->
<script lang="ts">
	import { Field, Form } from '$lib/runes/index.js';
	import type { Profile, RenameFieldProps } from '../../specs/suite.js';
	import FormHandout from './FormHandout.svelte';

	let { name, onForm }: RenameFieldProps = $props();
	const onSubmit = (values: Profile): undefined => void values;
</script>

<Form {onSubmit} initialValues={{ firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } }}>
	{#snippet children({ form })}
		<FormHandout {onForm} />
		<Field {form} {name}>
			{#snippet children({ input })}
				<output data-testid="input:field"
					>{JSON.stringify({ name: input.name, value: input.value })}</output
				>
			{/snippet}
		</Field>
	{/snippet}
</Form>
