<!-- Renders what `config.outside` names (getForm, Field or FormSpy) with no enclosing Form. -->
<script>
	import { Field, FormSpy } from 'svelte-final-form-ts';
	import Probe from './Probe.svelte';
	import { config } from './setup.js';

	const { outside } = config;
</script>

{#if outside === 'getForm'}
	<Probe />
{:else if outside === 'Field'}
	<Field name="firstName" let:input><span>{input.value}</span></Field>
{:else}
	<FormSpy let:state><span>{JSON.stringify(state)}</span></FormSpy>
{/if}
