<!-- OutsideFormProps in src/specs/suite.ts. -->
<script lang="ts">
	import { Field, FormSpy } from '$lib/index.js';
	import type { OutsideFormProps } from '../../specs/suite.js';
	import FormProbe from './FormProbe.svelte';

	let { which }: OutsideFormProps = $props();
</script>

{#if which === 'getForm'}
	<FormProbe />
{:else if which === 'Field'}
	<Field name="firstName" let:input><span>{input.value}</span></Field>
{:else}
	<FormSpy let:state><span>{JSON.stringify(state)}</span></FormSpy>
{/if}
