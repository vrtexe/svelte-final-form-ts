<!-- A Form without onSubmit. Plain JavaScript, so no type check stands in the way. -->
<script>
	import { Form } from 'svelte-final-form-ts';
</script>

<Form initialValues={{ firstName: 'Ana' }}><span>never rendered</span></Form>
