<!-- Unit tester: derives a label from the submitting flag it receives. -->
<script lang="ts">
	let { submitting } = $props();
	const label = $derived(submitting ? 'Saving' : 'Save');
</script>

<span data-testid="label">{label}</span>
