<!--
	The profile form with snippet content. Each mounted field, the form spy and the form content
	render their state as JSON and a render counter under a test id.
-->
<script lang="ts">
	import { Field, Form, FormSpy } from 'svelte-final-form-ts/runes';
	import { config, fields, rendered, toAge } from './setup.js';
	import Probe from './Probe.svelte';

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

<Form {onSubmit} {initialValues} {validate} subscription={formSubscription}>
	{#snippet children({ form, state, handleSubmit })}
		<Probe />
		<form data-testid="form" onsubmit={handleSubmit}>
			{#if $fields.includes('firstName')}
				<Field {form} name="firstName" subscription={fieldSubscription}>
					{#snippet children({ input, meta })}
						<input
							data-testid="input-firstName"
							value={input.value ?? ''}
							oninput={(event) => input.onChange(event.currentTarget.value)}
							onfocus={input.onFocus}
							onblur={input.onBlur}
						/>
						<pre data-testid="field-firstName">{JSON.stringify({
								name: input.name,
								value: input.value,
								handlers: [typeof input.onChange, typeof input.onFocus, typeof input.onBlur],
								meta
							})}</pre>
						<span data-testid="renders-firstName">{rendered('firstName', input, meta)}</span>
					{/snippet}
				</Field>
			{/if}
			{#if $fields.includes('age')}
				<Field {form} name="age" subscription={fieldSubscription} validate={ageValidator}>
					{#snippet children({ input, meta })}
						<input
							data-testid="input-age"
							type="number"
							value={input.value ?? ''}
							oninput={(event) => input.onChange(toAge(event.currentTarget.value))}
							onfocus={input.onFocus}
							onblur={input.onBlur}
						/>
						<pre data-testid="field-age">{JSON.stringify({ value: input.value, meta })}</pre>
						<span data-testid="renders-age">{rendered('age', input, meta)}</span>
					{/snippet}
				</Field>
			{/if}
			{#if $fields.includes('address.city')}
				<Field {form} name="address.city" subscription={fieldSubscription}>
					{#snippet children({ input, meta })}
						<input
							data-testid="input-address.city"
							value={input.value ?? ''}
							oninput={(event) => input.onChange(event.currentTarget.value)}
							onfocus={input.onFocus}
							onblur={input.onBlur}
						/>
						<pre data-testid="field-address.city">{JSON.stringify({
								value: input.value,
								meta
							})}</pre>
					{/snippet}
				</Field>
			{/if}
			<FormSpy {form} subscription={spySubscription}>
				{#snippet children({ state: spyState })}
					<pre data-testid="spy-state">{JSON.stringify(spyState)}</pre>
					<span data-testid="renders-spy">{rendered('spy', spyState)}</span>
				{/snippet}
			</FormSpy>
			<button type="button" onclick={() => form.change('firstName', 'Elena')}>
				Change through the Form content
			</button>
		</form>
		<pre data-testid="form-state">{JSON.stringify(state)}</pre>
	{/snippet}
</Form>
