<!--
	NestedFormsProps in src/specs/suite.ts. The form values are inferred from initialValues: no
	generic argument and an onSubmit without a typed parameter.
-->
<svelte:options runes={false} />

<script lang="ts">
	import { Field, Form } from '$lib/index.js';
	import type { NestedFormsProps } from '../../specs/suite.js';
	import FormProbeNonRunes from './FormProbeNonRunes.svelte';

	export let onForm: NestedFormsProps['onForm'];
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Outer' }} let:form>
	<Field {form} name="firstName" let:input><span>{input.value}</span></Field>
	<Form onSubmit={() => undefined} initialValues={{ firstName: 'Inner' }}>
		<FormProbeNonRunes {onForm} />
	</Form>
</Form>
