<!-- A Field and a FormSpy inside an inner form, both given the outer form through the form prop. -->
<script lang="ts">
	import { Field, Form, FormSpy } from '$lib/index.js';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Outer' }} let:form={outer}>
	<Form onSubmit={() => undefined} initialValues={{ firstName: 'Inner' }}>
		<Field form={outer} name="firstName" let:input>
			<output data-testid="field-value">{input.value}</output>
		</Field>
		<FormSpy form={outer} subscription={{ values: true }} let:state>
			<output data-testid="spy-values">{JSON.stringify(state.values)}</output>
		</FormSpy>
	</Form>
</Form>
