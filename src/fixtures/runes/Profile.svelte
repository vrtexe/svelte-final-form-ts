<!-- The profile form from a snippet consumer; the props are ProfileProps in src/specs/suite.ts. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { Field, Form, FormSpy } from '$lib/runes/index.js';
	import type { ProfileFieldName, ProfileProps } from '../../specs/suite.js';
	import FormHandout from './FormHandout.svelte';

	let {
		onSubmit,
		initialValues,
		validate,
		formSubscription,
		fieldSubscription,
		spySubscription,
		spyOnChange,
		ageValidator,
		fields = ['firstName', 'age', 'address.city', 'address.zip'],
		onForm,
		onRender
	}: ProfileProps = $props();

	const shows = (name: ProfileFieldName): boolean => fields.includes(name);

	// Depends on its arguments only, so the calling template expression re-runs when they change.
	const rendered = (id: string, ...content: unknown[]): string => {
		void content;
		untrack(() => onRender)?.(id);
		return '';
	};

	const handlers = (input: { onChange: unknown; onFocus: unknown; onBlur: unknown }): string[] => [
		typeof input.onChange,
		typeof input.onFocus,
		typeof input.onBlur
	];
</script>

<Form {onSubmit} {initialValues} {validate} subscription={formSubscription}>
	{#snippet children({ form, state, handleSubmit })}
		<FormHandout {onForm} />
		{rendered('form', state)}
		<form onsubmit={handleSubmit}>
			{#if shows('firstName')}
				<Field {form} name="firstName" subscription={fieldSubscription}>
					{#snippet children({ input, meta })}
						{rendered('field:firstName', input, meta)}
						<input
							aria-label="firstName"
							value={input.value ?? ''}
							oninput={(event) => input.onChange(event.currentTarget.value)}
							onfocus={input.onFocus}
							onblur={input.onBlur}
						/>
						<output data-testid="input:firstName"
							>{JSON.stringify({
								name: input.name,
								value: input.value,
								handlers: handlers(input)
							})}</output
						>
						<output data-testid="meta:firstName">{JSON.stringify(meta)}</output>
					{/snippet}
				</Field>
			{/if}
			{#if shows('age')}
				<Field {form} name="age" subscription={fieldSubscription} validate={ageValidator}>
					{#snippet children({ input, meta })}
						{rendered('field:age', input, meta)}
						<input
							aria-label="age"
							type="number"
							value={input.value ?? ''}
							oninput={(event) => input.onChange(event.currentTarget.valueAsNumber)}
							onfocus={input.onFocus}
							onblur={input.onBlur}
						/>
						<output data-testid="input:age"
							>{JSON.stringify({ name: input.name, value: input.value })}</output
						>
						<output data-testid="meta:age">{JSON.stringify(meta)}</output>
					{/snippet}
				</Field>
			{/if}
			{#if shows('address.city')}
				<Field {form} name="address.city" subscription={fieldSubscription}>
					{#snippet children({ input, meta })}
						{rendered('field:address.city', input, meta)}
						<input
							aria-label="address.city"
							value={input.value ?? ''}
							oninput={(event) => input.onChange(event.currentTarget.value)}
							onfocus={input.onFocus}
							onblur={input.onBlur}
						/>
						<output data-testid="input:address.city"
							>{JSON.stringify({ name: input.name, value: input.value })}</output
						>
						<output data-testid="meta:address.city">{JSON.stringify(meta)}</output>
					{/snippet}
				</Field>
			{/if}
			{#if shows('address.zip')}
				<Field {form} name="address.zip" subscription={fieldSubscription}>
					{#snippet children({ input, meta })}
						{rendered('field:address.zip', input, meta)}
						<input
							aria-label="address.zip"
							value={input.value ?? ''}
							oninput={(event) => input.onChange(event.currentTarget.value)}
							onfocus={input.onFocus}
							onblur={input.onBlur}
						/>
						<output data-testid="meta:address.zip">{JSON.stringify(meta)}</output>
					{/snippet}
				</Field>
			{/if}
			{#if spySubscription}
				<FormSpy subscription={spySubscription} onChange={spyOnChange}>
					{#snippet children({ state: spyState, form: spyForm })}
						{rendered('spy', spyState)}
						<output data-testid="spy-state">{JSON.stringify(spyState)}</output>
						<button
							type="button"
							data-testid="spy-set-age"
							onclick={() => spyForm.change('age', 42)}>Set age</button
						>
					{/snippet}
				</FormSpy>
			{/if}
			<button
				type="button"
				data-testid="set-elena"
				onclick={() => form.change('firstName', 'Elena')}
			>
				Set Elena
			</button>
			<button type="submit">Submit</button>
		</form>
		<output data-testid="form-state">{JSON.stringify(state)}</output>
	{/snippet}
</Form>
