<!--
	Unit tester: "A runes-mode consumer can pass state proxies as initial values", with snippet
	content, so it also runs under step 6's boolean compilerOptions.runes.
-->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts/runes';
	import { config } from './setup.js';

	const { onSubmit } = config;
	const initial = $state({ firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } });
</script>

<Form {onSubmit} initialValues={initial}>
	{#snippet children({ form, handleSubmit })}
		<form data-testid="form" onsubmit={handleSubmit}>
			<Field {form} name="address.city">
				{#snippet children({ input })}
					<input
						data-testid="input-address.city"
						value={input.value ?? ''}
						oninput={(event) => input.onChange(event.currentTarget.value)}
					/>
				{/snippet}
			</Field>
		</form>
	{/snippet}
</Form>
<pre data-testid="initial">{JSON.stringify(initial)}</pre>
