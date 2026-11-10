<!-- DerivedLabelProps in src/specs/suite.ts. -->
<script lang="ts">
	import { Form } from '$lib/runes/index.js';
	import type { DerivedLabelProps } from '../../specs/suite.js';
	import SubmitLabel from './SubmitLabel.svelte';

	let { onSubmit }: DerivedLabelProps = $props();
</script>

<Form {onSubmit}>
	{#snippet children({ state, handleSubmit })}
		<form onsubmit={handleSubmit}>
			<SubmitLabel submitting={state.submitting} />
		</form>
	{/snippet}
</Form>
