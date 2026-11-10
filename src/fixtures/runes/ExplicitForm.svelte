<!-- A Field and a FormSpy inside an inner form, both given the outer form through the form prop. -->
<script lang="ts">
	import { Field, Form, FormSpy } from '$lib/runes/index.js';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Outer' }}>
	{#snippet children({ form: outer })}
		<Form onSubmit={() => undefined} initialValues={{ firstName: 'Inner' }}>
			<Field form={outer} name="firstName">
				{#snippet children({ input })}
					<output data-testid="field-value">{input.value}</output>
				{/snippet}
			</Field>
			<FormSpy form={outer} subscription={{ values: true }}>
				{#snippet children({ state })}
					<output data-testid="spy-values">{JSON.stringify(state.values)}</output>
				{/snippet}
			</FormSpy>
		</Form>
	{/snippet}
</Form>
