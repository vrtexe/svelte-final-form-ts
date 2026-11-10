<!--
	A plain let updates the view only when the file compiles in non-runes mode, which shows the mode
	the consumer's compilerOptions put this snippet-set consumer in.
-->
<script lang="ts">
	let count = 0;
</script>

<button type="button" onclick={() => count++}>Count</button>
<span data-testid="mode-count">{count}</span>
