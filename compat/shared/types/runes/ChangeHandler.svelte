<!-- "The change handler rejects a value of the wrong type", with snippet content. -->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts/runes';
	import type { Profile } from '../../runes/setup.js';

	const onSubmit = (values: Profile) => console.log(values);
</script>

<Form {onSubmit}>
	{#snippet children({ form })}
		<Field {form} name="age">
			{#snippet children({ input })}
				<button type="button" onclick={() => input.onChange('thirty')}>Change</button>
			{/snippet}
		</Field>
	{/snippet}
</Form>
