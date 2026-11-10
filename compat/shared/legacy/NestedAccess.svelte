<!-- A form whose content calls getForm two levels deep: NestedAccess, Nest, Probe. -->
<script>
	import { Form } from 'svelte-final-form-ts';
	import Nest from './Nest.svelte';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Ana' }} let:state>
	<Nest />
	<output data-testid="form-state">{JSON.stringify(state)}</output>
</Form>
