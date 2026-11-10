<!-- One field whose name follows the fieldName store. -->
<script>
	import { Field, Form } from 'svelte-final-form-ts';
	import Probe from './Probe.svelte';
	import { fieldName } from './setup.js';
</script>

<Form
	onSubmit={() => undefined}
	initialValues={{ firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } }}
	let:form
>
	<Probe />
	<Field {form} name={$fieldName} let:input>
		<output data-testid="input:field"
			>{JSON.stringify({ name: input.name, value: input.value })}</output
		>
	</Field>
</Form>
