<!--
	"The change handler rejects a value of the wrong type": the string "thirty" is the only error.
-->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Ana', age: 30 }} let:form>
	<Field {form} name="age" let:input>
		<button type="button" on:click={() => input.onChange(31)}>31</button>
		<button type="button" on:click={() => input.onChange('thirty')}>thirty</button>
	</Field>
</Form>
