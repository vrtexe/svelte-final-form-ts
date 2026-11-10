<!--
	Passes every optional Form and Field prop through, so a spec can check that each one reaches
	final-form. Props are WiringProps in src/specs/legacy-wiring.svelte.spec.ts.
-->
<script lang="ts">
	import type { FieldSubscription, FieldValidator, FormSubscription } from 'final-form';
	import { Field, Form, type TypedFormApi } from '$lib/index.js';
	import type { FieldOptions } from '$lib/core/field.js';
	import type { FormConfig } from '$lib/core/form.js';
	import type { Profile } from '../../specs/suite.js';
	import FormHandout from './FormHandout.svelte';

	let {
		onSubmit,
		formProps = {},
		formSubscription,
		ageProps = {},
		ageSubscription,
		ageValidator,
		firstNameValidator,
		showAge = true,
		onForm
	}: {
		onSubmit: FormConfig<Profile>['onSubmit'];
		formProps?: Omit<Partial<FormConfig<Profile>>, 'onSubmit'>;
		formSubscription?: FormSubscription;
		ageProps?: Omit<FieldOptions<number>, 'getValidator'>;
		ageSubscription?: FieldSubscription;
		ageValidator?: FieldValidator<number>;
		firstNameValidator?: FieldValidator<string>;
		showAge?: boolean;
		onForm: (form: TypedFormApi<Profile>) => void;
	} = $props();
</script>

<Form {onSubmit} {...formProps} subscription={formSubscription} let:form let:handleSubmit>
	<FormHandout {onForm} />
	<form onsubmit={handleSubmit}>
		<Field {form} name="firstName" validate={firstNameValidator} let:input>
			<span>{input.value}</span>
		</Field>
		{#if showAge}
			<Field
				{form}
				name="age"
				{...ageProps}
				subscription={ageSubscription}
				validate={ageValidator}
				let:input
				let:meta
			>
				<output data-testid="input:age">{JSON.stringify({ value: input.value })}</output>
				<output data-testid="meta:age">{JSON.stringify(meta)}</output>
			</Field>
		{/if}
		<button type="submit">Submit</button>
	</form>
</Form>
