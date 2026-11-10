<!--
	The profile form, configured through `config` in setup.js. The form content, each mounted field
	and the form spy show their slot props as JSON under a test id and count their renders.
-->
<script>
	import { Field, Form, FormSpy } from 'svelte-final-form-ts';
	import Probe from './Probe.svelte';
	import { config, fields, rendered, toAge } from './setup.js';

	const {
		onSubmit,
		initialValues,
		validate,
		formSubscription,
		fieldSubscription,
		spySubscription,
		ageValidator
	} = config;
</script>

<Form
	{onSubmit}
	{initialValues}
	{validate}
	subscription={formSubscription}
	let:form
	let:state
	let:handleSubmit
>
	{rendered('form', state)}
	<Probe />
	<form data-testid="form" on:submit={handleSubmit}>
		{#if $fields.includes('firstName')}
			<Field {form} name="firstName" subscription={fieldSubscription} let:input let:meta>
				{rendered('firstName', input, meta)}
				<input
					aria-label="firstName"
					value={input.value ?? ''}
					on:input={(event) => input.onChange(event.currentTarget.value)}
					on:focus={input.onFocus}
					on:blur={input.onBlur}
				/>
				<output data-testid="input:firstName"
					>{JSON.stringify({
						name: input.name,
						value: input.value,
						handlers: [typeof input.onChange, typeof input.onFocus, typeof input.onBlur]
					})}</output
				>
				<output data-testid="meta:firstName">{JSON.stringify(meta)}</output>
			</Field>
		{/if}
		{#if $fields.includes('age')}
			<Field
				{form}
				name="age"
				subscription={fieldSubscription}
				validate={ageValidator}
				let:input
				let:meta
			>
				{rendered('age', input, meta)}
				<input
					aria-label="age"
					type="number"
					value={input.value ?? ''}
					on:input={(event) => input.onChange(toAge(event.currentTarget.value))}
					on:focus={input.onFocus}
					on:blur={input.onBlur}
				/>
				<output data-testid="meta:age">{JSON.stringify(meta)}</output>
			</Field>
		{/if}
		{#if $fields.includes('address.city')}
			<Field {form} name="address.city" subscription={fieldSubscription} let:input let:meta>
				{rendered('address.city', input, meta)}
				<input
					aria-label="address.city"
					value={input.value ?? ''}
					on:input={(event) => input.onChange(event.currentTarget.value)}
					on:focus={input.onFocus}
					on:blur={input.onBlur}
				/>
				<output data-testid="input:address.city"
					>{JSON.stringify({ name: input.name, value: input.value })}</output
				>
				<output data-testid="meta:address.city">{JSON.stringify(meta)}</output>
			</Field>
		{/if}
		{#if spySubscription}
			<FormSpy subscription={spySubscription} let:state={spyState}>
				{rendered('spy', spyState)}
				<output data-testid="spy-state">{JSON.stringify(spyState)}</output>
			</FormSpy>
		{/if}
		<button type="button" on:click={() => form.change('firstName', 'Elena')}>
			Change through the Form content
		</button>
		<button type="submit">Submit</button>
	</form>
	<output data-testid="form-state">{JSON.stringify(state)}</output>
</Form>
