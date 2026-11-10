<!-- A Form without onSubmit; the cast bypasses the type check on purpose. -->
<script lang="ts">
	import { Form } from '$lib/runes/index.js';

	const onSubmit = undefined as unknown as () => undefined;
</script>

<Form {onSubmit}>
	<span>never rendered</span>
</Form>
