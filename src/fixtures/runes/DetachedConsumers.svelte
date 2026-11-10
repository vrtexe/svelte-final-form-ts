<!-- A Field and a FormSpy with no enclosing Form, both given a form API through the form prop. -->
<script lang="ts">
	import { Field, FormSpy, type TypedFormApi } from '$lib/runes/index.js';
	import type { Profile } from '../../specs/suite.js';

	let { form }: { form: TypedFormApi<Profile> } = $props();
</script>

<Field {form} name="firstName">
	{#snippet children({ input })}
		<output data-testid="detached-field">{input.value}</output>
	{/snippet}
</Field>
<FormSpy {form} subscription={{ values: true }}>
	{#snippet children({ state })}
		<output data-testid="detached-spy">{JSON.stringify(state.values)}</output>
	{/snippet}
</FormSpy>
