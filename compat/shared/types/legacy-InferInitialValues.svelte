<!--
	"Form values are inferred from initialValues without explicit generics": "lastName" is the only
	error.
-->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts';
</script>

<Form onSubmit={() => undefined} initialValues={{ firstName: 'Ana', age: 30 }} let:form>
	<Field {form} name="firstName" />
	<Field {form} name="lastName" />
</Form>
