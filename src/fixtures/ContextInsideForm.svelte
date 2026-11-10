<!-- Provides the form context through a legacy Form, so ContextProbe can compare getContext(FORM) with getForm(). -->
<script lang="ts">
	import { Form } from '$lib/index.js';
	import ContextProbe from './ContextProbe.svelte';

	let { onFound }: { onFound: (found: { context: unknown; form?: unknown }) => void } = $props();
</script>

<Form onSubmit={() => undefined}>
	<ContextProbe withGetForm {onFound} />
</Form>
