<!-- DerivedLabelProps in src/specs/suite.ts. -->
<script lang="ts">
	import { Form } from '$lib/index.js';
	import type { DerivedLabelProps } from '../../specs/suite.js';
	import SubmitLabel from './SubmitLabel.svelte';

	let { onSubmit }: DerivedLabelProps = $props();
</script>

<Form {onSubmit} let:state let:handleSubmit>
	<form onsubmit={handleSubmit}>
		<SubmitLabel submitting={state.submitting} />
	</form>
</Form>
