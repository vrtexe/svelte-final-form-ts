<!-- RenameFieldProps in src/specs/suite.ts. -->
<svelte:options runes={false} />

<script lang="ts">
	import { Field, Form } from '$lib/index.js';
	import type { Profile, RenameFieldProps } from '../../specs/suite.js';
	import FormHandout from './FormHandout.svelte';

	export let name: RenameFieldProps['name'];
	export let onForm: RenameFieldProps['onForm'];
	const onSubmit = (values: Profile): undefined => void values;
</script>

<Form
	{onSubmit}
	initialValues={{ firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } }}
	let:form
>
	<FormHandout {onForm} />
	<Field {form} {name} let:input>
		<output data-testid="input:field"
			>{JSON.stringify({ name: input.name, value: input.value })}</output
		>
	</Field>
</Form>
