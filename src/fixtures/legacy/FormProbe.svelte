<!-- Calls getForm, hands the result to onForm and renders a "Set Elena" button that uses it. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { getForm } from '$lib/index.js';
	import type { Profile } from '../../specs/suite.js';

	let { onForm }: { onForm?: (form: ReturnType<typeof getForm<Profile>>) => void } = $props();

	const form = getForm<Profile>();
	untrack(() => onForm)?.(form);
</script>

<button type="button" data-testid="set-elena" onclick={() => form.change('firstName', 'Elena')}>
	Set Elena
</button>
