<!-- A form whose content calls getForm two levels deep (button "Set Elena"). -->
<svelte:options runes={false} />

<script lang="ts">
	import { Form } from '$lib/index.js';
	import type { Profile } from '../../specs/suite.js';
	import NestedMiddleNonRunes from './NestedMiddleNonRunes.svelte';

	const onSubmit = (values: Profile): undefined => void values;
</script>

<Form {onSubmit} initialValues={{ firstName: 'Ana' }} let:state>
	<NestedMiddleNonRunes />
	<output data-testid="form-state">{JSON.stringify(state)}</output>
</Form>
