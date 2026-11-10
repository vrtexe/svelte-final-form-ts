<!-- Calls getForm, hands the result to onForm and renders a "Set Elena" button that uses it. -->
<svelte:options runes={false} />

<script lang="ts">
	import { getForm } from '$lib/index.js';
	import type { Profile } from '../../specs/suite.js';

	export let onForm: ((form: ReturnType<typeof getForm<Profile>>) => void) | undefined = undefined;

	const form = getForm<Profile>();
	onForm?.(form);
</script>

<button type="button" data-testid="set-elena" on:click={() => form.change('firstName', 'Elena')}>
	Set Elena
</button>
