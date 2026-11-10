<!-- OutsideFormProps in src/specs/suite.ts. -->
<svelte:options runes={false} />

<script lang="ts">
	import { Field, FormSpy } from '$lib/index.js';
	import type { OutsideFormProps } from '../../specs/suite.js';
	import FormProbeNonRunes from './FormProbeNonRunes.svelte';

	export let which: OutsideFormProps['which'];
</script>

{#if which === 'getForm'}
	<FormProbeNonRunes />
{:else if which === 'Field'}
	<Field name="firstName" let:input><span>{input.value}</span></Field>
{:else}
	<FormSpy let:state><span>{JSON.stringify(state)}</span></FormSpy>
{/if}
