<!-- A form whose content calls getForm two levels deep (button "Set Elena"). -->
<script lang="ts">
	import { Form } from '$lib/runes/index.js';
	import type { Profile } from '../../specs/suite.js';
	import NestedMiddle from './NestedMiddle.svelte';

	const onSubmit = (values: Profile): undefined => void values;
</script>

<Form {onSubmit} initialValues={{ firstName: 'Ana' }}>
	{#snippet children({ state })}
		<NestedMiddle />
		<output data-testid="form-state">{JSON.stringify(state)}</output>
	{/snippet}
</Form>
