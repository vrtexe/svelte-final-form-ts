<!-- OutsideFormProps in src/specs/suite.ts. -->
<script lang="ts">
	import { Field, FormSpy } from '$lib/runes/index.js';
	import type { OutsideFormProps } from '../../specs/suite.js';
	import FormProbe from './FormProbe.svelte';

	let { which }: OutsideFormProps = $props();
</script>

{#if which === 'getForm'}
	<FormProbe />
{:else if which === 'Field'}
	<Field name="firstName">
		{#snippet children({ input })}<span>{input.value}</span>{/snippet}
	</Field>
{:else}
	<FormSpy>
		{#snippet children({ state })}<span>{JSON.stringify(state)}</span>{/snippet}
	</FormSpy>
{/if}
