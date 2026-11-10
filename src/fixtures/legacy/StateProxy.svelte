<!-- StateProxyProps in src/specs/suite.ts. -->
<script lang="ts">
	import { Field, Form } from '$lib/index.js';
	import type { StateProxyProps } from '../../specs/suite.js';

	let { onSubmit }: StateProxyProps = $props();
	const initial = $state({ firstName: 'Ana', address: { city: 'Skopje', zip: '1000' } });
</script>

<Form {onSubmit} initialValues={initial} let:form let:handleSubmit>
	<form onsubmit={handleSubmit}>
		<Field {form} name="address.city" let:input>
			<input
				aria-label="address.city"
				value={input.value ?? ''}
				oninput={(event) => input.onChange(event.currentTarget.value)}
			/>
		</Field>
		<button type="submit">Submit</button>
	</form>
</Form>
<output data-testid="initial">{JSON.stringify(initial)}</output>
