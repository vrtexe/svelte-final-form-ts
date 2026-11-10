<!-- A mounted field whose name comes from a store, so a test can change it at runtime. -->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts/runes';
	import { fieldName } from './setup.js';
	import Probe from './Probe.svelte';
</script>

<Form
	onSubmit={() => undefined}
	initialValues={{ firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } }}
>
	{#snippet children({ form })}
		<Probe />
		<Field {form} name={$fieldName}>
			{#snippet children({ input })}
				<pre data-testid="field">{JSON.stringify({ name: input.name, value: input.value })}</pre>
			{/snippet}
		</Field>
	{/snippet}
</Form>
