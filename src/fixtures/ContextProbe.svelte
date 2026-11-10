<!-- Calls getContext(FORM) and, with `withGetForm`, getForm, then hands both to `onFound`. -->
<script lang="ts">
	import { getContext, untrack } from 'svelte';
	import { FORM, getForm } from '$lib/index.js';

	let {
		onFound,
		withGetForm = false
	}: {
		onFound: (found: { context: unknown; form?: unknown }) => void;
		withGetForm?: boolean;
	} = $props();

	const context = getContext(FORM);

	untrack(() =>
		onFound({
			context,
			form: withGetForm ? getForm() : undefined
		})
	);
</script>
