<!--
	Shows the mode this consumer compiled in: a plain `let` updates the view in non-runes mode only.
-->
<script>
	let count = 0;
</script>

<button type="button" on:click={() => (count += 1)}>Count</button>
<output data-testid="mode-count">{count}</output>
