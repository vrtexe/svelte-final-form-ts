<!-- The profile form from a non-runes consumer; the props are ProfileProps in src/specs/suite.ts. -->
<svelte:options runes={false} />

<script lang="ts">
	import { Field, Form, FormSpy } from '$lib/index.js';
	import type { ProfileFieldName, ProfileProps } from '../../specs/suite.js';
	import FormHandout from './FormHandout.svelte';

	export let onSubmit: ProfileProps['onSubmit'];
	export let initialValues: ProfileProps['initialValues'] = undefined;
	export let validate: ProfileProps['validate'] = undefined;
	export let formSubscription: ProfileProps['formSubscription'] = undefined;
	export let fieldSubscription: ProfileProps['fieldSubscription'] = undefined;
	export let spySubscription: ProfileProps['spySubscription'] = undefined;
	export let spyOnChange: ProfileProps['spyOnChange'] = undefined;
	export let ageValidator: ProfileProps['ageValidator'] = undefined;
	export let fields: ProfileFieldName[] = ['firstName', 'age', 'address.city', 'address.zip'];
	export let onForm: ProfileProps['onForm'] = undefined;
	export let onRender: ProfileProps['onRender'] = undefined;

	// Reads `fields` so the calling template expression re-runs when it changes.
	const shows = (name: ProfileFieldName, current: ProfileFieldName[]): boolean =>
		current.includes(name);

	// Reads its arguments so the calling template expression re-runs when they change.
	const rendered = (id: string, ...content: unknown[]): string => {
		void content;
		onRender?.(id);
		return '';
	};

	const handlers = (input: { onChange: unknown; onFocus: unknown; onBlur: unknown }): string[] => [
		typeof input.onChange,
		typeof input.onFocus,
		typeof input.onBlur
	];
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
	<FormHandout {onForm} />
	{rendered('form', state)}
	<form on:submit={handleSubmit}>
		{#if shows('firstName', fields)}
			<Field {form} name="firstName" subscription={fieldSubscription} let:input let:meta>
				{rendered('field:firstName', input, meta)}
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
						handlers: handlers(input)
					})}</output
				>
				<output data-testid="meta:firstName">{JSON.stringify(meta)}</output>
			</Field>
		{/if}
		{#if shows('age', fields)}
			<Field
				{form}
				name="age"
				subscription={fieldSubscription}
				validate={ageValidator}
				let:input
				let:meta
			>
				{rendered('field:age', input, meta)}
				<input
					aria-label="age"
					type="number"
					value={input.value ?? ''}
					on:input={(event) => input.onChange(event.currentTarget.valueAsNumber)}
					on:focus={input.onFocus}
					on:blur={input.onBlur}
				/>
				<output data-testid="input:age"
					>{JSON.stringify({ name: input.name, value: input.value })}</output
				>
				<output data-testid="meta:age">{JSON.stringify(meta)}</output>
			</Field>
		{/if}
		{#if shows('address.city', fields)}
			<Field {form} name="address.city" subscription={fieldSubscription} let:input let:meta>
				{rendered('field:address.city', input, meta)}
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
		{#if shows('address.zip', fields)}
			<Field {form} name="address.zip" subscription={fieldSubscription} let:input let:meta>
				{rendered('field:address.zip', input, meta)}
				<input
					aria-label="address.zip"
					value={input.value ?? ''}
					on:input={(event) => input.onChange(event.currentTarget.value)}
					on:focus={input.onFocus}
					on:blur={input.onBlur}
				/>
				<output data-testid="meta:address.zip">{JSON.stringify(meta)}</output>
			</Field>
		{/if}
		{#if spySubscription}
			<FormSpy
				subscription={spySubscription}
				onChange={spyOnChange}
				let:state={spyState}
				let:form={spyForm}
			>
				{rendered('spy', spyState)}
				<output data-testid="spy-state">{JSON.stringify(spyState)}</output>
				<button type="button" data-testid="spy-set-age" on:click={() => spyForm.change('age', 42)}
					>Set age</button
				>
			</FormSpy>
		{/if}
		<button
			type="button"
			data-testid="set-elena"
			on:click={() => form.change('firstName', 'Elena')}
		>
			Set Elena
		</button>
		<button type="submit">Submit</button>
	</form>
	<output data-testid="form-state">{JSON.stringify(state)}</output>
</Form>
