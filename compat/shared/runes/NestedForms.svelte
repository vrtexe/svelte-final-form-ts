<!-- An inner form inside an outer one; getForm inside the inner form returns the inner API. -->
<script lang="ts">
	import { Form } from 'svelte-final-form-ts/runes';
	import { config } from './setup.js';
	import Probe from './Probe.svelte';

	// No type annotations on declarations in the fixtures: svelte 5.0.0 fails to compile them
	// under vite-plugin-svelte ("Not implemented type annotation EmptyStatement").
	const { onSubmit } = config;
</script>

<!-- Content without parameters becomes the implicit children snippet. -->
<Form {onSubmit} initialValues={{ firstName: 'Outer' }}>
	<Form {onSubmit} initialValues={{ firstName: 'Inner' }}>
		<Probe />
	</Form>
</Form>
