<!-- An outer form with firstName "Outer" around an inner form with firstName "Inner". -->
<script>
	import { Form } from 'svelte-final-form-ts';
	import Probe from './Probe.svelte';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Outer' }}>
	<Form onSubmit={() => undefined} initialValues={{ firstName: 'Inner' }}>
		<Probe />
	</Form>
</Form>
