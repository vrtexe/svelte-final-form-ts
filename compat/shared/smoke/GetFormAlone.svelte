<script>
	// Plain JavaScript so that Svelte 4 compiles it without a preprocessor.
	import { getForm } from 'svelte-final-form-ts';

	let message = 'no error';
	try {
		getForm();
	} catch (e) {
		message = e instanceof Error ? e.message : String(e);
	}
</script>

<p>{message}</p>
