<!-- StateProxyProps in src/specs/suite.ts. -->
<script lang="ts">
	import { Field, Form } from '$lib/runes/index.js';
	import type { StateProxyProps } from '../../specs/suite.js';

	let { onSubmit }: StateProxyProps = $props();
	const initial = $state({ firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } });
</script>

<Form {onSubmit} initialValues={initial}>
	{#snippet children({ form, handleSubmit })}
		<form onsubmit={handleSubmit}>
			<Field {form} name="address.city">
				{#snippet children({ input })}
					<input
						aria-label="address.city"
						value={input.value ?? ''}
						oninput={(event) => input.onChange(event.currentTarget.value)}
					/>
				{/snippet}
			</Field>
			<button type="submit">Submit</button>
		</form>
	{/snippet}
</Form>
<output data-testid="initial">{JSON.stringify(initial)}</output>
