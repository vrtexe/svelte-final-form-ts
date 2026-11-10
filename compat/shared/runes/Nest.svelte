<!-- One component level between a Form and the content passed in. -->
<script lang="ts">
	let { children } = $props();
</script>

<div>{@render children()}</div>
