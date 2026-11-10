<!-- Uses getForm, a Field or a FormSpy with no enclosing Form and no form prop. -->
<script lang="ts">
	import { Field, FormSpy } from 'svelte-final-form-ts/runes';
	import { config } from './setup.js';
	import Probe from './Probe.svelte';

	const { outside } = config;
</script>

{#if outside === 'getForm'}
	<Probe />
{:else if outside === 'Field'}
	<Field name="firstName">
		{#snippet children({ input })}{input.value}{/snippet}
	</Field>
{:else}
	<FormSpy>
		{#snippet children({ state })}{state.pristine}{/snippet}
	</FormSpy>
{/if}
