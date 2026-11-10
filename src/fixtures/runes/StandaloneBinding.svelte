<!-- A runes Field and FormSpy given a standalone form through the form prop, with no enclosing Form. -->
<script lang="ts">
	import { Field, FormSpy, type TypedFormApi } from '$lib/runes/index.js';
	import type { Profile } from '../../specs/suite.js';

	let { form }: { form: TypedFormApi<Profile> } = $props();
</script>

<Field {form} name="firstName">
	{#snippet children({ input, meta })}
		<output data-testid="field-value">{input.value}</output>
		<output data-testid="field-touched">{String(meta.touched)}</output>
		<button type="button" onclick={() => input.onChange('Typed')}>Type</button>
	{/snippet}
</Field>
<FormSpy {form} subscription={{ values: true }}>
	{#snippet children({ state, form: spyForm })}
		<output data-testid="spy-first-name">{state.values.firstName}</output>
		<button type="button" onclick={() => spyForm.change('firstName', 'Spy')}>Spy change</button>
	{/snippet}
</FormSpy>
