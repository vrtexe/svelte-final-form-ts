<!--
	"Form values are inferred from onSubmit without explicit generics": no initialValues, and
	"address.code" is the only error.
-->
<script lang="ts">
	import { Field, Form } from 'svelte-final-form-ts';

	type Profile = {
		firstName: string;
		age: number;
		address: { city: string; zip: string };
		newsletter: boolean;
	};

	const onSubmit = (values: Profile): undefined => void values;
</script>

<Form {onSubmit} let:form>
	<Field {form} name="address.zip" />
	<Field {form} name="address.code" />
</Form>
