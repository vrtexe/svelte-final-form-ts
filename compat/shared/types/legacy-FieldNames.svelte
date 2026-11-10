<!--
	"Field names that are not paths of the form values are rejected": the values are inferred from
	initialValues. Only the last three names are errors (expected-errors.json).
-->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts';

	const initialValues = {
		firstName: 'Ana',
		age: 30,
		address: { city: 'Skopje', zip: '1000' },
		newsletter: false
	};
</script>

<Form onSubmit={() => undefined} {initialValues} let:form>
	<Field {form} name="firstName" />
	<Field {form} name="address.city" />
	<Field {form} name="address" />
	<Field {form} name="firstname" />
	<Field {form} name="address.town" />
	<Field {form} name="" />
</Form>
