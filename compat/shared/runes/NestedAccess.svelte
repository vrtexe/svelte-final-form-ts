<!-- A component two levels below the Form content obtains the form API through getForm. -->
<script lang="ts">
	import { Form } from 'svelte-final-form-ts/runes';
	import { config } from './setup.js';
	import Nest from './Nest.svelte';
	import Probe from './Probe.svelte';

	const { onSubmit, initialValues } = config;
</script>

<Form {onSubmit} {initialValues}>
	{#snippet children({ state })}
		<Nest>
			<Nest>
				<Probe />
			</Nest>
		</Nest>
		<pre data-testid="form-state">{JSON.stringify(state)}</pre>
	{/snippet}
</Form>
