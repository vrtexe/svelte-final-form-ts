<!--
	Unit tester: "A runes-mode consumer reacts to form state with derived values", with snippet
	content.
-->
<script lang="ts">
	import { Form } from 'svelte-final-form-ts/runes';
	import { config } from './setup.js';
	import SubmitLabel from './SubmitLabel.svelte';

	const { onSubmit } = config;
</script>

<Form {onSubmit}>
	{#snippet children({ state, handleSubmit })}
		<form data-testid="form" onsubmit={handleSubmit}>
			<SubmitLabel submitting={state.submitting} />
		</form>
	{/snippet}
</Form>
