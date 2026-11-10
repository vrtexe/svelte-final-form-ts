<!--
	NestedFormsProps in src/specs/suite.ts. The form values are inferred from initialValues: no
	generic argument and an onSubmit without a typed parameter.
-->
<script lang="ts">
	import { Field, Form } from '$lib/index.js';
	import type { NestedFormsProps } from '../../specs/suite.js';
	import FormProbe from './FormProbe.svelte';

	let { onForm }: NestedFormsProps = $props();
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Outer' }} let:form>
	<Field {form} name="firstName" let:input><span>{input.value}</span></Field>
	<Form onSubmit={() => undefined} initialValues={{ firstName: 'Inner' }}>
		<FormProbe {onForm} />
	</Form>
</Form>
