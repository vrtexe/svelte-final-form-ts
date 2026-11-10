<!-- A submit button whose label is derived from the submitting flag it gets. -->
<script lang="ts">
	let { submitting }: { submitting: boolean | undefined } = $props();
	const label = $derived(submitting ? 'Saving' : 'Save');
</script>

<button type="submit" data-testid="submit-label">{label}</button>
